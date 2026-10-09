import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { AppShell } from '@/components/AppShell';
import type { Page } from '@/types';

// Decision 1-2 of SPEC_depth_2026-10-09.md (option B): a warm-grey backdrop
// behind the sidebar, and the content column raised as its own rounded,
// shadowed panel. Same no-@testing-library/react constraint as Sidebar.test.tsx.

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}));

function makePage(overrides: Partial<Page>): Page {
  return {
    id: 'p1',
    user_id: 'u1',
    position: 0,
    title: 'Work',
    palette_id: 'ocean-bold',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('AppShell', () => {
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

  function renderShell() {
    const page = makePage({});
    act(() => {
      root.render(
        <AppShell
          pages={[page]}
          tileCounts={{ p1: 0 }}
          currentPage={page}
          currentPageId="p1"
          onPageSelect={vi.fn()}
          onInsertPage={vi.fn()}
          onUpdatePageTitle={vi.fn()}
          onResetPage={vi.fn()}
          onCreatePage={vi.fn()}
          isMobile={false}
          isMobileSidebarOpen={false}
          onMobileSidebarOpen={vi.fn()}
          onMobileSidebarClose={vi.fn()}
          isSidebarCollapsed={false}
          onToggleSidebarCollapsed={vi.fn()}
          isMasterViewActive={false}
          onOpenMasterView={vi.fn()}
        >
          <div>content</div>
        </AppShell>
      );
    });
  }

  it('puts the backdrop gradient on the root', () => {
    renderShell();
    expect(container.firstElementChild?.className).toContain('bg-backdrop');
  });

  it('wraps the content column in the raised panel', () => {
    renderShell();
    const panel = container.querySelector('.rounded-panel');
    expect(panel).not.toBeNull();
    expect(panel?.className).toContain('shadow-panel');
    expect(panel?.textContent).toContain('content');
  });
});
