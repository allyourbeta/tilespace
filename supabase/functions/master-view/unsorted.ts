import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { completeJSON } from "../_shared/aiClient.ts";
import { filterValidThemeAssignments } from "./logic.ts";

export interface InsightRow {
  link_id: string;
  summary: string;
  content_hash: string;
  theme_id: string | null;
  hidden: boolean;
  updated_at: string;
}

export interface ThemeRow {
  id: string;
  name: string;
  swatch: string;
  sort: number;
  created_at: string;
}

/**
 * The below-5-changed path (Decision 1/2, SPEC_new_docs_get_a_theme_2026-10-09.md):
 * rather than leaving a new document invisible until a full re-theme, offer
 * it to the model as a fit against the themes that already exist. One
 * batched call for every such document. A name the model invents, or a
 * call that fails outright, leaves that document's `theme_id` null — it
 * surfaces on "Not sorted yet" (`MasterViewService.groupDocsByTheme`)
 * instead of being hidden.
 */
async function assignNullThemes(
  docs: { link_id: string; title: string; summary: string }[],
  existingNames: string[],
): Promise<Record<string, string>> {
  if (docs.length === 0) return {};
  try {
    const result = await completeJSON<unknown>([
      {
        role: "system",
        content:
          "You file new documents into someone's existing set of broad themes. " +
          "For each document, answer with the exact name of the single best-fitting existing theme, " +
          "copied verbatim from the list given — never a new or reworded name. " +
          "If none of the existing themes genuinely fits a document, omit that document instead of guessing. " +
          'Respond with only JSON: {"assignments": {"<document id>": "<exact existing theme name>"}}.',
      },
      {
        role: "user",
        content: JSON.stringify({ existing_theme_names: existingNames, documents: docs }),
      },
    ]);
    return filterValidThemeAssignments(result, existingNames);
  } catch {
    return {};
  }
}

/** Tries to place every still-unthemed, non-hidden insight into an existing theme. */
export async function themeNewlyUnsorted(
  supabase: SupabaseClient,
  insights: InsightRow[],
  titleById: Map<string, string>,
  themes: ThemeRow[],
): Promise<void> {
  if (themes.length === 0) return;
  const candidates = insights.filter((i) => !i.hidden && !i.theme_id && i.summary);
  if (candidates.length === 0) return;

  const docs = candidates.map((i) => ({ link_id: i.link_id, title: titleById.get(i.link_id) ?? "", summary: i.summary }));
  const assignments = await assignNullThemes(docs, themes.map((t) => t.name));
  if (Object.keys(assignments).length === 0) return;

  const themeIdByName = new Map(themes.map((t) => [t.name, t.id]));
  for (const [linkId, name] of Object.entries(assignments)) {
    const themeId = themeIdByName.get(name);
    if (!themeId) continue;
    const { error } = await supabase.from("doc_insight").update({ theme_id: themeId }).eq("link_id", linkId);
    if (error) throw error;
  }
}
