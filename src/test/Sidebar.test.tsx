import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Sidebar } from '@/components/Sidebar';
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
});
