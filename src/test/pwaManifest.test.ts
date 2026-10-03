import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync, spawn, type ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import path from 'path';

// Proves the production build serves one valid, installable PWA manifest
// whose icons are exactly the files committed to public/icons/. Chrome
// silently falls back to a generic letter-tile icon when any of this is
// missing — this is the test that would have caught TileSpace shipping
// with no manifest at all.

const PORT = 5261;
const BASE_URL = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, '../..');

let server: ChildProcess;

function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  // PNG IHDR: width/height are big-endian uint32 at offset 16/20.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function sha1(bytes: Uint8Array): string {
  return createHash('sha1').update(bytes).digest('hex');
}

async function waitForServer(url: string, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not come up within ${timeoutMs}ms`);
}

beforeAll(async () => {
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'pipe' }
  );
  await waitForServer(BASE_URL + '/');
}, 60000);

afterAll(() => {
  server?.kill();
});

describe('TileSpace PWA manifest contract', () => {
  it('serves exactly one manifest link from the HTML', async () => {
    const html = await (await fetch(BASE_URL + '/')).text();
    const matches = html.match(/<link[^>]+rel=["']manifest["'][^>]*>/gi) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('serves a manifest with the required installability fields', async () => {
    const res = await fetch(BASE_URL + '/manifest.json');
    expect(res.status).toBe(200);
    const manifest = await res.json();
    expect(manifest.id).toBeTruthy();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.scope).toBeTruthy();
    expect(['standalone', 'minimal-ui', 'fullscreen']).toContain(manifest.display);
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);

    const anyIcons = manifest.icons.filter((i: { purpose?: string }) => !i.purpose || i.purpose === 'any');
    expect(anyIcons.some((i: { sizes: string }) => i.sizes === '192x192')).toBe(true);
    expect(anyIcons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);

    const maskableIcons = manifest.icons.filter((i: { purpose?: string }) => i.purpose === 'maskable');
    expect(maskableIcons.some((i: { sizes: string }) => i.sizes === '192x192')).toBe(true);
    expect(maskableIcons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
  });

  it('serves every manifest icon as a real PNG matching its declared size and the committed file', async () => {
    const manifest = await (await fetch(BASE_URL + '/manifest.json')).json();
    expect(manifest.icons.length).toBeGreaterThan(0);

    for (const icon of manifest.icons as { src: string; sizes: string }[]) {
      const url = new URL(icon.src, BASE_URL);
      const res = await fetch(url.toString());
      expect(res.status, `${icon.src} status`).toBe(200);
      expect(res.headers.get('content-type'), `${icon.src} content-type`).toContain('image/png');

      const bytes = new Uint8Array(await res.arrayBuffer());
      const { width, height } = pngDimensions(bytes);
      const [declaredW, declaredH] = icon.sizes.split('x').map(Number);
      expect(width, `${icon.src} width`).toBe(declaredW);
      expect(height, `${icon.src} height`).toBe(declaredH);

      const repoPath = path.join(ROOT, 'public', url.pathname.replace(/^\//, ''));
      const repoBytes = new Uint8Array(await (await import('fs/promises')).readFile(repoPath));
      expect(sha1(bytes), `${icon.src} byte-identical to committed file`).toBe(sha1(repoBytes));
    }
  });

  it('serves an apple-touch-icon link', async () => {
    const html = await (await fetch(BASE_URL + '/')).text();
    expect(html).toMatch(/<link[^>]+rel=["']apple-touch-icon["']/i);
  });
});
