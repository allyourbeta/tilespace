import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://personal-knowledge-d-d1h1.bolt.host",
  "http://localhost:5173", // Local development
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

// Inbox tile configuration
const INBOX_TILE = {
  TITLE: "Inbox",
  EMOJI: "📥",
  COLOR: "#64748B",
} as const;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { url, title } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate URL format
    if (!isValidUrl(normalizedUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const linkTitle = title?.trim() || extractDomain(normalizedUrl);

    const { data: existingInbox } = await supabase
      .from("tiles")
      .select("id")
      .eq("title", INBOX_TILE.TITLE)
      .maybeSingle();

    let inboxId: string;

    if (existingInbox) {
      inboxId = existingInbox.id;
    } else {
      const { data: newId, error: createError } = await supabase
        .rpc("create_tile_safe", {
          p_title: INBOX_TILE.TITLE,
          p_emoji: INBOX_TILE.EMOJI,
          p_accent_color: INBOX_TILE.COLOR,
          p_color_index: 0,
        });

      if (createError) {
        throw createError;
      }

      inboxId = newId;
    }

    const { data: maxLinkPosition } = await supabase
      .from("links")
      .select("position")
      .eq("tile_id", inboxId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const linkPosition = (maxLinkPosition?.position ?? -1) + 1;

    const { error: insertError } = await supabase
      .from("links")
      .insert({
        tile_id: inboxId,
        title: linkTitle,
        url: normalizedUrl,
        summary: "",
        position: linkPosition,
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Link saved to Inbox" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});