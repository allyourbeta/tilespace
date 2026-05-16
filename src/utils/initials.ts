/**
 * Generates 1-2 character initials from a tile title.
 * 
 * Examples:
 *   "Beat the Pirc" → "BP" (skips common words like "the")
 *   "Benko" → "BE" (single word: first two letters)
 *   "IQP - both sides" → "IB"
 *   "KID" → "KI"
 *   "New Tile" → "NT"
 *   "" → "?"
 */

const SKIP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with', 'by']);

export function getInitials(title: string): string {
  if (!title || !title.trim()) return '?';

  const words = title
    .split(/[\s\-–—/]+/)
    .filter(w => w.length > 0)
    .filter(w => !SKIP_WORDS.has(w.toLowerCase()));

  if (words.length === 0) {
    // All words were skipped — fall back to first two chars of original
    return title.trim().slice(0, 2).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}
