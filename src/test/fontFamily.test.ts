import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain JS config file, no declaration file to type it against
import tailwindConfig from '../../tailwind.config.js';

// Tailwind's Preflight sets `html { font-family: theme('fontFamily.sans') }`,
// so this one value is what every element's (and the document reader's,
// and every input's) font family resolves to app-wide.
describe('fontFamily (SPEC_new_docs_get_a_theme_2026-10-09.md, Work 3)', () => {
  it('body font family starts with Nunito', () => {
    const sans = tailwindConfig.theme.extend.fontFamily.sans;
    expect(sans[0]).toBe('Nunito');
  });
});
