import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Sidebar } from '@/components/Sidebar';
import { LAYOUT } from '@/lib/constants';
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
      ...overrides,
    };
    act(() => { root.render(<Sidebar {...props} />); });
    return { onPageSelect, onInsertPage };
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

  it('the collapsed toggle writes LAYOUT.SIDEBAR_COLLAPSED_KEY and the collapsed render omits page titles', () => {
    renderSidebar();
    const toggle = Array.from(container.querySelectorAll('button')).find(
      b => b.title === 'Collapse'
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();

    act(() => { toggle.click(); });

    expect(localStorage.getItem(LAYOUT.SIDEBAR_COLLAPSED_KEY)).toBe('1');
    expect(container.textContent).not.toContain('Work');
    expect(container.textContent).not.toContain('Travel');
  });

  it('a localStorage.setItem that throws does not crash the component', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('private mode'); };

    expect(() => renderSidebar()).not.toThrow();
    const toggle = Array.from(container.querySelectorAll('button')).find(
      b => b.title === 'Collapse'
    ) as HTMLButtonElement;
    expect(() => act(() => { toggle.click(); })).not.toThrow();

    localStorage.setItem = original;
  });
});
