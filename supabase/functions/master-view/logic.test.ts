import { describe, it, expect } from 'vitest';
import { SWATCHES, swatchForName, assignDistinctSwatches, remapLegacySwatch, validateThemingResult, extractAskResults } from './logic';
import { extractJSON, AIClientError } from '../_shared/aiClient';

// Pure logic only (no Deno, no network), run through plain vitest/Node —
// see the module docblocks for why index.ts itself can't be imported here.

describe('swatchForName', () => {
  it('always returns one of the eight swatches', () => {
    for (const name of ['Clients and work', 'Friends and people', 'Money', '']) {
      expect(SWATCHES).toContain(swatchForName(name));
    }
  });

  it('is stable: the same name always maps to the same swatch', () => {
    expect(swatchForName('Clients and work')).toBe(swatchForName('Clients and work'));
  });

  it('is not simply insertion order — two different names can land anywhere in the set', () => {
    const colors = new Set(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map(swatchForName));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe('assignDistinctSwatches', () => {
  it('gives 6 themes 6 distinct colours even when all 6 currently collide on one swatch', () => {
    const themes = Array.from({ length: 6 }, () => ({ swatch: '#3690E3' }));
    const result = assignDistinctSwatches(themes);
    expect(new Set(result).size).toBe(6);
    for (const swatch of result) expect(SWATCHES).toContain(swatch);
  });

  it('keeps a theme\'s existing swatch if it is still unique', () => {
    const themes = [{ swatch: '#00A7A8' }, { swatch: '#3690E3' }, { swatch: '#3690E3' }];
    const result = assignDistinctSwatches(themes);
    expect(result[0]).toBe('#00A7A8');
    expect(result[1]).toBe('#3690E3');
    expect(result[2]).not.toBe('#3690E3');
  });

  it('only repeats a colour once all 8 are taken by 9+ themes', () => {
    const themes = Array.from({ length: 9 }, () => ({ swatch: '#3690E3' }));
    const result = assignDistinctSwatches(themes);
    expect(new Set(result).size).toBe(8);
  });

  it('is a no-op when every theme already has a distinct swatch', () => {
    const themes = SWATCHES.slice(0, 5).map((swatch) => ({ swatch }));
    expect(assignDistinctSwatches(themes)).toEqual(themes.map((t) => t.swatch));
  });
});

describe('remapLegacySwatch', () => {
  it('maps every pre-Clear-palette swatch onto its positional replacement', () => {
    expect(remapLegacySwatch('#2563EB')).toBe('#D8625C'); // old index 0 -> new index 0
    expect(remapLegacySwatch('#475569')).toBe('#BE67B7'); // old index 7 -> new index 7
  });

  it('passes through a swatch that was never a legacy colour unchanged', () => {
    expect(remapLegacySwatch('#3690E3')).toBe('#3690E3');
  });

  it('feeding assignDistinctSwatches remapped legacy themes keeps 6 themes distinct', () => {
    const legacyThemes = ['#2563EB', '#7C3AED', '#DB2777', '#E02718', '#FF8A00', '#F5C518'].map((swatch) => ({
      swatch: remapLegacySwatch(swatch),
    }));
    const result = assignDistinctSwatches(legacyThemes);
    expect(new Set(result).size).toBe(6);
    for (const swatch of result) expect(SWATCHES).toContain(swatch);
  });
});

describe('validateThemingResult', () => {
  it('accepts a well-shaped response', () => {
    const raw = { themes: ['Clients and work', 'Learning'], assignments: { a: 'Clients and work' } };
    expect(validateThemingResult(raw)).toEqual(raw);
  });

  it('rejects a missing themes array', () => {
    expect(() => validateThemingResult({ assignments: {} })).toThrow();
  });

  it('rejects a non-string theme name', () => {
    expect(() => validateThemingResult({ themes: ['ok', 42], assignments: {} })).toThrow();
  });

  it('rejects assignments that are an array instead of an object', () => {
    expect(() => validateThemingResult({ themes: ['ok'], assignments: ['not-an-object'] })).toThrow();
  });

  it('rejects null and non-object input (the model returning the wrong shape or bad JSON upstream)', () => {
    expect(() => validateThemingResult(null)).toThrow();
    expect(() => validateThemingResult('just a string')).toThrow();
  });
});

describe('extractAskResults', () => {
  const known = new Set(['a', 'b', 'c']);

  it('passes through well-shaped results for known ids', () => {
    const raw = { results: [{ link_id: 'a', reason: 'matches' }] };
    expect(extractAskResults(raw, known)).toEqual([{ link_id: 'a', reason: 'matches' }]);
  });

  it('drops ids the model hallucinated outside the known set', () => {
    const raw = { results: [{ link_id: 'ghost', reason: 'matches' }, { link_id: 'a', reason: 'real' }] };
    expect(extractAskResults(raw, known)).toEqual([{ link_id: 'a', reason: 'real' }]);
  });

  it('caps at 8 even if the model returns more', () => {
    const raw = {
      results: Array.from({ length: 20 }, (_, i) => ({ link_id: 'a', reason: `reason ${i}` })),
    };
    expect(extractAskResults(raw, known)).toHaveLength(8);
  });

  it('returns an empty list for malformed input instead of throwing', () => {
    expect(extractAskResults(null, known)).toEqual([]);
    expect(extractAskResults({ results: 'not-an-array' }, known)).toEqual([]);
    expect(extractAskResults({ results: [{ link_id: 'a' }] }, known)).toEqual([]); // missing reason
  });
});

describe('extractJSON (shared AI client)', () => {
  it('parses a bare JSON reply', () => {
    expect(extractJSON<{ ok: boolean }>('{"ok": true}')).toEqual({ ok: true });
  });

  it('strips a markdown code fence the model wrapped its answer in', () => {
    const raw = '```json\n{"ok": true}\n```';
    expect(extractJSON<{ ok: boolean }>(raw)).toEqual({ ok: true });
  });

  it('throws AIClientError on invalid JSON (the "on any model error keep the old data" path)', () => {
    expect(() => extractJSON('not json at all')).toThrow(AIClientError);
  });
});
