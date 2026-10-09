import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "./http.ts";
import { handleRefresh } from "./refresh.ts";
import { handleAsk } from "./ask.ts";

Deno.serve(async (req: Request) => {
  const corsHdrs = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHdrs });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, corsHdrs, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, corsHdrs, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Not authenticated" }, corsHdrs, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "refresh") return await handleRefresh(supabase, corsHdrs);
    if (action === "ask") return await handleAsk(supabase, String(body?.query ?? ""), corsHdrs);

    return jsonResponse({ error: `Unknown action: ${action}` }, corsHdrs, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, corsHeaders(req.headers.get("origin")), 500);
  }
});
