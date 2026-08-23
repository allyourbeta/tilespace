#!/usr/bin/env python3
"""TilePanel target — two states from one frame."""
import os

STAMP = "mock v1 · built 2026-08-23 00:12 PT"
OUT = "/home/claude/deliver4/docs/targets"
TC = "#DB2777"   # this tile's chip colour (color_index 2)

CSS = """
:root{
  --page:#FAFAF8; --card:#FFFFFF; --border:#E8E6E1; --border-soft:#EFEDE8;
  --ink:#1C1B19; --ink-2:#4B4A46; --muted:#8C8A83; --faint:#B4B2AB;
  --shadow:0 1px 2px rgba(28,27,25,.04), 0 1px 3px rgba(28,27,25,.05);
  --panel-shadow:-16px 0 48px rgba(28,27,25,.13);
}
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:Inter,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
  color:var(--ink);height:100vh;overflow:hidden;
  background:radial-gradient(1200px 620px at 18% -12%, #7C3AED12 0%, rgba(0,0,0,0) 62%), var(--page);
}
.stamp{position:fixed;left:22px;top:16px;font-size:.6875rem;color:var(--faint);z-index:1}
.behind{
  position:fixed;inset:0;display:grid;grid-template-columns:repeat(4,1fr);
  gap:12px;padding:64px 520px 64px 32px;
}
.ghost{background:#fff;border:1px solid var(--border);border-radius:11px;height:150px;
  box-shadow:var(--shadow)}
.scrim{position:fixed;inset:0;background:rgba(28,27,25,.20)}

/* ---------------- panel ---------------- */
.panel{
  position:fixed;top:10px;right:0;bottom:10px;width:448px;
  background:var(--card);border:1px solid var(--border);border-right:none;
  border-radius:14px 0 0 14px;box-shadow:var(--panel-shadow);
  display:flex;flex-direction:column;overflow:hidden;
}
.drag{
  height:22px;flex:none;display:flex;align-items:center;justify-content:center;
  cursor:grab;
}
.drag i{display:block;width:34px;height:3px;border-radius:2px;background:#E0DED8}

/* header — identity, not a colour block */
.phead{padding:2px 18px 16px;flex:none}
.phead-top{display:flex;align-items:center;gap:9px;margin-bottom:12px}
.emoji{
  width:34px;height:34px;border-radius:9px;flex:none;
  border:1px solid var(--border);background:#FCFCFB;
  display:flex;align-items:center;justify-content:center;font-size:1.0625rem;cursor:pointer;
}
.emoji:hover{border-color:#DAD8D2}
.dot{
  width:34px;height:34px;border-radius:9px;flex:none;
  border:1px solid var(--border);background:#FCFCFB;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
}
.dot i{display:block;width:15px;height:15px;border-radius:5px;background:var(--tc)}
.dot:hover{border-color:#DAD8D2}
.spacer{flex:1}
.xbtn{
  width:30px;height:30px;border-radius:8px;border:none;background:none;cursor:pointer;
  color:var(--muted);font-size:1rem;display:flex;align-items:center;justify-content:center;
}
.xbtn:hover{background:rgba(28,27,25,.05);color:var(--ink-2)}
.ptitle{
  width:100%;border:none;outline:none;background:none;padding:0;
  font-family:inherit;font-size:1.375rem;font-weight:700;letter-spacing:-.022em;
  color:var(--ink);
}
.ptitle::placeholder{color:var(--faint)}
.rule{height:1px;background:var(--border-soft);flex:none}

/* body */
.pbody{flex:1;min-height:0;overflow-y:auto;padding:14px 14px}

/* empty state */
.empty{padding:44px 20px;text-align:center}
.empty p{font-size:.9375rem;color:var(--muted);margin-bottom:18px}
.row-btns{display:flex;gap:8px;justify-content:center}

/* link rows */
.lrow{
  display:flex;align-items:center;gap:10px;
  padding:9px 11px;border-radius:9px;cursor:grab;
  transition:background .12s;
}
.lrow:hover{background:#F6F5F2}
.lrow .ic{width:15px;flex:none;color:var(--faint);font-size:.8125rem;line-height:1}
.lrow .ic.doc{color:var(--tc)}
.lrow .lt{
  flex:1;min-width:0;font-size:.9375rem;font-weight:500;color:var(--ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.lrow .ls{font-size:.8125rem;color:var(--muted);flex:none}
.lrow .acts{display:flex;gap:2px;opacity:0}
.lrow:hover .acts{opacity:1}
.lrow .acts button{
  width:26px;height:26px;border-radius:7px;border:none;background:none;cursor:pointer;
  color:var(--faint);font-size:.75rem;display:flex;align-items:center;justify-content:center;
}
.lrow .acts button:hover{background:rgba(28,27,25,.06);color:var(--ink-2)}

/* footer */
.pfoot{flex:none;padding:12px 14px;border-top:1px solid var(--border-soft)}
.foot-btns{display:flex;gap:8px}
.btn{
  height:36px;padding:0 14px;border-radius:9px;cursor:pointer;
  font-family:inherit;font-size:.875rem;font-weight:500;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  border:1px solid var(--border);background:var(--card);color:var(--ink-2);
  box-shadow:var(--shadow);transition:border-color .12s,color .12s;
}
.btn:hover{border-color:#DAD8D2;color:var(--ink)}
.btn.grow{flex:1}
/* the ONE place colour appears as a fill: the primary action, in the
   tile's own chip colour — same rule Tenzing uses for its Start button */
.btn.primary{
  background:var(--tc);border-color:var(--tc);color:#fff;
}
.btn.primary:hover{filter:brightness(.94);color:#fff}
.delete-row{margin-top:10px;text-align:center}
.delete{
  border:none;background:none;cursor:pointer;font-family:inherit;
  font-size:.8125rem;color:var(--muted);padding:5px 9px;border-radius:7px;
}
.delete:hover{color:#B91C1C;background:#FEF2F2}
"""


def panel(body, footer):
    return f"""  <div class="behind">{'<div class="ghost"></div>' * 8}</div>
  <div class="scrim"></div>
  <div class="panel" style="--tc:{TC}">
    <div class="drag"><i></i></div>
    <div class="phead">
      <div class="phead-top">
        <button class="emoji" title="Change emoji">🌊</button>
        <button class="dot" title="Change colour"><i></i></button>
        <span class="spacer"></span>
        <button class="xbtn" title="Close">✕</button>
      </div>
      <input class="ptitle" value="Don't worry, be happy!" />
    </div>
    <div class="rule"></div>
    <div class="pbody">
{body}
    </div>
    <div class="pfoot">
{footer}
    </div>
  </div>"""


EMPTY_BODY = """      <div class="empty">
        <p>No links yet</p>
        <div class="row-btns">
          <button class="btn primary">＋&nbsp; Add link</button>
          <button class="btn">▤&nbsp; Add note</button>
        </div>
      </div>"""

EMPTY_FOOT = """      <div class="delete-row"><button class="delete">Delete tile</button></div>"""

LINKS = [
    ("link", "Bobby McFerrin — official site", "bobbymcferrin.com"),
    ("doc", "Why the song still works", "note"),
    ("link", "Wikipedia: Don't Worry, Be Happy", "wikipedia.org"),
    ("link", "Meher Baba's original phrase", "en.wikipedia.org"),
]


def link_rows():
    out = []
    for kind, title, meta in LINKS:
        ic = '<span class="ic doc">▤</span>' if kind == "doc" else '<span class="ic">↗</span>'
        out.append(f"""      <div class="lrow">
        {ic}
        <span class="lt">{title}</span>
        <span class="ls">{meta}</span>
        <span class="acts"><button title="Edit">✎</button><button title="Delete">🗑</button></span>
      </div>""")
    return "\n".join(out)


FULL_FOOT = """      <div class="foot-btns">
        <button class="btn primary grow">＋&nbsp; Add link</button>
        <button class="btn grow">▤&nbsp; Add note</button>
      </div>
      <div class="delete-row"><button class="delete">Delete tile</button></div>"""


def doc(body):
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>TileSpace target — tile panel</title>
<style>{CSS}</style></head>
<body>
<div class="stamp">{STAMP}</div>
{body}
</body></html>
"""


os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, "TARGET_tilepanel_empty.html"), "w").write(
    doc(panel(EMPTY_BODY, EMPTY_FOOT)))
open(os.path.join(OUT, "TARGET_tilepanel_links.html"), "w").write(
    doc(panel(link_rows(), FULL_FOOT)))
print("wrote 2 files")
