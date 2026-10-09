import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MasterView } from '@/components/MasterView';
import { useMasterViewStore } from '@/state';
import * as api from '@/api';
import type { DocTheme, MasterViewDoc } from '@/types/masterView';

// Plain react-dom + jsdom, no @testing-library (see Sidebar.test.tsx).

vi.mock('@/api', () => ({
  refreshMasterView: vi.fn(),
  fetchThemes: vi.fn(),
  fetchMasterViewDocs: vi.fn(),
  askMasterView: vi.fn(),
  setDocHidden: vi.fn(),
  fetchLink: vi.fn(),
}));

function theme(overrides: Partial<DocTheme>): DocTheme {
  return { id: 'big', name: 'Clients and work', swatch: '#2563EB', sort: 0, created_at: '2026-01-01', ...overrides };
}

function doc(overrides: Partial<MasterViewDoc>): MasterViewDoc {
  return {
    linkId: 'd1',
    title: 'Saying no to extra client work',
    createdAt: '2026-10-01T00:00:00Z',
    summary: 'A short summary.',
    hidden: false,
    themeId: 'big',
    pageTitle: 'Life Advice',
    pageSwatch: '#DB2777',
    ...overrides,
  };
}

const RESET_STATE = {
  themes: [], docs: [], loading: true, refreshing: false, hasOpenedOnce: false,
  modelError: null, selectedThemeId: null, showHidden: false,
  askQuery: '', askResults: null, askLoading: false, askError: null,
};

describe('MasterView', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useMasterViewStore.setState(RESET_STATE);
    vi.mocked(api.refreshMasterView).mockResolvedValue({ ok: true });
    vi.mocked(api.fetchThemes).mockResolvedValue([]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([]);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  async function renderAndFlush(onOpenDocument = vi.fn()) {
    await act(async () => {
      root.render(<MasterView onOpenDocument={onOpenDocument} />);
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    });
    return { onOpenDocument };
  }

  it('shows "Sorting your documents..." on first visit while refreshing with no themes yet', async () => {
    let resolveRefresh: (v: { ok: boolean }) => void = () => {};
    vi.mocked(api.refreshMasterView).mockReturnValue(new Promise((r) => { resolveRefresh = r; }));
    await act(async () => { root.render(<MasterView onOpenDocument={vi.fn()} />); });
    expect(container.textContent).toContain('Sorting your documents...');
    await act(async () => { resolveRefresh({ ok: true }); await Promise.resolve(); await Promise.resolve(); });
  });

  it('shows an empty state when there are no documents at all', async () => {
    await renderAndFlush();
    expect(container.textContent).toContain('No documents yet');
  });

  it('renders one tile per theme, largest first, after a normal refresh', async () => {
    vi.mocked(api.fetchThemes).mockResolvedValue([
      theme({ id: 'big', name: 'Clients and work', sort: 0 }),
      theme({ id: 'small', name: 'Learning', sort: 1, swatch: '#475569' }),
    ]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([
      doc({ linkId: 'a', themeId: 'big' }),
      doc({ linkId: 'b', themeId: 'big' }),
      doc({ linkId: 'c', themeId: 'small' }),
    ]);
    await renderAndFlush();
    const tiles = container.querySelectorAll('button');
    const tileTexts = Array.from(tiles).map((t) => t.textContent);
    expect(tileTexts.some((t) => t?.includes('Clients and work') && t.includes('2'))).toBe(true);
    expect(tileTexts.some((t) => t?.includes('Learning') && t.includes('1'))).toBe(true);
  });

  it('clicking a theme tile opens its documents as cards, including a Hide action', async () => {
    vi.mocked(api.fetchThemes).mockResolvedValue([theme({ id: 'big' })]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    await renderAndFlush();

    const tile = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Clients and work'))!;
    await act(async () => { tile.click(); });

    expect(container.textContent).toContain('Saying no to extra client work');
    const hideButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Hide');
    expect(hideButton).toBeTruthy();
  });

  it('hiding a document moves it under "N hidden. Show hidden", and Show hidden restores it to view', async () => {
    vi.mocked(api.setDocHidden).mockResolvedValue(undefined);
    vi.mocked(api.fetchThemes).mockResolvedValue([theme({ id: 'big' })]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' }), doc({ linkId: 'b', title: 'Raising your rates' })]);
    await renderAndFlush();

    const tile = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Clients and work'))!;
    await act(async () => { tile.click(); });

    const hideButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Hide')!;
    await act(async () => { hideButton.click(); await Promise.resolve(); });

    expect(api.setDocHidden).toHaveBeenCalledWith('a', true);
    expect(container.textContent).toContain('1 hidden');
    expect(container.textContent).toContain('Show hidden');

    const showHidden = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Show hidden'))!;
    await act(async () => { showHidden.click(); });
    const restoreButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Restore');
    expect(restoreButton).toBeTruthy();
  });

  it('rolls back optimistic hide when the write fails', async () => {
    vi.mocked(api.setDocHidden).mockRejectedValue(new Error('network down'));
    vi.mocked(api.fetchThemes).mockResolvedValue([theme({ id: 'big' })]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    await renderAndFlush();

    const tile = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Clients and work'))!;
    await act(async () => { tile.click(); });

    const hideButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Hide')!;
    await act(async () => { hideButton.click(); await Promise.resolve(); await Promise.resolve(); });

    expect(useMasterViewStore.getState().docs.find((d) => d.linkId === 'a')?.hidden).toBe(false);
  });

  it('falls back to a flat unsorted grid with the model-error message when refresh fails and there are no themes', async () => {
    vi.mocked(api.refreshMasterView).mockResolvedValue({ ok: false, error: 'model unavailable' });
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a', themeId: null })]);
    await renderAndFlush();
    expect(container.textContent).toContain("Couldn't sort right now");
    expect(container.textContent).toContain('Saying no to extra client work');
  });

  it('Ask: typing a query and pressing Enter shows up to 8 matches, each with its reason', async () => {
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    vi.mocked(api.askMasterView).mockResolvedValue([{ linkId: 'a', reason: 'Matches your note about clients' }]);
    await renderAndFlush();

    const input = container.querySelector('input') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'saying no to clients');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await Promise.resolve(); await Promise.resolve();
    });

    expect(container.textContent).toContain('Matches your note about clients');
  });

  it('Ask: no match shows "Nothing close. Try other words."', async () => {
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    vi.mocked(api.askMasterView).mockResolvedValue([]);
    await renderAndFlush();

    const input = container.querySelector('input') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'nonsense query');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await Promise.resolve(); await Promise.resolve();
    });

    expect(container.textContent).toContain('Nothing close. Try other words.');
  });

  it('Ask: Escape clears results back to the theme tiles', async () => {
    vi.mocked(api.fetchThemes).mockResolvedValue([theme({ id: 'big' })]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    vi.mocked(api.askMasterView).mockResolvedValue([{ linkId: 'a', reason: 'A reason' }]);
    await renderAndFlush();

    const input = container.querySelector('input') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'clients');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await Promise.resolve(); await Promise.resolve();
    });
    expect(container.textContent).toContain('A reason');

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.textContent).not.toContain('A reason');
    expect(container.textContent).toContain('Clients and work');
  });

  it('returning to the overview (what the sidebar Master View entry does) clears an open category', async () => {
    vi.mocked(api.fetchThemes).mockResolvedValue([theme({ id: 'big' })]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    await renderAndFlush();

    const tile = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Clients and work'))!;
    await act(async () => { tile.click(); });
    expect(container.textContent).toContain('1 documents'); // ThemeDetail-only text

    // This is exactly what App.tsx's handleOpenMasterView calls when the
    // sidebar's Master View entry is clicked (Decision 2).
    await act(async () => {
      useMasterViewStore.getState().selectTheme(null);
      useMasterViewStore.getState().clearAsk();
    });

    expect(container.textContent).not.toContain('1 documents');
    expect(container.textContent).toContain('Clients and work');
  });

  it('returning to the overview (what the sidebar Master View entry does) clears Ask results', async () => {
    vi.mocked(api.fetchThemes).mockResolvedValue([theme({ id: 'big' })]);
    vi.mocked(api.fetchMasterViewDocs).mockResolvedValue([doc({ linkId: 'a' })]);
    await renderAndFlush();

    await act(async () => {
      useMasterViewStore.setState({ askResults: [{ linkId: 'a', reason: 'A reason' }] });
    });
    expect(container.textContent).toContain('A reason');

    await act(async () => {
      useMasterViewStore.getState().selectTheme(null);
      useMasterViewStore.getState().clearAsk();
    });

    expect(container.textContent).not.toContain('A reason');
    expect(container.textContent).toContain('Clients and work');
  });
});
