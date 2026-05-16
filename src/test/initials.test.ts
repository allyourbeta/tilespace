import { describe, it, expect } from 'vitest';
import { getInitials } from '@/utils/initials';

describe('getInitials', () => {
  it('returns two letters from two-word titles', () => {
    expect(getInitials('Beat Pirc')).toBe('BP');
    expect(getInitials('New Tile')).toBe('NT');
  });

  it('skips common words like "the", "a", "and"', () => {
    expect(getInitials('Beat the Pirc')).toBe('BP');
    expect(getInitials('Play the French')).toBe('PF');
    expect(getInitials('Hanging pawns - both sides')).toBe('HP');
  });

  it('returns first two letters for single-word titles', () => {
    expect(getInitials('Benko')).toBe('BE');
    expect(getInitials('KID')).toBe('KI');
  });

  it('handles separators: hyphens, dashes, slashes', () => {
    expect(getInitials('IQP - both sides')).toBe('IB');
    expect(getInitials('Blindfold/audio')).toBe('BA');
  });

  it('returns ? for empty or whitespace-only titles', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('handles titles where all words are skipped', () => {
    expect(getInitials('the')).toBe('TH');
    expect(getInitials('a')).toBe('A');
  });

  it('handles single character words', () => {
    // 'A' is a skip word, so only 'B' remains → single-word → first two chars
    expect(getInitials('A B')).toBe('B');
    expect(getInitials('X Y')).toBe('XY');
  });
});
