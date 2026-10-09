#!/usr/bin/env python3
"""
Regenerates every TileSpace app icon from the single master artwork at
docs/icon-source/tilespace-icon-<N>.png.

The master is the "any"-purpose icon at the largest size we have source
for: a square canvas, rounded-rect content, transparent outside it. Every
other file is derived from it:

  - smaller "any" sizes: a nearest-neighbour resize of the master (see
    `resize_rgba` for why nearest-neighbour, not a filtered resize).
  - "maskable" sizes, apple-touch-icon, and the favicons: the same
    resize, then flattened onto an opaque canvas filled with the
    background colour — squaring off the rounded corners instead of
    leaving them transparent, which is exactly the relationship the
    committed maskable/apple-touch/favicon files already had to the
    "any" set before this script existed (verified pixel-for-pixel
    against the pre-2026-10-09 files: identical tile pixel counts,
    corners filled instead of transparent).

Usage:
    python3 scripts/build_icons.py [--master PATH] [--bg "#1E40AF"]

Run from anywhere; paths are resolved relative to this file's repo root.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

from PIL import Image

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_MASTER = REPO_ROOT / "docs" / "icon-source" / "tilespace-icon-512.png"
ICONS_DIR = REPO_ROOT / "public" / "icons"

DEFAULT_BG_HEX = "#1E40AF"

# (filename, size, square) — square=True flattens the rounded corners onto
# the background colour (maskable + apple-touch-icon + favicons); False
# keeps the master's transparent rounded-rect corners ("any"-purpose).
TARGETS: list[tuple[str, int, bool]] = [
    ("icon-72x72.png", 72, False),
    ("icon-96x96.png", 96, False),
    ("icon-128x128.png", 128, False),
    ("icon-144x144.png", 144, False),
    ("icon-192x192.png", 192, False),
    ("icon-384x384.png", 384, False),
    ("icon-512x512.png", 512, False),
    ("icon-maskable-192x192.png", 192, True),
    ("icon-maskable-512x512.png", 512, True),
    ("apple-touch-icon.png", 180, True),
    ("favicon-32x32.png", 32, True),
    ("favicon-16x16.png", 16, True),
]


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def recolor_background(master: Image.Image, new_bg: tuple[int, int, int]) -> Image.Image:
    """Substitutes the master's own background colour for `new_bg` everywhere it appears.

    The background is detected as the most common fully-opaque colour —
    always true here since the background covers more of the canvas than
    any single tile. Recolouring the master itself (rather than just the
    flattened/square outputs below) is what makes `--bg` apply consistently
    to every derived size, "any" and "square" alike, instead of only the
    square ones picking up a new colour while the rounded icons keep
    whatever colour happens to be baked into the master.
    """
    import numpy as np

    arr = np.array(master)
    opaque = arr[:, :, 3] == 255
    colors, counts = np.unique(arr[opaque][:, :3].reshape(-1, 3), axis=0, return_counts=True)
    old_bg = tuple(int(v) for v in colors[counts.argmax()])
    if old_bg == new_bg:
        return master

    match = opaque & (arr[:, :, 0] == old_bg[0]) & (arr[:, :, 1] == old_bg[1]) & (arr[:, :, 2] == old_bg[2])
    arr = arr.copy()
    arr[match, 0], arr[match, 1], arr[match, 2] = new_bg
    return Image.fromarray(arr, "RGBA")


def resize_rgba(master: Image.Image, size: int) -> Image.Image:
    """Nearest-neighbour-resizes the master to `size`.

    Every committed icon at every size (16 through 512, both before and
    after this script existed) is pure flat colour with strictly binary
    alpha — no anti-aliasing anywhere, at any size, including the 1-2px
    rounded-corner curve. A filtered resize (Lanczos/bilinear/box) blends
    neighbouring pixels and breaks that at both ends: it reintroduces
    partial alpha at the rounded corner (measured up to 4.2% of pixels at
    72px — over pwaManifest.test.ts's 2% tolerance) and, worse, at extreme
    ratios like 512->16 it visibly muddies the flat tile colours into a
    blurred, ringy mess no one would accept as the favicon. Nearest-
    neighbour never blends two source pixels, so both problems disappear
    by construction and the output stays flat/crisp like every file it
    replaces, at every size.
    """
    if master.size == (size, size):
        return master.copy()
    return master.resize((size, size), Image.NEAREST)


def flatten_to_square(img: Image.Image, bg_rgb: tuple[int, int, int]) -> Image.Image:
    """Composites onto an opaque bg-coloured canvas, squaring off any transparent corners."""
    canvas = Image.new("RGBA", img.size, bg_rgb + (255,))
    canvas.alpha_composite(img)
    return canvas.convert("RGB").convert("RGBA")  # drop alpha -> force fully opaque


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--master", type=pathlib.Path, default=DEFAULT_MASTER)
    parser.add_argument("--bg", type=str, default=DEFAULT_BG_HEX)
    parser.add_argument("--out-dir", type=pathlib.Path, default=ICONS_DIR)
    args = parser.parse_args()

    if not args.master.exists():
        print(f"Master not found: {args.master}", file=sys.stderr)
        return 1

    bg_rgb = hex_to_rgb(args.bg)
    master = Image.open(args.master).convert("RGBA")
    master = recolor_background(master, bg_rgb)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    for filename, size, square in TARGETS:
        resized = resize_rgba(master, size)
        out = flatten_to_square(resized, bg_rgb) if square else resized
        out.save(args.out_dir / filename)
        print(f"wrote {args.out_dir / filename} ({size}x{size}, {'square' if square else 'any'})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
