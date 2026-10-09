import { describe, it, expect } from 'vitest';
import {
  groupDocsByTheme,
  tileSizeForRank,
  maxTitlesForRank,
  visibleDocs,
  hiddenDocs,
  sortDocsNewestFirst,
} from '@/services/MasterViewService';
import type { DocTheme, MasterViewDoc } from '@/types/masterView';

function makeTheme(overrides: Partial<DocTheme>): DocTheme {
  return { id: 't1', name: 'Theme', swatch: '#2563EB', sort: 0, created_at: '2026-01-01', ...overrides };
}

function makeDoc(overrides: Partial<MasterViewDoc>): MasterViewDoc {
  return {
    linkId: 'd1',
    title: 'Doc',
    createdAt: '2026-01-01T00:00:00Z',
    summary: '',
    hidden: false,
    themeId: null,
    pageTitle: 'Inbox',
    pageSwatch: '#475569',
    ...overrides,
  };
}

describe('MasterViewService.tileSizeForRank / maxTitlesForRank', () => {
  it('rank 0 (the largest theme) is the one big 2x2 tile showing 5 titles', () => {
    expect(tileSizeForRank(0)).toBe('xl');
    expect(maxTitlesForRank(0)).toBe(5);
  });

  it('ranks 1 and 2 are wide 2x1 tiles showing 3 titles, matching TARGET_master_view.html section C', () => {
    expect(tileSizeForRank(1)).toBe('wide');
    expect(tileSizeForRank(2)).toBe('wide');
    expect(maxTitlesForRank(1)).toBe(3);
    expect(maxTitlesForRank(2)).toBe(3);
  });

  it('every later rank is a small 1x1 tile showing 3 titles', () => {
    for (const rank of [3, 4, 7, 20]) {
      expect(tileSizeForRank(rank)).toBe('sm');
      expect(maxTitlesForRank(rank)).toBe(3);
    }
  });
});

describe('MasterViewService.groupDocsByTheme', () => {
  const themes = [
    makeTheme({ id: 'big', name: 'Clients and work', sort: 0 }),
    makeTheme({ id: 'small', name: 'Learning', sort: 1 }),
    makeTheme({ id: 'empty', name: 'Unused', sort: 2 }),
  ];

  it('sorts groups largest-first and drops themes with no documents', () => {
    const docs = [
      makeDoc({ linkId: 'a', themeId: 'small' }),
      makeDoc({ linkId: 'b', themeId: 'big' }),
      makeDoc({ linkId: 'c', themeId: 'big' }),
      makeDoc({ linkId: 'd', themeId: 'big' }),
    ];
    const groups = groupDocsByTheme(docs, themes);
    expect(groups.map((g) => g.theme.id)).toEqual(['big', 'small']);
    expect(groups[0].docs).toHaveLength(3);
  });

  it('ignores documents whose theme_id does not match any known theme', () => {
    const docs = [makeDoc({ linkId: 'a', themeId: 'ghost' }), makeDoc({ linkId: 'b', themeId: null })];
    expect(groupDocsByTheme(docs, themes)).toEqual([]);
  });
});

describe('MasterViewService.visibleDocs / hiddenDocs / sortDocsNewestFirst', () => {
  it('splits hidden from visible without mutating either list', () => {
    const docs = [makeDoc({ linkId: 'a', hidden: true }), makeDoc({ linkId: 'b', hidden: false })];
    expect(visibleDocs(docs).map((d) => d.linkId)).toEqual(['b']);
    expect(hiddenDocs(docs).map((d) => d.linkId)).toEqual(['a']);
  });

  it('sorts newest first by created_at', () => {
    const docs = [
      makeDoc({ linkId: 'old', createdAt: '2026-01-01T00:00:00Z' }),
      makeDoc({ linkId: 'new', createdAt: '2026-06-01T00:00:00Z' }),
    ];
    expect(sortDocsNewestFirst(docs).map((d) => d.linkId)).toEqual(['new', 'old']);
  });
});
