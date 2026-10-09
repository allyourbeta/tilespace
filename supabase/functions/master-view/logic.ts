/**
 * Pure logic for the master-view function: no `Deno.*`, no network, no
 * Supabase client — so it is unit-testable from plain Node/vitest, unlike
 * `index.ts` which can only run on Deno.
 */

// The "Clear" palette (2026-10-09 depth + palette refresh): eight hues in
// one key, in the fixed rainbow order red, orange, gold, green, teal,
// blue, indigo, plum. Matches src/lib/swatches.ts on the frontend.
export const SWATCHES = ["#D8625C", "#EB883B", "#CF9B00", "#47A34E", "#00A7A8", "#3690E3", "#7C7FE5", "#BE67B7"];

// The swatch set this replaces (2026-10-09 sidebar refresh), same order, so
// a theme's stored colour can be mapped onto its new positional equivalent
// instead of just being treated as a stray non-member colour.
const LEGACY_SWATCHES = ["#2563EB", "#7C3AED", "#DB2777", "#E02718", "#FF8A00", "#F5C518", "#0F766E", "#475569"];

/** Maps a theme's old Clear-predecessor swatch onto its positional replacement; passes through anything else unchanged. */
export function remapLegacySwatch(swatch: string): string {
  const index = LEGACY_SWATCHES.indexOf(swatch);
  return index === -1 ? swatch : SWATCHES[index];
}

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

/**
 * Keeps only the entries of a `{assignments: {id: name}}` reply whose name
 * is verbatim one of `existingNames` — the model's one job below 5 changed
 * docs (Decision 1/2, SPEC_new_docs_get_a_theme_2026-10-09.md): file a new
 * document into an existing theme, or leave it alone. Any other shape, a
 * missing id, or an invented name is dropped rather than guessed at.
 */
export function filterValidThemeAssignments(raw: unknown, existingNames: string[]): Record<string, string> {
  const value = raw as { assignments?: unknown } | null;
  if (
    !value ||
    typeof value.assignments !== "object" ||
    value.assignments === null ||
    Array.isArray(value.assignments)
  ) {
    return {};
  }

  const validNames = new Set(existingNames);
  const out: Record<string, string> = {};
  for (const [linkId, name] of Object.entries(value.assignments as Record<string, unknown>)) {
    if (typeof name === "string" && validNames.has(name)) out[linkId] = name;
  }
  return out;
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
