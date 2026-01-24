import { describe, it, expect } from 'vitest';
import {
  validateAndNormalizeUrl,
  checkDuplicateUrl,
  getNextLinkPosition,
  isDocument,
  isUrlLink,
  getLinkDisplayTitle,
  isDocumentEmpty,
  findLinkById,
} from '@/services/LinkService';
import type { Tile, Link } from '@/types';

// Helper to create a mock tile
function createMockTile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: 'test-id',
    user_id: 'user-id',
    title: 'Test Tile',
    emoji: '📁',
    accent_color: '#000000',
    color_index: 0,
    position: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    links: [],
    ...overrides,
  };
}

// Helper to create a mock link
function createMockLink(overrides: Partial<Link> = {}): Link {
  return {
    id: 'link-id',
    user_id: 'user-id',
    tile_id: 'tile-id',
    type: 'link',
    title: 'Test Link',
    url: 'https://example.com',
    summary: '',
    content: '',
    position: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('validateAndNormalizeUrl', () => {
  it('normalizes URLs without protocol', () => {
    expect(validateAndNormalizeUrl('example.com')).toBe('https://example.com');
  });

  it('preserves valid URLs with protocol', () => {
    expect(validateAndNormalizeUrl('https://example.com')).toBe('https://example.com');
    expect(validateAndNormalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('throws for invalid URLs', () => {
    expect(() => validateAndNormalizeUrl('not a url')).toThrow();
  });
});

describe('checkDuplicateUrl', () => {
  it('returns false for tile with no links', () => {
    const tile = createMockTile({ links: [] });
    expect(checkDuplicateUrl(tile, 'https://example.com')).toBe(false);
  });

  it('returns false when URL does not exist', () => {
    const tile = createMockTile({
      links: [createMockLink({ url: 'https://other.com' })],
    });
    expect(checkDuplicateUrl(tile, 'https://example.com')).toBe(false);
  });

  it('returns true when URL exists (case insensitive)', () => {
    const tile = createMockTile({
      links: [createMockLink({ url: 'https://Example.com' })],
    });
    expect(checkDuplicateUrl(tile, 'https://example.com')).toBe(true);
    expect(checkDuplicateUrl(tile, 'HTTPS://EXAMPLE.COM')).toBe(true);
  });

  it('handles documents (null URLs)', () => {
    const tile = createMockTile({
      links: [createMockLink({ type: 'document', url: null })],
    });
    expect(checkDuplicateUrl(tile, 'https://example.com')).toBe(false);
  });
});

describe('getNextLinkPosition', () => {
  it('returns 0 for tile with no links', () => {
    const tile = createMockTile({ links: [] });
    expect(getNextLinkPosition(tile)).toBe(0);
  });

  it('returns 0 for tile with undefined links', () => {
    const tile = createMockTile({ links: undefined });
    expect(getNextLinkPosition(tile)).toBe(0);
  });

  it('returns correct position for tile with links', () => {
    const tile = createMockTile({
      links: [createMockLink(), createMockLink({ id: 'link-2' })],
    });
    expect(getNextLinkPosition(tile)).toBe(2);
  });
});

describe('isDocument', () => {
  it('returns true for document type', () => {
    const link = createMockLink({ type: 'document' });
    expect(isDocument(link)).toBe(true);
  });

  it('returns false for link type', () => {
    const link = createMockLink({ type: 'link' });
    expect(isDocument(link)).toBe(false);
  });
});

describe('isUrlLink', () => {
  it('returns true for link type', () => {
    const link = createMockLink({ type: 'link' });
    expect(isUrlLink(link)).toBe(true);
  });

  it('returns false for document type', () => {
    const link = createMockLink({ type: 'document' });
    expect(isUrlLink(link)).toBe(false);
  });
});

describe('getLinkDisplayTitle', () => {
  it('returns title when present', () => {
    const link = createMockLink({ title: 'My Link', url: 'https://example.com' });
    expect(getLinkDisplayTitle(link)).toBe('My Link');
  });

  it('returns URL when title is empty', () => {
    const link = createMockLink({ title: '', url: 'https://example.com' });
    expect(getLinkDisplayTitle(link)).toBe('https://example.com');
  });

  it('returns "Untitled" when both are empty', () => {
    const link = createMockLink({ title: '', url: null });
    expect(getLinkDisplayTitle(link)).toBe('Untitled');
  });
});

describe('isDocumentEmpty', () => {
  it('returns true for completely empty document', () => {
    const link = createMockLink({
      type: 'document',
      title: '',
      content: '',
      summary: '',
    });
    expect(isDocumentEmpty(link)).toBe(true);
  });

  it('returns true for whitespace-only content', () => {
    const link = createMockLink({
      type: 'document',
      title: '   ',
      content: '  ',
      summary: '  ',
    });
    expect(isDocumentEmpty(link)).toBe(true);
  });

  it('returns false when title has content', () => {
    const link = createMockLink({
      type: 'document',
      title: 'My Note',
      content: '',
      summary: '',
    });
    expect(isDocumentEmpty(link)).toBe(false);
  });

  it('returns false when content has text', () => {
    const link = createMockLink({
      type: 'document',
      title: '',
      content: 'Some content',
      summary: '',
    });
    expect(isDocumentEmpty(link)).toBe(false);
  });

  it('returns false when summary has text', () => {
    const link = createMockLink({
      type: 'document',
      title: '',
      content: '',
      summary: 'A summary',
    });
    expect(isDocumentEmpty(link)).toBe(false);
  });
});

describe('findLinkById', () => {
  it('returns null for empty tiles array', () => {
    expect(findLinkById([], 'link-id')).toBeNull();
  });

  it('returns null when link not found', () => {
    const tiles = [
      createMockTile({
        links: [createMockLink({ id: 'other-link' })],
      }),
    ];
    expect(findLinkById(tiles, 'link-id')).toBeNull();
  });

  it('finds link and returns tile + link', () => {
    const link = createMockLink({ id: 'target-link' });
    const tile = createMockTile({ id: 'tile-1', links: [link] });
    const tiles = [tile];

    const result = findLinkById(tiles, 'target-link');
    expect(result).not.toBeNull();
    expect(result!.tile).toBe(tile);
    expect(result!.link).toBe(link);
  });

  it('finds link across multiple tiles', () => {
    const link = createMockLink({ id: 'target-link' });
    const tile1 = createMockTile({ id: 'tile-1', links: [] });
    const tile2 = createMockTile({ id: 'tile-2', links: [link] });
    const tiles = [tile1, tile2];

    const result = findLinkById(tiles, 'target-link');
    expect(result).not.toBeNull();
    expect(result!.tile).toBe(tile2);
    expect(result!.link).toBe(link);
  });
});
