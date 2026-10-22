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

  describe('whole-line clamp (measure one element, clamp another)', () => {
    let originalGetComputedStyle: typeof window.getComputedStyle;
    let originalResizeObserver: typeof ResizeObserver;
    let clientHeightDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalGetComputedStyle = window.getComputedStyle;
      originalResizeObserver = globalThis.ResizeObserver;
      clientHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');

      // Stub the layout engine only: the measured element reports a fixed
      // clientHeight and lineHeight, and the ResizeObserver fires once,
      // synchronously, the way a real one fires after first layout.
      window.getComputedStyle = ((el: Element) => ({
        ...originalGetComputedStyle(el),
        lineHeight: '22.1px',
      })) as typeof window.getComputedStyle;

      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get() {
          return 53;
        },
      });

      class FakeResizeObserver {
        private callback: ResizeObserverCallback;
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }
        observe() {
          this.callback([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
        }
        unobserve() {}
        disconnect() {}
      }
      globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      window.getComputedStyle = originalGetComputedStyle;
      globalThis.ResizeObserver = originalResizeObserver;
      if (clientHeightDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeightDescriptor);
      }
    });

    it('clamps the h3 to whole lines: webkitLineClamp 2 and maxHeight <= 44.2px', () => {
      renderTile(makeTile({ title: 'A very long tile title that would wrap several times over' }));
      const h3 = container.querySelector('h3') as HTMLElement;
      expect(h3.style.webkitLineClamp).toBe('2');
      expect(parseFloat(h3.style.maxHeight)).toBeGreaterThan(0);
      expect(parseFloat(h3.style.maxHeight)).toBeLessThanOrEqual(44.2);
    });
  });

  it('the badge and count share one parent, and that parent precedes the title in DOM order', () => {
    const tile = makeTile({ links: [makeLink()] });
    renderTile(tile);
    const card = container.querySelector('[draggable]') as HTMLElement;
    const badge = Array.from(container.querySelectorAll('span')).find(
      (s) => s.textContent === 'ST' // getInitials('Short title')
    ) as HTMLElement;
    const count = Array.from(container.querySelectorAll('span')).find(
      (s) => /item/.test(s.textContent || '')
    ) as HTMLElement;
    expect(badge).toBeTruthy();
    expect(count).toBeTruthy();
    expect(badge.parentElement).toBe(count.parentElement);
    // Must be a dedicated row, not just "both are direct children of the card".
    expect(badge.parentElement).not.toBe(card);

    const topRow = badge.parentElement as HTMLElement;
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(topRow.contains(h3)).toBe(false);
    expect(
      topRow.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

});

// jsdom normalizes inline style colours to rgb(); compare like for like.
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
