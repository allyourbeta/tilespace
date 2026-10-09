# SPEC: TileSpace icon, blue background instead of black

Written: 2026-10-09 16:40 PT. Version 1. Checked against SPEC_CHECKLIST.md rules 1-14.
Roles: planner Claude (chat), executor Claude Code. Unattended, about 20 min.
Run AFTER the "new docs get a theme + Nunito" round has finished and committed.

## Decisions you will SEE

1. The app icon's black background becomes deep blue #1E40AF, the same as
   the title bar. The tiles do not change at all: same shapes, colours,
   positions, sizes.
2. Nothing else changes.

## What the planner checked

- Ashish's dock screenshot 2026-10-09: warm orange/gold/yellow tiles on a
  black rounded square.
- `public/manifest.json` lists 9 icons under `/icons/` (72-512 plus two
  maskable), each with `?v=1f02f067`. No icon source file or generator
  script was found in the repo copy the planner had (it excludes
  `public/icons/`).
- `src/test/pwaManifest.test.ts` exists (the PWA icon contract test from
  the 2026-10-03 icon round).
- The cross-project process lives in
  `~/Droppbox/programming/dev-kit/pwa-icons/` (CHECKLIST.md,
  SPEC_install_pwa_icons.md, LESSONS.md, and the `pwa-icon-check`
  command in ~/bin). Follow it. LESSONS.md wins over this spec.

## Work

1. Read `dev-kit/pwa-icons/CHECKLIST.md` and `LESSONS.md` first.
2. Find the icon source: in this repo, in `dev-kit/pwa-icons/`, or the
   largest PNG in `public/icons/`. If there is no vector or layered
   source, use `icon-512x512.png` as the master.
3. Change only the background: every pixel that is the black background
   becomes #1E40AF, with anti-aliased edges blended correctly (no dark
   fringe around tiles or the rounded corners). Do not touch tile pixels.
   Maskable versions: same treatment, keeping the safe-zone padding.
4. Save the new master as `docs/icon-source/tilespace-icon-1024.png` (or
   512 if that is the largest available) and add `scripts/build_icons.py`
   that regenerates all 9 files from it, so the next change is one command.
5. Regenerate all 9 sizes from the master. Update the `?v=` hash in
   `manifest.json` and anywhere else icons are referenced (apple-touch-icon,
   favicon) so browsers fetch the new files.
6. Keep `pwaManifest.test.ts` green; add a check that the 512 icon's corner
   background pixel is #1E40AF (red first, against the old file).
7. Write a 3-up preview image (old, new on a dark dock, new on a light
   dock) to `docs/icon-source/preview.png` and name it in the report.

## Stop conditions

Never restart Dock, Finder or Terminal (LESSONS.md). Do not deploy. If the
tiles cannot be separated from the background cleanly, stop and report
with the preview, rather than shipping a damaged icon.

## After Ashish pushes (put these lines at the end of the report, verbatim)

1. `git push`
2. Wait about 2 minutes for Vercel to finish.
3. `pwa-icon-check` (it compares the installed icon to the live one).
4. If it says the installed icon is stale, follow the reinstall step that
   `dev-kit/pwa-icons/LESSONS.md` prescribes for this case.

## Report (never "done")

HEAD before/after, preview path, PROVEN/UNVERIFIED, `npm run test:all`
once. Committed, not pushed.
