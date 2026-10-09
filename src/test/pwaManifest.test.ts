import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync, spawn, type ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import { inflateSync } from 'zlib';
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

// Minimal PNG pixel decoder (8-bit, non-interlaced, RGB/RGBA only) — enough
// to prove a maskable icon is actually opaque edge to edge. Chrome treats a
// maskable icon with transparent/translucent pixels as unreliable and falls
// back to framing the icon itself, which is the exact bug this guards.
type DecodedPng = { width: number; height: number; pixels: Buffer };

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(bytes: Buffer): DecodedPng {
  if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idatChunks: Buffer[] = [];
  while (offset < bytes.length) {
    const len = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      interlace = data.readUInt8(12);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error('interlaced PNG not supported');
  if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported color type ${colorType}`);

  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawOffset];
    rawOffset += 1;
    const scanline = raw.subarray(rawOffset, rawOffset + stride);
    rawOffset += stride;
    const prevRow = y === 0 ? null : out.subarray((y - 1) * stride, y * stride);
    const curRow = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const rawByte = scanline[x];
      const a = x >= channels ? curRow[x - channels] : 0;
      const b = prevRow ? prevRow[x] : 0;
      const c = prevRow && x >= channels ? prevRow[x - channels] : 0;
      let value: number;
      switch (filterType) {
        case 0: value = rawByte; break;
        case 1: value = (rawByte + a) & 0xff; break;
        case 2: value = (rawByte + b) & 0xff; break;
        case 3: value = (rawByte + Math.floor((a + b) / 2)) & 0xff; break;
        case 4: value = (rawByte + paeth(a, b, c)) & 0xff; break;
        default: throw new Error(`unsupported filter type ${filterType}`);
      }
      curRow[x] = value;
    }
  }
  if (channels === 3) {
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0, j = 0; i < out.length; i += 3, j += 4) {
      rgba[j] = out[i]; rgba[j + 1] = out[i + 1]; rgba[j + 2] = out[i + 2]; rgba[j + 3] = 255;
    }
    return { width, height, pixels: rgba };
  }
  return { width, height, pixels: out };
}

function pixelAt(png: DecodedPng, x: number, y: number): [number, number, number, number] {
  const i = (y * png.width + x) * 4;
  return [png.pixels[i], png.pixels[i + 1], png.pixels[i + 2], png.pixels[i + 3]];
}

function isFullyOpaque(png: DecodedPng): boolean {
  for (let i = 3; i < png.pixels.length; i += 4) {
    if (png.pixels[i] !== 255) return false;
  }
  return true;
}

function colorDistance(a: number[], b: number[]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function cornersMatchBackground(png: DecodedPng, tolerance = 40): boolean {
  const { width: w, height: h } = png;
  const inset = Math.max(4, Math.round(Math.min(w, h) * 0.03));
  const corners: [number, number, number, number][] = [
    [0, 0, inset, inset],
    [w - 1, 0, w - 1 - inset, inset],
    [0, h - 1, inset, h - 1 - inset],
    [w - 1, h - 1, w - 1 - inset, h - 1 - inset],
  ];
  return corners.every(([cx, cy, ix, iy]) => colorDistance(pixelAt(png, cx, cy), pixelAt(png, ix, iy)) <= tolerance);
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

  it('serves an apple-touch-icon link, byte-identical to the committed file', async () => {
    const html = await (await fetch(BASE_URL + '/')).text();
    const match = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    expect(match).toBeTruthy();

    const url = new URL(match![1], BASE_URL);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());

    const repoPath = path.join(ROOT, 'public', url.pathname.replace(/^\//, '').split('?')[0]);
    const repoBytes = new Uint8Array(await (await import('fs/promises')).readFile(repoPath));
    expect(sha1(bytes)).toBe(sha1(repoBytes));
  });

  it('any-purpose icons have no partially-transparent content fill', async () => {
    // The rounded-corner padding on an any-purpose icon is legitimately
    // alpha=0, and a normal antialiased corner curve leaves a thin fringe of
    // genuinely-partial pixels — calibrated 2026-10-04 at 743/262144 (0.28%)
    // on Timeboxxer's known-good any-purpose icon. That's nothing like the
    // bug this guards: TileSpace shipped every tile fill at 59-78% opacity,
    // 91668/262144 (35%) partial pixels (SPEC_pwa_icons_dock.md Phase 2) —
    // invisible to the maskable-only check above since Chrome's installed
    // .icns is built from the maskable icon, not this one, but still a real
    // authoring defect in its own right. MAX_PARTIAL_ALPHA_FRACTION sits
    // well above the AA-fringe noise floor and well below a real mismatch.
    const MAX_PARTIAL_ALPHA_FRACTION = 0.02;
    const manifest = await (await fetch(BASE_URL + '/manifest.json')).json();
    const anyIcons = manifest.icons.filter((i: { purpose?: string }) => !i.purpose || i.purpose === 'any');
    expect(anyIcons.length).toBeGreaterThan(0);

    for (const icon of anyIcons as { src: string }[]) {
      const url = new URL(icon.src, BASE_URL);
      const res = await fetch(url);
      const bytes = Buffer.from(await res.arrayBuffer());
      const png = decodePng(bytes);
      let partial = 0;
      for (let i = 3; i < png.pixels.length; i += 4) {
        const a = png.pixels[i];
        if (a > 0 && a < 255) partial++;
      }
      const total = png.width * png.height;
      const fraction = partial / total;
      expect(
        fraction,
        `${icon.src}: ${partial}/${total} (${(fraction * 100).toFixed(1)}%) partially-transparent pixels`
      ).toBeLessThanOrEqual(MAX_PARTIAL_ALPHA_FRACTION);
    }
  });

  it('maskable icons are fully opaque with a corner fill that matches the background', async () => {
    const manifest = await (await fetch(BASE_URL + '/manifest.json')).json();
    const maskableIcons = manifest.icons.filter((i: { purpose?: string }) => i.purpose === 'maskable');
    expect(maskableIcons.length).toBeGreaterThan(0);

    for (const icon of maskableIcons as { src: string }[]) {
      const url = new URL(icon.src, BASE_URL);
      const res = await fetch(url);
      const bytes = Buffer.from(await res.arrayBuffer());
      const png = decodePng(bytes);
      expect(isFullyOpaque(png), `${icon.src} has a non-opaque pixel`).toBe(true);
      expect(cornersMatchBackground(png), `${icon.src} corner doesn't match its local background`).toBe(true);
    }
  });

  it('the 512 icon background is deep blue (#1E40AF), not the old black (SPEC_icon_blue_background_2026-10-09.md)', async () => {
    const res = await fetch(BASE_URL + '/icons/icon-maskable-512x512.png');
    const bytes = Buffer.from(await res.arrayBuffer());
    const png = decodePng(bytes);
    expect(pixelAt(png, 0, 0)).toEqual([0x1e, 0x40, 0xaf, 255]);
  });
});
