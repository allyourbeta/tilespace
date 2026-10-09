/**
 * Pure logic for the master-view function: no `Deno.*`, no network, no
 * Supabase client — so it is unit-testable from plain Node/vitest, unlike
 * `index.ts` which can only run on Deno.
 */

// The eight bright swatches from the 2026-10-09 sidebar refresh, in the
// fixed rainbow order: blue, violet, raspberry, red, orange, gold, deep
// teal, slate. Matches src/lib/swatches.ts on the frontend.
export const SWATCHES = ["#2563EB", "#7C3AED", "#DB2777", "#E02718", "#FF8A00", "#F5C518", "#0F766E", "#475569"];

export function swatchForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return SWATCHES[Math.abs(hash) % SWATCHES.length];
}

/**
 * Gives each theme a distinct swatch from the fixed 8, keeping a theme's
 * existing swatch if no earlier theme in the list already claimed it.
 * Only once all 8 are taken does a later theme repeat one (round-robin by
 * position). `themes` should be ordered oldest-first so a theme that has
 * held a colour the longest keeps priority over one assigned moments ago.
 */
export function assignDistinctSwatches(themes: { swatch: string }[]): string[] {
  const used = new Set<string>();
  const kept: (string | null)[] = themes.map((t) => {
    if (used.has(t.swatch)) return null;
    used.add(t.swatch);
    return t.swatch;
  });

  let cursor = 0;
  return kept.map((swatch, i) => {
    if (swatch) return swatch;
    while (cursor < SWATCHES.length && used.has(SWATCHES[cursor])) cursor++;
    if (cursor < SWATCHES.length) {
      const next = SWATCHES[cursor];
      used.add(next);
      cursor++;
      return next;
    }
    return SWATCHES[i % SWATCHES.length]; // past 8 distinct themes: repeats are unavoidable
  });
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
