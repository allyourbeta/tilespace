/**
 * Pure logic for the master-view function: no `Deno.*`, no network, no
 * Supabase client — so it is unit-testable from plain Node/vitest, unlike
 * `index.ts` which can only run on Deno.
 */

// The eight bright swatches from the 2026-10-09 sidebar refresh. A theme's
// swatch is a stable hash of its name, not an insertion order, so the same
// theme name always lands on the same colour across refreshes.
export const SWATCHES = ["#E02718", "#2563EB", "#FF8A00", "#0F766E", "#DB2777", "#475569", "#F5C518", "#7C3AED"];

export function swatchForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return SWATCHES[Math.abs(hash) % SWATCHES.length];
}

export interface ThemingResult {
  themes: string[];
  assignments: Record<string, string>;
}

/** Throws on anything that isn't `{ themes: string[], assignments: object }`. */
export function validateThemingResult(raw: unknown): ThemingResult {
  const value = raw as { themes?: unknown; assignments?: unknown } | null;
  if (
    !value ||
    !Array.isArray(value.themes) ||
    !value.themes.every((t) => typeof t === "string") ||
    typeof value.assignments !== "object" ||
    value.assignments === null ||
    Array.isArray(value.assignments)
  ) {
    throw new Error("Theming response had the wrong shape");
  }
  return { themes: value.themes as string[], assignments: value.assignments as Record<string, string> };
}

export interface AskResultItem {
  link_id: string;
  reason: string;
}

/** Drops anything not shaped like `{link_id, reason}`, ids outside the known set, and caps to 8. */
export function extractAskResults(raw: unknown, knownIds: Set<string>): AskResultItem[] {
  const list = (raw as { results?: unknown } | null)?.results;
  if (!Array.isArray(list)) return [];

  const results: AskResultItem[] = [];
  for (const item of list) {
    if (
      item &&
      typeof (item as AskResultItem).link_id === "string" &&
      typeof (item as AskResultItem).reason === "string" &&
      knownIds.has((item as AskResultItem).link_id)
    ) {
      results.push({ link_id: (item as AskResultItem).link_id, reason: (item as AskResultItem).reason });
    }
    if (results.length === 8) break;
  }
  return results;
}
