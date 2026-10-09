import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { completeJSON } from "../_shared/aiClient.ts";
import { extractAskResults } from "./logic.ts";
import { jsonResponse } from "./http.ts";

export async function handleAsk(supabase: SupabaseClient, query: string, corsHdrs: Record<string, string>) {
  if (!query || !query.trim()) {
    return jsonResponse({ results: [] }, corsHdrs);
  }

  const { data: docs, error: docsErr } = await supabase.from("links").select("id, title").eq("type", "document");
  if (docsErr) throw docsErr;
  const { data: insights, error: insightsErr } = await supabase
    .from("doc_insight")
    .select("link_id, summary")
    .not("summary", "eq", "");
  if (insightsErr) throw insightsErr;

  const titleById = new Map<string, string>((docs ?? []).map((d: { id: string; title: string }) => [d.id, d.title]));
  const pool = (insights ?? [])
    .filter((i: { link_id: string; summary: string }) => titleById.has(i.link_id))
    .map((i: { link_id: string; summary: string }) => ({
      link_id: i.link_id,
      title: titleById.get(i.link_id) ?? "",
      summary: i.summary,
    }));

  if (pool.length === 0) {
    return jsonResponse({ results: [] }, corsHdrs);
  }

  try {
    const found = await completeJSON<unknown>([
      {
        role: "system",
        content:
          "You help someone find a saved document from a rough memory of it. Given a query and a list of " +
          "documents (id, title, summary), return up to 8 whose content plausibly matches, best first. " +
          "For each, give one short line on why it matched. If nothing is a reasonable match, return an empty list. " +
          'Respond with only JSON: {"results": [{"link_id": "<id>", "reason": "<one line>"}]}.',
      },
      { role: "user", content: JSON.stringify({ query, documents: pool }) },
    ]);

    const knownIds = new Set(pool.map((p) => p.link_id));
    const results = extractAskResults(found, knownIds);

    return jsonResponse({ results }, corsHdrs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ results: [], error: message }, corsHdrs, 200);
  }
}
