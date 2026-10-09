import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ThemeTile } from '@/components/MasterView/ThemeTile';
import type { ThemeGroup } from '@/services';
import type { DocTheme, MasterViewDoc } from '@/types/masterView';

// Plain react-dom + jsdom, no @testing-library (see Sidebar.test.tsx).

function theme(overrides: Partial<DocTheme> = {}): DocTheme {
  return { id: 't1', name: 'Clients and work', swatch: '#2563EB', sort: 0, created_at: '2026-01-01', ...overrides };
}

function doc(overrides: Partial<MasterViewDoc> = {}): MasterViewDoc {
  return {
    linkId: 'd1',
    title: 'Saying no to extra client work',
    createdAt: '2026-10-01T00:00:00Z',
    summary: '',
    hidden: false,
    themeId: 't1',
    pageTitle: 'Life Advice',
    pageSwatch: '#DB2777',
    ...overrides,
  };
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

let cleanups: (() => void)[] = [];

function renderTile(group: ThemeGroup, rank = 1, onClick = vi.fn(), onOpenDoc = vi.fn()) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => { root.render(<ThemeTile group={group} rank={rank} onClick={onClick} onOpenDoc={onOpenDoc} />); });
  cleanups.push(() => { act(() => { root.unmount(); }); container.remove(); });
  return { container, onClick, onOpenDoc };
}

describe('ThemeTile', () => {
  afterEach(() => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  });

  it('clicking a title opens that document directly, not the category', () => {
    const group: ThemeGroup = { theme: theme(), docs: [doc({ linkId: 'a', title: 'Raising your rates' })] };
    const { container, onClick, onOpenDoc } = renderTile(group);

    const titleButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Raising your rates'
    )!;
    expect(titleButton).toBeTruthy();
    act(() => { titleButton.click(); });

    expect(onOpenDoc).toHaveBeenCalledWith('a');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('clicking the theme name/count header opens the category, not a document', () => {
    const group: ThemeGroup = { theme: theme({ name: 'Clients and work' }), docs: [doc()] };
    const { container, onClick, onOpenDoc } = renderTile(group);

    const header = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Clients and work')
    )!;
    act(() => { header.click(); });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenDoc).not.toHaveBeenCalled();
  });

  it('clicking the empty tile area opens the category', () => {
    const group: ThemeGroup = { theme: theme(), docs: [doc()] };
    const { container, onClick } = renderTile(group);

    const tile = container.firstElementChild as HTMLElement;
    act(() => { tile.click(); });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('beyond the title limit, shows the newest that fit plus "N more", which opens the category', () => {
    const docs = Array.from({ length: 5 }, (_, i) =>
      doc({ linkId: `d${i}`, title: `Title ${i}`, createdAt: `2026-10-0${5 - i}T00:00:00Z` })
    );
    const group: ThemeGroup = { theme: theme(), docs };
    // rank 1 -> maxTitlesForRank = 3, so 2 titles shown plus "3 more"
    const { container, onClick } = renderTile(group, 1);

    const buttons = Array.from(container.querySelectorAll('button'));
    const titleButtons = buttons.filter((b) => b.textContent?.startsWith('Title '));
    expect(titleButtons).toHaveLength(2);

    const moreButton = buttons.find((b) => b.textContent?.includes('more'))!;
    expect(moreButton.textContent).toContain('3 more');

    act(() => { moreButton.click(); });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows all titles with no "more" row when they all fit', () => {
    const group: ThemeGroup = { theme: theme(), docs: [doc({ linkId: 'a' }), doc({ linkId: 'b', title: 'Raising your rates' })] };
    const { container } = renderTile(group, 1);

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.some((b) => b.textContent?.includes('more'))).toBe(false);
  });

  it('uses dark text (#1C1917) on gold and orange tiles, and white on every other swatch', () => {
    const goldGroup: ThemeGroup = { theme: theme({ swatch: '#CF9B00' }), docs: [doc()] };
    const { container: goldContainer } = renderTile(goldGroup);
    const goldTile = goldContainer.firstElementChild as HTMLElement;
    expect(goldTile.style.color).toBe(hexToRgb('#1C1917'));

    const orangeGroup: ThemeGroup = { theme: theme({ swatch: '#EB883B' }), docs: [doc()] };
    const { container: orangeContainer } = renderTile(orangeGroup);
    const orangeTile = orangeContainer.firstElementChild as HTMLElement;
    expect(orangeTile.style.color).toBe(hexToRgb('#1C1917'));

    const blueGroup: ThemeGroup = { theme: theme({ swatch: '#3690E3' }), docs: [doc()] };
    const { container: blueContainer } = renderTile(blueGroup);
    const blueTile = blueContainer.firstElementChild as HTMLElement;
    expect(blueTile.style.color).toBe(hexToRgb('#FFFFFF'));
  });
});
