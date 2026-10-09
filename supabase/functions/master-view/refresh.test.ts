import { describe, it, expect, vi, beforeEach } from 'vitest';

// aiClient talks to Deno.env/fetch, neither of which exist under plain
// Node/vitest — mock it so handleRefresh's calls through it are stubbed
// instead of throwing "Deno is not defined".
vi.mock('../_shared/aiClient.ts', () => ({
  completeText: vi.fn(),
  completeJSON: vi.fn(),
  AIClientError: class AIClientError extends Error {},
}));

import { handleRefresh } from './refresh.ts';
import { completeJSON, completeText } from '../_shared/aiClient.ts';

interface FakeInsight {
  link_id: string;
  summary: string;
  content_hash: string;
  theme_id: string | null;
  hidden: boolean;
  updated_at: string;
}

interface FakeTheme {
  id: string;
  name: string;
  swatch: string;
  sort: number;
  created_at: string;
}

/**
 * A minimal stand-in for the chunk of the Supabase JS client's fluent API
 * that `handleRefresh` touches: `.from(table).select()/.eq()/.upsert()/
 * .update().eq()/.insert().select().single()/.delete().in()`, backed by two
 * in-memory tables (`links` is fixed; `doc_insight` is mutated by updates).
 */
function makeFakeSupabase(opts: { links: { id: string; title: string; content: string | null }[]; insights: FakeInsight[]; themes: FakeTheme[] }) {
  const state = { insights: [...opts.insights], themes: [...opts.themes] };

  function fromDocInsight() {
    return {
      // select() with no further chaining resolves with current rows.
      select: (_cols: string) => Promise.resolve({ data: state.insights, error: null }),
      upsert: async (row: FakeInsight) => {
        const i = state.insights.findIndex((r) => r.link_id === row.link_id);
        if (i === -1) state.insights.push(row);
        else state.insights[i] = { ...state.insights[i], ...row };
        return { error: null };
      },
      update: (patch: Partial<FakeInsight>) => ({
        eq: async (_col: string, val: string) => {
          const i = state.insights.findIndex((r) => r.link_id === val);
          if (i !== -1) state.insights[i] = { ...state.insights[i], ...patch };
          return { error: null };
        },
      }),
    };
  }

  function fromLinks() {
    return {
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => Promise.resolve({ data: opts.links, error: null }),
      }),
    };
  }

  function fromDocTheme() {
    // select() is chained two ways by the real code: awaited directly
    // (`handleRefresh`), and with `.order(...)` appended
    // (`dedupeThemeSwatches`) — so the returned value must be both
    // thenable and carry `.order`.
    const selectResult = {
      order: async (_col: string, _opts: unknown) => ({ data: state.themes, error: null }),
      then: (resolve: (v: { data: FakeTheme[]; error: null }) => void) =>
        resolve({ data: state.themes, error: null }),
    };
    return {
      select: (_cols: string) => selectResult,
      insert: (_row: unknown) => ({
        select: () => ({
          single: async () => ({ data: { id: 'new-theme-id' }, error: null }),
        }),
      }),
      update: (patch: Partial<FakeTheme>) => ({
        eq: async (_col: string, val: string) => {
          const i = state.themes.findIndex((t) => t.id === val);
          if (i !== -1) state.themes[i] = { ...state.themes[i], ...patch };
          return { error: null };
        },
      }),
      delete: () => ({
        in: async (_col: string, _ids: string[]) => ({ error: null }),
      }),
    };
  }

  return {
    from(table: string) {
      if (table === 'links') return fromLinks();
      if (table === 'doc_insight') return fromDocInsight();
      if (table === 'doc_theme') return fromDocTheme();
      throw new Error(`Unexpected table: ${table}`);
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } } }),
    },
    _state: state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const CORS = {};

describe('handleRefresh — below-5 path themes newly-null insights (SPEC_new_docs_get_a_theme_2026-10-09.md)', () => {
  beforeEach(() => {
    vi.mocked(completeJSON).mockReset();
    vi.mocked(completeText).mockReset();
    // Fake content_hashes below never match the real sha256 of the fake
    // doc content, so handleRefresh always treats both docs as "changed"
    // and re-summarizes them first; stub that call so it does not error.
    vi.mocked(completeText).mockResolvedValue('A short summary.');
  });

  const themes: FakeTheme[] = [
    { id: 't-work', name: 'Clients and work', swatch: '#D8625C', sort: 0, created_at: '2026-01-01T00:00:00Z' },
    { id: 't-learn', name: 'Learning', swatch: '#EB883B', sort: 1, created_at: '2026-01-01T00:00:00Z' },
    { id: 't-money', name: 'Money', swatch: '#CF9B00', sort: 2, created_at: '2026-01-01T00:00:00Z' },
    { id: 't-home', name: 'Home', swatch: '#47A34E', sort: 3, created_at: '2026-01-01T00:00:00Z' },
  ];

  const links = [
    { id: 'doc-a', title: 'Invoice follow-up', content: 'Chase the overdue invoice.' },
    { id: 'doc-b', title: 'Sourdough notes', content: 'Hydration ratios that worked.' },
  ];

  function freshInsights(): FakeInsight[] {
    const now = new Date().toISOString();
    return [
      { link_id: 'doc-a', summary: 'Chase an overdue client invoice.', content_hash: 'hash-a', theme_id: null, hidden: false, updated_at: now },
      { link_id: 'doc-b', summary: 'Sourdough hydration ratios.', content_hash: 'hash-b', theme_id: null, hidden: false, updated_at: now },
    ];
  }

  it('2 new docs, 4 themes, below the re-theme threshold: both get valid theme ids from one batched call', async () => {
    const supabase = makeFakeSupabase({ links, insights: freshInsights(), themes });
    vi.mocked(completeJSON).mockResolvedValue({
      assignments: { 'doc-a': 'Clients and work', 'doc-b': 'Learning' },
    });

    const res = await handleRefresh(supabase, CORS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.rethemed).toBe(false); // below-5 path never runs the full re-theme

    expect(completeJSON).toHaveBeenCalledTimes(1); // batched into one call, not two
    expect(supabase._state.insights.find((i: FakeInsight) => i.link_id === 'doc-a')?.theme_id).toBe('t-work');
    expect(supabase._state.insights.find((i: FakeInsight) => i.link_id === 'doc-b')?.theme_id).toBe('t-learn');
  });

  it('a bad answer (name outside the existing set) leaves that document theme_id null', async () => {
    const supabase = makeFakeSupabase({ links, insights: freshInsights(), themes });
    vi.mocked(completeJSON).mockResolvedValue({
      assignments: { 'doc-a': 'Clients and work', 'doc-b': 'Invented Theme That Does Not Exist' },
    });

    await handleRefresh(supabase, CORS);

    expect(supabase._state.insights.find((i: FakeInsight) => i.link_id === 'doc-a')?.theme_id).toBe('t-work');
    expect(supabase._state.insights.find((i: FakeInsight) => i.link_id === 'doc-b')?.theme_id).toBeNull();
  });

  it('a model call that throws outright leaves every candidate null instead of failing the refresh', async () => {
    const supabase = makeFakeSupabase({ links, insights: freshInsights(), themes });
    vi.mocked(completeJSON).mockRejectedValue(new Error('model unavailable'));

    const res = await handleRefresh(supabase, CORS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(supabase._state.insights.find((i: FakeInsight) => i.link_id === 'doc-a')?.theme_id).toBeNull();
    expect(supabase._state.insights.find((i: FakeInsight) => i.link_id === 'doc-b')?.theme_id).toBeNull();
  });

  it('does nothing when there are no themes yet (that is the needsTheming=true path, not this one)', async () => {
    const supabase = makeFakeSupabase({ links, insights: freshInsights(), themes: [] });
    // needsTheming becomes true (no themes), so the big retheme call runs —
    // give it a well-shaped response so handleRefresh doesn't error out.
    vi.mocked(completeJSON).mockResolvedValue({
      themes: ['Clients and work', 'Learning'],
      assignments: { 'doc-a': 'Clients and work', 'doc-b': 'Learning' },
    });

    const res = await handleRefresh(supabase, CORS);
    const body = await res.json();
    expect(body.rethemed).toBe(true);
  });
});
