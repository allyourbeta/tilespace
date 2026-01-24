import { describe, it, expect } from 'vitest';
import {
  getNextTilePosition,
  getDefaultEmoji,
  buildTilePositionMap,
  tileHasLinks,
  getTileLinkCount,
  findInboxTile,
  INBOX_TILE,
  DEFAULT_EMOJIS,
} from '@/services/TileService';
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

describe('getNextTilePosition', () => {
  it('returns 0 for empty tiles array', () => {
    expect(getNextTilePosition([])).toBe(0);
  });

  it('finds first gap in positions', () => {
    const tiles = [
      createMockTile({ id: '1', position: 0 }),
      createMockTile({ id: '2', position: 1 }),
      createMockTile({ id: '3', position: 3 }), // gap at 2
    ];
    expect(getNextTilePosition(tiles)).toBe(2);
  });

  it('returns next position after last tile', () => {
    const tiles = [
      createMockTile({ id: '1', position: 0 }),
      createMockTile({ id: '2', position: 1 }),
    ];
    expect(getNextTilePosition(tiles)).toBe(2);
  });
});

describe('getDefaultEmoji', () => {
  it('returns emoji based on position', () => {
    expect(getDefaultEmoji(0)).toBe(DEFAULT_EMOJIS[0]);
    expect(getDefaultEmoji(1)).toBe(DEFAULT_EMOJIS[1]);
  });

  it('wraps around for positions beyond emoji count', () => {
    const emojiCount = DEFAULT_EMOJIS.length;
    expect(getDefaultEmoji(emojiCount)).toBe(DEFAULT_EMOJIS[0]);
    expect(getDefaultEmoji(emojiCount + 1)).toBe(DEFAULT_EMOJIS[1]);
  });
});

describe('buildTilePositionMap', () => {
  it('returns empty map for empty array', () => {
    const map = buildTilePositionMap([]);
    expect(map.size).toBe(0);
  });

  it('maps tiles by position', () => {
    const tile1 = createMockTile({ id: '1', position: 0 });
    const tile2 = createMockTile({ id: '2', position: 5 });
    const map = buildTilePositionMap([tile1, tile2]);

    expect(map.get(0)).toBe(tile1);
    expect(map.get(5)).toBe(tile2);
    expect(map.get(1)).toBeUndefined();
  });
});

describe('tileHasLinks', () => {
  it('returns false for tile with no links', () => {
    const tile = createMockTile({ links: [] });
    expect(tileHasLinks(tile)).toBe(false);
  });

  it('returns false for tile with undefined links', () => {
    const tile = createMockTile({ links: undefined });
    expect(tileHasLinks(tile)).toBe(false);
  });

  it('returns true for tile with links', () => {
    const tile = createMockTile({ links: [createMockLink()] });
    expect(tileHasLinks(tile)).toBe(true);
  });
});

describe('getTileLinkCount', () => {
  it('returns 0 for tile with no links', () => {
    const tile = createMockTile({ links: [] });
    expect(getTileLinkCount(tile)).toBe(0);
  });

  it('returns 0 for tile with undefined links', () => {
    const tile = createMockTile({ links: undefined });
    expect(getTileLinkCount(tile)).toBe(0);
  });

  it('returns correct count for tile with links', () => {
    const tile = createMockTile({
      links: [createMockLink(), createMockLink({ id: 'link-2' })],
    });
    expect(getTileLinkCount(tile)).toBe(2);
  });
});

describe('findInboxTile', () => {
  it('returns undefined for empty array', () => {
    expect(findInboxTile([])).toBeUndefined();
  });

  it('returns undefined when no Inbox tile exists', () => {
    const tiles = [
      createMockTile({ title: 'Work' }),
      createMockTile({ title: 'Personal' }),
    ];
    expect(findInboxTile(tiles)).toBeUndefined();
  });

  it('finds Inbox tile', () => {
    const inboxTile = createMockTile({ id: 'inbox', title: INBOX_TILE.TITLE });
    const tiles = [
      createMockTile({ title: 'Work' }),
      inboxTile,
      createMockTile({ title: 'Personal' }),
    ];
    expect(findInboxTile(tiles)).toBe(inboxTile);
  });
});

describe('INBOX_TILE constant', () => {
  it('has correct values', () => {
    expect(INBOX_TILE.TITLE).toBe('Inbox');
    expect(INBOX_TILE.EMOJI).toBe('📥');
    expect(INBOX_TILE.COLOR).toBe('#64748B');
  });
});
