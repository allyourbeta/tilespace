import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Sidebar } from '@/components/Sidebar';
import { rainbowSwatch } from '@/lib/swatches';
import type { Page } from '@/types';

// This project has no @testing-library/react dependency (only jest-dom's
// matchers are installed) and the spec forbids adding new dependencies, so
// this renders/interacts via plain react-dom + jsdom instead.

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}));

function makePage(overrides: Partial<Page>): Page {
  return {
    id: 'p1',
    user_id: 'u1',
    position: 0,
    title: 'Untitled',
    palette_id: 'ocean-bold',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const pages: Page[] = [
  makePage({ id: 'a', title: 'Work', position: 0 }),
  makePage({ id: 'b', title: 'Life', position: 1 }),
  makePage({ id: 'c', title: 'Travel', position: 2 }),
];

function fireDataTransferEvent(el: Element, type: string, dataTransfer: Record<string, unknown>) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer, configurable: true });
  act(() => { el.dispatchEvent(event); });
}

function makeDataTransfer() {
  const store: Record<string, string> = {};
  return {
    effectAllowed: '',
    dropEffect: '',
    setData: (k: string, v: string) => { store[k] = v; },
    getData: (k: string) => store[k] ?? '',
  };
}

describe('Sidebar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  function renderSidebar(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
    const onPageSelect = vi.fn();
    const onInsertPage = vi.fn();
    const onToggleCollapsed = vi.fn();
    const props = {
      pages,
      tileCounts: { a: 3, b: 0, c: 5 },
      currentPageId: 'a',
      onPageSelect,
      onInsertPage,
      onUpdatePageTitle: vi.fn(),
      onResetPage: vi.fn(),
      onCreatePage: vi.fn(),
      isMobile: false,
      isCollapsed: false,
      onToggleCollapsed,
      isMasterViewActive: false,
      onOpenMasterView: vi.fn(),
      ...overrides,
    };
    act(() => { root.render(<Sidebar {...props} />); });
    return { onPageSelect, onInsertPage, onToggleCollapsed };
  }

  it('renders one row per page, in position order', () => {
    renderSidebar();
    const rows = container.querySelectorAll('[draggable="true"]');
    expect(rows.length).toBe(pages.length);
    expect(rows[0].textContent).toContain('Work');
    expect(rows[1].textContent).toContain('Life');
    expect(rows[2].textContent).toContain('Travel');
  });

  it('clicking a row calls the page-select handler with that page id', () => {
    const { onPageSelect } = renderSidebar();
    const rows = container.querySelectorAll('[draggable="true"]');
    act(() => { (rows[1] as HTMLElement).click(); });
    expect(onPageSelect).toHaveBeenCalledWith('b');
  });

  it('dropping page A on page B calls insertPage with (A.id, B.position)', () => {
    const { onInsertPage } = renderSidebar();
    const rows = container.querySelectorAll('[draggable="true"]');
    const rowA = rows[0]; // Work, position 0
    const rowB = rows[2]; // Travel, position 2

    fireDataTransferEvent(rowA, 'dragstart', makeDataTransfer());
    fireDataTransferEvent(rowB, 'drop', makeDataTransfer());

    expect(onInsertPage).toHaveBeenCalledWith('a', 2);
  });

  it('when expanded, the toggle sits right-aligned on the wordmark row and calls onToggleCollapsed', () => {
    const { onToggleCollapsed } = renderSidebar({ isCollapsed: false });
    const toggle = Array.from(container.querySelectorAll('button')).find(
      b => b.title.startsWith('Collapse sidebar')
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();

    const wordmarkRow = toggle.parentElement as HTMLElement;
    expect(wordmarkRow.textContent).toContain('TileSpace');
    expect(wordmarkRow.lastElementChild).toBe(toggle);

    act(() => { toggle.click(); });
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
  });

  it('when collapsed, the toggle sits below the glyph, centred, and page titles are hidden', () => {
    const { onToggleCollapsed } = renderSidebar({ isCollapsed: true });
    const toggle = Array.from(container.querySelectorAll('button')).find(
      b => b.title.startsWith('Expand sidebar')
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();

    const wrapper = toggle.parentElement as HTMLElement;
    expect(wrapper.className).toContain('items-center');
    expect(container.textContent).not.toContain('Work');
    expect(container.textContent).not.toContain('Travel');

    act(() => { toggle.click(); });
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
  });

  it('the toggle title advertises the Cmd+\\ / Ctrl+\\ shortcut', () => {
    renderSidebar({ isCollapsed: false });
    const toggle = Array.from(container.querySelectorAll('button')).find(
      b => b.title.startsWith('Collapse sidebar')
    ) as HTMLButtonElement;
    expect(toggle.title).toContain('\\');
  });

  it('the footer holds only UserMenu — no toggle button — regardless of collapsed state', () => {
    renderSidebar({ isCollapsed: false });
    const footer = container.querySelector('.border-t') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.querySelector('button[title^="Collapse sidebar"]')).toBeNull();
    expect(footer.querySelector('button[title^="Expand sidebar"]')).toBeNull();
  });

  it('no toggle is rendered on mobile', () => {
    renderSidebar({ isMobile: true, isCollapsed: false });
    const toggle = Array.from(container.querySelectorAll('button')).find(
      b => b.title.startsWith('Collapse sidebar') || b.title.startsWith('Expand sidebar')
    );
    expect(toggle).toBeUndefined();
  });

  it('is 272px wide expanded — long page names wrap (line-clamp-2) instead of truncating', () => {
    renderSidebar({
      pages: [...pages, makePage({ id: 'd', title: 'Evening PEOPLE-time conversations', position: 3 })],
    });
    const aside = container.querySelector('aside') as HTMLElement;
    expect(aside.style.width).toBe('272px');

    const row = Array.from(container.querySelectorAll('[draggable="true"]')).find(
      (r) => r.textContent?.includes('Evening PEOPLE-time')
    ) as HTMLElement;
    const titleSpan = row.querySelector('span.line-clamp-2') as HTMLElement;
    expect(titleSpan).toBeTruthy();
    expect(titleSpan.className).not.toContain('truncate');
    expect(titleSpan.textContent).toBe('Evening PEOPLE-time conversations');
  });

  it('clears the active page highlight while Master View is active', () => {
    renderSidebar({ isMasterViewActive: true });
    const activeRow = Array.from(container.querySelectorAll('[draggable="true"]')).find(
      (r) => r.className.includes('font-semibold')
    );
    expect(activeRow).toBeUndefined();
  });

  it('renders a Master View entry above the page list, not as a page row', () => {
    const { onOpenMasterView } = (() => {
      const onOpenMasterView = vi.fn();
      renderSidebar({ onOpenMasterView });
      return { onOpenMasterView };
    })();
    const entry = Array.from(container.querySelectorAll('button')).find(
      (b) => b.title === 'Master View'
    ) as HTMLButtonElement;
    expect(entry).toBeTruthy();
    expect(entry.getAttribute('draggable')).not.toBe('true');

    const rows = container.querySelectorAll('[draggable="true"]');
    expect(entry.compareDocumentPosition(rows[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    act(() => { entry.click(); });
    expect(onOpenMasterView).toHaveBeenCalledTimes(1);
  });

  it('dots follow list position, not the page palette — same palette, different position, different colour', () => {
    renderSidebar(); // all three fixture pages share palette_id 'ocean-bold'
    const rows = container.querySelectorAll('[draggable="true"]');
    const dotColors = Array.from(rows).map((r) => (r.querySelector('span[style]') as HTMLElement).style.background);
    expect(dotColors).toEqual([rainbowSwatch(0), rainbowSwatch(1), rainbowSwatch(2)].map(hexToRgb));
  });

  it('no two neighbouring page dots share a colour, across 18 pages', () => {
    const manyPages = Array.from({ length: 18 }, (_, i) => makePage({ id: `p${i}`, title: `Page ${i}`, position: i }));
    renderSidebar({ pages: manyPages, tileCounts: {} });
    const rows = container.querySelectorAll('[draggable="true"]');
    expect(rows.length).toBe(18);
    const dotColors = Array.from(rows).map((r) => (r.querySelector('span[style]') as HTMLElement).style.background);
    for (let i = 1; i < dotColors.length; i++) {
      expect(dotColors[i]).not.toBe(dotColors[i - 1]);
    }
  });

  it('collapsed sidebar dots use the same position-based colour as expanded', () => {
    renderSidebar({ isCollapsed: true });
    const rows = container.querySelectorAll('[draggable="true"]');
    const dotColors = Array.from(rows).map((r) => (r.querySelector('span[style]') as HTMLElement).style.background);
    expect(dotColors).toEqual([rainbowSwatch(0), rainbowSwatch(1), rainbowSwatch(2)].map(hexToRgb));
  });
});

// jsdom normalizes inline style colours to rgb(); compare like for like.
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
