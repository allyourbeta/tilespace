import { describe, it, expect } from 'vitest';
import { SWATCHES, swatchForName, validateThemingResult, extractAskResults } from './logic';
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
