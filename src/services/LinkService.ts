import type { Link, Tile } from '@/types';
import { isValidUrl, normalizeUrl } from '@/utils';

/**
 * Validate a URL and return normalized version
 * Throws if invalid
 */
export function validateAndNormalizeUrl(url: string): string {
  const normalized = normalizeUrl(url);
  if (!isValidUrl(normalized)) {
    throw new Error('Invalid URL format');
  }
  return normalized;
}

/**
 * Check if a URL already exists in a tile's links
 */
export function checkDuplicateUrl(tile: Tile, url: string): boolean {
  const normalizedUrl = url.trim().toLowerCase();
  return (
    tile.links?.some(
      (l) => l.url && l.url.toLowerCase() === normalizedUrl
    ) ?? false
  );
}

/**
 * Get the next position for a new link in a tile
 */
export function getNextLinkPosition(tile: Tile): number {
  return tile.links?.length ?? 0;
}

/**
 * Check if a link is a document (note)
 */
export function isDocument(link: Link): boolean {
  return link.type === 'document';
}

/**
 * Check if a link is an actual URL link
 */
export function isUrlLink(link: Link): boolean {
  return link.type === 'link';
}

/**
 * Get display title for a link
 */
export function getLinkDisplayTitle(link: Link): string {
  return link.title || link.url || 'Untitled';
}

/**
 * Check if a document is empty (should be deleted on close)
 */
export function isDocumentEmpty(link: Link): boolean {
  return (
    !link.title?.trim() &&
    !link.content?.trim() &&
    !link.summary?.trim()
  );
}

/**
 * Find a link by ID across all tiles
 */
export function findLinkById(
  tiles: Tile[],
  linkId: string
): { tile: Tile; link: Link } | null {
  for (const tile of tiles) {
    const link = tile.links?.find((l) => l.id === linkId);
    if (link) {
      return { tile, link };
    }
  }
  return null;
}
