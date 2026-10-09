import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { completeJSON, completeText, AIClientError } from "../_shared/aiClient.ts";
import { swatchForName, assignDistinctSwatches, remapLegacySwatch, validateThemingResult, type ThemingResult } from "./logic.ts";
import { jsonResponse } from "./http.ts";

interface DocRow {
  id: string;
  title: string;
  content: string | null;
}

interface InsightRow {
  link_id: string;
  summary: string;
  content_hash: string;
  theme_id: string | null;
  hidden: boolean;
  updated_at: string;
}

interface ThemeRow {
  id: string;
  name: string;
  swatch: string;
  sort: number;
  created_at: string;
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function summarizeOne(title: string, content: string): Promise<string> {
  const body = (content || "").slice(0, 3000);
  const text = await completeText([
    {
      role: "system",
      content:
        "You summarize a personal saved note or document in exactly one sentence of no more than 25 words. " +
        "No quotation marks, no preamble. Respond with only the summary sentence.",
    },
    { role: "user", content: `Title: ${title || "(untitled)"}\n\n${body}` },
  ]);
  return text.trim();
}

async function retheme(
  docs: { link_id: string; title: string; summary: string }[],
  existingNames: string[],
): Promise<ThemingResult> {
  const result = await completeJSON<unknown>([
    {
      role: "system",
      content:
        "You organize someone's saved notes and documents into a small number of broad themes. " +
        "Produce 5 to 10 short noun-phrase themes (2-4 words each, e.g. 'Clients and work'). " +
        "Reuse an existing theme name when it still fits instead of inventing a near-duplicate. " +
        "Assign exactly one theme to every document listed. " +
        'Respond with only JSON: {"themes": string[], "assignments": {"<document id>": "<theme name>"}}.',
    },
    {
      role: "user",
      content: JSON.stringify({ existing_theme_names: existingNames, documents: docs }),
    },
  ]);

  return validateThemingResult(result);
}

async function summarizeChangedDocs(supabase: SupabaseClient, docs: DocRow[], insightByLink: Map<string, InsightRow>) {
  const errors: string[] = [];
  for (const doc of docs) {
    try {
      const summary = await summarizeOne(doc.title, doc.content ?? "");
      const hash = await sha256(`${doc.title}\n${doc.content ?? ""}`);
      const existing = insightByLink.get(doc.id);
      const { error } = await supabase.from("doc_insight").upsert({
        link_id: doc.id,
        summary,
        content_hash: hash,
        theme_id: existing?.theme_id ?? null,
        hidden: existing?.hidden ?? false,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err) {
      errors.push(`${doc.title || doc.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return errors;
}

async function applyTheming(
  supabase: SupabaseClient,
  themed: ThemingResult,
  themes: ThemeRow[],
  titleById: Map<string, string>,
  userId: string,
) {
  const existingByLowerName = new Map<string, ThemeRow>(themes.map((t) => [t.name.toLowerCase(), t]));
  const nameToId = new Map<string, string>();

  for (const name of themed.themes) {
    const existing = existingByLowerName.get(name.toLowerCase());
    if (existing) {
      nameToId.set(name, existing.id);
      continue;
    }
    const { data: inserted, error: insertErr } = await supabase
      .from("doc_theme")
      .insert({ user_id: userId, name, swatch: swatchForName(name), sort: 0 })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    nameToId.set(name, inserted.id);
  }

  for (const [linkId, themeName] of Object.entries(themed.assignments)) {
    const themeId = nameToId.get(themeName);
    if (!themeId || !titleById.has(linkId)) continue; // ignore ids/names outside the known set
    const { error } = await supabase.from("doc_insight").update({ theme_id: themeId }).eq("link_id", linkId);
    if (error) throw error;
  }

  // Counts drive tile size, so persist them as `sort` (0 = most documents).
  const { data: countRows } = await supabase.from("doc_insight").select("theme_id");
  const counts = new Map<string, number>();
  for (const row of countRows ?? []) {
    if (row.theme_id) counts.set(row.theme_id, (counts.get(row.theme_id) ?? 0) + 1);
  }
  const rankedIds = [...nameToId.values()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  for (let i = 0; i < rankedIds.length; i++) {
    await supabase.from("doc_theme").update({ sort: i }).eq("id", rankedIds[i]);
  }

  // Themes the model dropped and no document still points to are stale — remove them.
  const keptIds = new Set(nameToId.values());
  const staleIds = themes.map((t) => t.id).filter((id) => !keptIds.has(id));
  if (staleIds.length > 0) {
    await supabase.from("doc_theme").delete().in("id", staleIds);
  }
}

/**
 * Runs on every refresh, not only when themes are (re)made — fixes any
 * colour collisions left over from the old hash-based assignment (Decision
 * 6), and maps any theme still on the pre-Clear-palette swatches onto its
 * positional replacement (SPEC_depth_2026-10-09.md, Decision 5), as soon
 * as the user next opens Master View. No migration needed.
 */
async function dedupeThemeSwatches(supabase: SupabaseClient): Promise<void> {
  const { data: themes, error } = await supabase
    .from("doc_theme")
    .select("id, swatch, created_at")
    .order("created_at", { ascending: true });
  if (error || !themes || themes.length === 0) return;

  const remapped = (themes as { swatch: string }[]).map((t) => ({ ...t, swatch: remapLegacySwatch(t.swatch) }));
  const assigned = assignDistinctSwatches(remapped);
  for (let i = 0; i < themes.length; i++) {
    if (assigned[i] !== themes[i].swatch) {
      await supabase.from("doc_theme").update({ swatch: assigned[i] }).eq("id", themes[i].id);
    }
  }
}

export async function handleRefresh(supabase: SupabaseClient, corsHdrs: Record<string, string>) {
  const { data: docs, error: docsErr } = await supabase
    .from("links")
    .select("id, title, content")
    .eq("type", "document");
  if (docsErr) throw docsErr;

  const { data: insights, error: insightsErr } = await supabase
    .from("doc_insight")
    .select("link_id, summary, content_hash, theme_id, hidden, updated_at");
  if (insightsErr) throw insightsErr;

  const insightByLink = new Map<string, InsightRow>((insights ?? []).map((i: InsightRow) => [i.link_id, i]));
  const changedDocs: DocRow[] = [];
  for (const doc of (docs ?? []) as DocRow[]) {
    const hash = await sha256(`${doc.title}\n${doc.content ?? ""}`);
    const existing = insightByLink.get(doc.id);
    if (!existing || existing.content_hash !== hash) {
      changedDocs.push(doc);
    }
  }

  const summaryErrors = await summarizeChangedDocs(supabase, changedDocs, insightByLink);

  const { data: themes, error: themesErr } = await supabase
    .from("doc_theme")
    .select("id, name, swatch, sort, created_at");
  if (themesErr) throw themesErr;

  const { data: freshInsights, error: freshErr } = await supabase
    .from("doc_insight")
    .select("link_id, summary, content_hash, theme_id, hidden, updated_at");
  if (freshErr) throw freshErr;

  const latestThemeAt = (themes ?? []).reduce<string | null>(
    (max, t: ThemeRow) => (!max || t.created_at > max ? t.created_at : max),
    null,
  );
  const changedSinceTheming = (freshInsights ?? []).filter(
    (i: InsightRow) => !i.theme_id || (latestThemeAt !== null && i.updated_at > latestThemeAt),
  ).length;
  const needsTheming = (themes ?? []).length === 0 || changedSinceTheming >= 5;

  const respond = async (ok: boolean, rethemed: boolean, error?: string) => {
    await dedupeThemeSwatches(supabase);
    return jsonResponse({ ok, rethemed, summarized: changedDocs.length, errors: summaryErrors, error }, corsHdrs);
  };

  if (!needsTheming) return await respond(true, false);

  const titleById = new Map<string, string>(((docs ?? []) as DocRow[]).map((d) => [d.id, d.title]));
  const docsForTheming = (freshInsights ?? [])
    .filter((i: InsightRow) => i.summary)
    .map((i: InsightRow) => ({ link_id: i.link_id, title: titleById.get(i.link_id) ?? "", summary: i.summary }));

  if (docsForTheming.length === 0) return await respond(true, false);

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new AIClientError("No authenticated user");

    const themed = await retheme(docsForTheming, (themes ?? []).map((t: ThemeRow) => t.name));
    await applyTheming(supabase, themed, themes ?? [], titleById, userId);

    return await respond(true, true);
  } catch (err) {
    // Keep whatever themes/assignments already existed; surface the error, don't throw.
    const message = err instanceof Error ? err.message : String(err);
    return await respond(false, false, message);
  }
}
