import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { TilePanel } from '@/components/TilePanel';
import { chipColor } from '@/lib/chipColors';
import type { Tile } from '@/types';

// This project has no @testing-library/react dependency and the spec
// forbids adding new dependencies, so this renders/interacts via plain
// react-dom + jsdom instead (see Sidebar.test.tsx, TileCard.test.tsx).

function makeTile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: 't1',
    user_id: 'u1',
    title: 'Some tile',
    emoji: '🌿',
    accent_color: '#FF00FF',
    color_index: 4,
    position: 0,
    created_at: '',
    updated_at: '',
    links: [],
    ...overrides,
  };
}

function noop() {}
function asyncNoop() { return Promise.resolve({} as never); }

describe('TilePanel', () => {
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

  function renderPanel(tile: Tile, onClose = vi.fn()) {
    act(() => {
      root.render(
        <TilePanel
          tile={tile}
          onClose={onClose}
          onUpdateTile={noop}
          onUpdateTileColor={noop}
          onResetTile={noop}
          onCreateLink={asyncNoop}
          onUpdateLink={noop}
          onDeleteLink={noop}
          onOpenDocument={noop}
          onAddNote={noop}
        />
      );
    });
    return { onClose };
  }

  it('no element carries a background derived from tile.accent_color', () => {
    const tile = makeTile({ accent_color: '#FF00FF' });
    renderPanel(tile);
    const tinted = `${tile.accent_color}15`;
    const all = container.querySelectorAll<HTMLElement>('*');
    for (const el of Array.from(all)) {
      expect(el.style.backgroundColor).not.toBe(tinted);
      expect(el.getAttribute('style') || '').not.toContain(tile.accent_color);
    }
  });

  it('the delete control is a button named "Delete tile" and does not carry bg-red-500', () => {
    const tile = makeTile();
    renderPanel(tile);
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Delete tile'
    );
    expect(deleteBtn).toBeTruthy();
    expect(deleteBtn!.className).not.toMatch(/bg-red-500/);
  });

  it('closing the panel does not render a "Saved" element', () => {
    const tile = makeTile();
    renderPanel(tile);
    expect(container.textContent).not.toMatch(/Saved/);

    const closeBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.title === 'Close'
    ) as HTMLButtonElement;
    act(() => { closeBtn.click(); });
    expect(container.textContent).not.toMatch(/Saved/);
  });

  it("the primary action's inline colour equals chipColor(tile.color_index)", () => {
    const tile = makeTile({ color_index: 7 });
    renderPanel(tile);
    const addLinkBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Add Link')
    ) as HTMLElement;
    expect(addLinkBtn).toBeTruthy();
    expect(addLinkBtn.style.backgroundColor).toBe(hexToRgb(chipColor(7)));
  });
});

// jsdom normalizes inline style colours to rgb(); compare like for like.
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
