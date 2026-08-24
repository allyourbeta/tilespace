import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { TileCard } from '@/components/TileCard';
import { chipColor } from '@/lib/chipColors';
import type { Tile, Link } from '@/types';

function makeLink(overrides: Partial<Link> = {}): Link {
  return {
    id: 'l1',
    user_id: 'u1',
    tile_id: 't1',
    type: 'link',
    title: 'a',
    url: 'https://a.com',
    summary: '',
    content: '',
    position: 0,
    created_at: '',
    ...overrides,
  };
}

// No @testing-library/react in this project (see Sidebar.test.tsx) — plain
// react-dom + jsdom rendering instead, per the no-new-dependencies rule.

function makeTile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: 't1',
    user_id: 'u1',
    title: 'Short title',
    emoji: '🌿',
    accent_color: '#000000',
    color_index: 3,
    position: 0,
    created_at: '',
    updated_at: '',
    links: [],
    ...overrides,
  };
}

describe('TileCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  function renderTile(tile: Tile) {
    act(() => {
      root.render(
        <TileCard
          tile={tile}
          onClick={vi.fn()}
          onDragStart={vi.fn()}
          onDragOver={vi.fn()}
          onDrop={vi.fn()}
          onLinkDrop={vi.fn()}
          isDragging={false}
        />
      );
    });
  }

  
  
  it("the chip's inline colour equals chipColor(tile.color_index)", () => {
    const tile = makeTile({ color_index: 5 });
    renderTile(tile);
    const chip = Array.from(container.querySelectorAll('span')).find(
      (s) => s.textContent === 'ST' // getInitials('Short title')
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.color).toBe(hexToRgb(chipColor(5)));
  });

  it('omits the count element when the tile has no links', () => {
    const tile = makeTile({ links: [] });
    renderTile(tile);
    expect(container.textContent).not.toMatch(/item/);
  });

  it('renders the count element when the tile has links', () => {
    const tile = makeTile({ links: [makeLink()] });
    renderTile(tile);
    expect(container.textContent).toMatch(/1 item/);
  });

  it('clamps the title to a measured number of lines', () => {
    // jsdom reports clientHeight 0, so the hook floors at its minimum of 1.
    // The assertion that matters: a WebkitLineClamp is always applied, so a
    // title can never spill past its box and get sliced mid-glyph.
    renderTile(makeTile({ title: 'A very long tile title that would wrap several times over' }));
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.style.webkitLineClamp).not.toBe('');
    expect(Number(h3.style.webkitLineClamp)).toBeGreaterThanOrEqual(1);
  });

});

// jsdom normalizes inline style colours to rgb(); compare like for like.
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
