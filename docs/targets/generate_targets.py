#!/usr/bin/env python3
"""Generates the TileSpace v2 target files from ONE frame, so the shell is
identical by construction across desktop / collapsed / mobile."""
import os, datetime

STAMP = "mock v2 · built 2026-08-22 23:41 PT"
OUT = "/home/claude/deliver2/docs/targets"

# --- chip palette: 12 well-spaced hues, readable as ink on white ------------
# Indexed by the tile's EXISTING color_index (0-11). No data change.
CHIP = ["#2563EB", "#7C3AED", "#DB2777", "#E11D48", "#EA580C", "#D97706",
        "#CA8A04", "#16A34A", "#0D9488", "#0891B2", "#4F46E5", "#9333EA"]

PAGES = [
    ("Work",        "#2563EB", 18), ("Clients",   "#E11D48", 12),
    ("Life Advice", "#7C3AED", 21), ("Reading",   "#EA580C",  9),
    ("Travel",      "#0891B2", 14), ("Music",     "#CA8A04",  7),
    ("Chess",       "#16A34A", 11), ("Health",    "#DB2777",  6),
    ("Ideas",       "#9333EA", 16), ("Cooking",   "#D97706",  8),
    ("Finance",     "#0D9488", 10), ("Archive",   "#6B7280", 24),
]
ACTIVE = 2  # Life Advice

# (title, initials, color_index, link_count)
TILES = [
    ("FIGHTING SPIRIT!", "FS", 4, 0),
    ('"Looking back, which choice will I feel best about?"', "LB", 0, 0),
    ("CONFIDENCE and Triggers", "CT", 1, 2),
    ("Work I like: with people, in meatspace", "WI", 8, 1),
    ('"Tell them how they\'ll be different"', "TT", 2, 0),
    ("Explanation v Excuse", "EV", 10, 1),
    ("Step into the ARENA!", "SI", 3, 0),
    ("Turn difficult experiences into fuel", "TD", 5, 0),
    ("WHALe time plan", "WT", 9, 1),
    ("Don't worry, be happy!", "DW", 6, 0),
    ("Negative thoughts don't create a positive future", "NT", 7, 0),
    ('"Answer the question that you want to answer"', "AQ", 11, 0),
    ("Negativity? Resentful? 6–7pm!", "NR", 3, 0),
    ("Is it (2/3) kind, true, or necessary?", "II", 0, 0),
    ("Just Say Yes", "JS", 7, 0),
    ("Better to be RESPECTED than liked", "BB", 4, 0),
    ("Be Here Now", "BH", 9, 0),
    ("Leave People Alone (to work out their worries)", "LP", 1, 0),
    ("Immerse yourself in the task at hand", "IY", 10, 0),
    ("HAI", "HA", 5, 1),
    ("Be structured, offer them simple choice(s)", "BS", 8, 0),
]
CAPACITY = 30

CSS = """
:root{
  --page:#FAFAF8; --card:#FFFFFF; --border:#E8E6E1; --border-soft:#EFEDE8;
  --ink:#1C1B19; --ink-2:#4B4A46; --muted:#8C8A83;
  --shadow:0 1px 2px rgba(28,27,25,.04), 0 1px 3px rgba(28,27,25,.05);
  --shadow-hi:0 4px 14px rgba(28,27,25,.09);
  --rail:236px; --rail-collapsed:60px;
  --gutter:28px;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{
  font-family:Inter,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
  color:var(--ink); overflow:hidden;
  /* PAGE TINT: the active page's colour, at a whisper. Pages feel different
     from one another without any surface becoming coloured. */
  background:
    radial-gradient(1200px 620px at 18% -12%, var(--tint) 0%, rgba(0,0,0,0) 62%),
    var(--page);
}
.app{height:100vh;display:flex}

/* ---------------- sidebar ---------------- */
.rail{
  width:var(--rail); flex:none; display:flex; flex-direction:column;
  border-right:1px solid var(--border-soft); padding:16px 12px 12px;
}
.brand{
  display:flex;align-items:center;gap:9px;padding:4px 8px 16px;
  font-size:.9375rem;font-weight:700;letter-spacing:-.02em;
}
.brand .glyph{
  width:20px;height:20px;border-radius:6px;flex:none;
  background:linear-gradient(135deg,#7C3AED,#2563EB);
}
.rail-scroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:1px}
.prow{
  display:flex;align-items:center;gap:10px;
  padding:7px 9px;border-radius:8px;cursor:pointer;
  font-size:.875rem;color:var(--ink-2);position:relative;
  transition:background .12s;
}
.prow:hover{background:rgba(28,27,25,.04)}
.prow .grip{
  position:absolute;left:-1px;width:10px;opacity:0;color:#B9B7B0;
  font-size:.75rem;line-height:1;cursor:grab;
}
.prow:hover .grip{opacity:1}
.prow .sw{width:11px;height:11px;border-radius:3.5px;flex:none;background:var(--pc)}
.prow .nm{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prow .ct{font-size:.75rem;color:#B4B2AB;font-variant-numeric:tabular-nums}
.prow.on{background:var(--pc-tint);color:var(--ink);font-weight:600}
.prow.on .ct{color:var(--muted)}
.rail-foot{
  padding-top:10px;margin-top:8px;border-top:1px solid var(--border-soft);
  display:flex;align-items:center;gap:9px;
}
.avatar{width:26px;height:26px;border-radius:50%;background:#CFCDC6;flex:none;
  border:1px solid var(--border)}
.who{font-size:.8125rem;color:var(--ink-2);flex:1;white-space:nowrap;overflow:hidden}
.iconbtn{
  width:26px;height:26px;border-radius:7px;flex:none;border:1px solid transparent;
  background:none;color:#9C9A93;display:flex;align-items:center;justify-content:center;
  font-size:.875rem;cursor:pointer;
}
.iconbtn:hover{background:rgba(28,27,25,.05);color:var(--ink-2)}

/* collapsed rail */
.rail.mini{width:var(--rail-collapsed);align-items:center;padding:16px 8px 12px}
.rail.mini .brand{padding:4px 0 16px}
.rail.mini .brand span:not(.glyph){display:none}
.rail.mini .nm,.rail.mini .ct,.rail.mini .grip,.rail.mini .who{display:none}
.rail.mini .prow{justify-content:center;padding:8px 0;width:40px}
.rail.mini .prow .sw{width:15px;height:15px;border-radius:4.5px}
.rail.mini .rail-foot{flex-direction:column;gap:8px;width:100%}

/* ---------------- main ---------------- */
.main{flex:1;min-width:0;display:flex;flex-direction:column}
header{
  height:60px;flex:none;display:flex;align-items:center;gap:11px;
  padding:0 var(--gutter);
}
header .sw{width:13px;height:13px;border-radius:4px;background:var(--pc);flex:none}
h1{font-size:1.1875rem;font-weight:700;letter-spacing:-.022em}
.stamp{margin-left:auto;font-size:.6875rem;color:#B4B2AB}

.board{flex:1;min-height:0;padding:0 var(--gutter) 6px}
.grid{
  height:100%;display:grid;gap:12px;
  grid-template-columns:repeat(6,minmax(0,1fr));
  grid-template-rows:repeat(5,minmax(0,1fr));
}
.tile{
  background:var(--card);border:1px solid var(--border);border-radius:11px;
  box-shadow:var(--shadow);
  padding:clamp(10px,1.5vh,15px) clamp(11px,1.5vh,16px);
  display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;
  cursor:pointer;transition:box-shadow .14s,transform .14s,border-color .14s;
}
.tile:hover{box-shadow:var(--shadow-hi);transform:translateY(-1px);border-color:#DEDCD6}
.chip{
  width:clamp(26px,3.4vh,34px);height:clamp(26px,3.4vh,34px);
  border-radius:clamp(7px,1vh,9px);flex:none;
  margin-bottom:clamp(6px,1vh,10px);
  display:flex;align-items:center;justify-content:center;
  font-size:clamp(.6875rem,1.35vh,.8125rem);font-weight:700;letter-spacing:.015em;
  background:var(--tc-bg);color:var(--tc);
}
.t-title{
  font-size:clamp(.8125rem,1.62vh,.9375rem);
  font-weight:600;line-height:1.32;letter-spacing:-.008em;color:var(--ink);
  /* TWO lines, never three: the row height is fixed, so a third line is what
     got sliced in v1. Overflow ends in an ellipsis, never mid-glyph. */
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
  overflow:hidden;min-height:0;
}
.t-count{
  margin-top:auto;padding-top:5px;flex:none;
  font-size:clamp(.6875rem,1.2vh,.75rem);color:var(--muted);
}
.empty{border:1px dashed #E6E4DE;border-radius:11px;background:rgba(255,255,255,.35)}

/* short windows: drop the chip and the count, keep the title whole */
@media (max-height:600px){
  .chip,.t-count{display:none}
}

footer{
  height:52px;flex:none;display:flex;align-items:center;gap:9px;padding:0 var(--gutter);
}
.ctl{
  height:34px;min-width:34px;padding:0 10px;border-radius:9px;background:var(--card);
  border:1px solid var(--border);box-shadow:var(--shadow);color:#6B6A64;
  display:flex;align-items:center;justify-content:center;gap:6px;
  font-size:.8125rem;font-weight:500;cursor:pointer;
}
.ctl:hover{border-color:#DAD8D2;color:var(--ink-2)}
"""

MOBILE_CSS = """
/* ---------------- mobile ---------------- */
body{background:radial-gradient(700px 400px at 50% -14%, var(--tint) 0%, rgba(0,0,0,0) 66%), var(--page)}
.app{position:relative}
.rail{
  position:absolute;inset:0 auto 0 0;z-index:20;background:var(--page);
  box-shadow:0 0 40px rgba(28,27,25,.16);border-right:1px solid var(--border);
}
.scrim{position:absolute;inset:0;z-index:10;background:rgba(28,27,25,.28)}
.main{width:100%}
header{padding:0 16px;height:54px}
.title-tap{display:flex;align-items:center;gap:9px;cursor:pointer}
.title-tap .caret{color:#B4B2AB;font-size:.75rem}
.board{padding:0 16px 4px}
.grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr))}
footer{padding:0 16px;height:56px}
.dots{margin:0 auto;display:flex;gap:7px;align-items:center}
.dot{width:5px;height:5px;border-radius:50%;background:#DAD8D2}
.dot.on{background:var(--pc);width:6px;height:6px}
"""


def hexa(h, aa):
    return h + aa


def rail(active, mini=False, mobile=False):
    cls = "rail mini" if mini else "rail"
    rows = []
    for i, (name, col, n) in enumerate(PAGES):
        on = " on" if i == active else ""
        rows.append(
            f'<div class="prow{on}" style="--pc:{col};--pc-tint:{hexa(col,"14")}" title="{name}">'
            f'<span class="grip">⠿</span><span class="sw"></span>'
            f'<span class="nm">{name}</span><span class="ct">{n}</span></div>')
    foot_btn = '<button class="iconbtn" title="Collapse">' + ('»' if mini else '«') + '</button>'
    if mobile:
        foot_btn = '<button class="iconbtn" title="Settings">⚙</button>'
    return f"""    <aside class="{cls}">
      <div class="brand"><span class="glyph"></span><span>TileSpace</span></div>
      <div class="rail-scroll">
{chr(10).join("        " + r for r in rows)}
        <div class="prow" style="--pc:#D8D6D0" title="New page"><span class="sw"></span><span class="nm" style="color:#A9A7A0">New page</span></div>
      </div>
      <div class="rail-foot">
        <span class="avatar"></span><span class="who">Ashish</span>{foot_btn}
      </div>
    </aside>"""


def board(mobile=False):
    cells = []
    shown = TILES[:8] if mobile else TILES
    cap = 8 if mobile else CAPACITY
    for title, ini, ci, n in shown:
        c = CHIP[ci]
        count = f'<div class="t-count">{n} item{"s" if n != 1 else ""}</div>' if n else ""
        cells.append(
            f'<div class="tile" style="--tc:{c};--tc-bg:{hexa(c,"16")}" title="{title}">'
            f'<span class="chip">{ini}</span>'
            f'<div class="t-title">{title}</div>{count}</div>')
    for _ in range(cap - len(shown)):
        cells.append('<div class="empty"></div>')
    return chr(10).join("        " + c for c in cells)


def doc(body, extra_css=""):
    name, col, n = PAGES[ACTIVE]
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TileSpace target — {name}</title>
<style>{CSS}{extra_css}</style></head>
<body style="--pc:{col};--tint:{hexa(col,'12')}">
{body}
</body></html>
"""


def desktop(mini=False):
    name, col, n = PAGES[ACTIVE]
    return doc(f"""  <div class="app">
{rail(ACTIVE, mini=mini)}
    <div class="main">
      <header>
        <span class="sw"></span><h1>{name}</h1>
        <span class="stamp">{STAMP}</span>
      </header>
      <div class="board"><div class="grid">
{board()}
      </div></div>
      <footer>
        <button class="ctl">+&nbsp; Add tile</button>
        <button class="ctl" title="Palette">◐</button>
      </footer>
    </div>
  </div>""")


def mobile():
    name, col, n = PAGES[ACTIVE]
    dots = "".join(
        f'<span class="dot{" on" if i == ACTIVE else ""}"></span>' for i in range(len(PAGES)))
    return doc(f"""  <div class="app">
    <div class="scrim"></div>
{rail(ACTIVE, mobile=True)}
    <div class="main">
      <header>
        <div class="title-tap"><span class="sw"></span><h1>{name}</h1><span class="caret">▾</span></div>
      </header>
      <div class="board"><div class="grid">
{board(mobile=True)}
      </div></div>
      <footer>
        <button class="ctl">+</button>
        <div class="dots">{dots}</div>
        <button class="ctl">◐</button>
      </footer>
    </div>
  </div>""", MOBILE_CSS)


os.makedirs(OUT, exist_ok=True)
for fn, content in [("TARGET_page.html", desktop()),
                    ("TARGET_page_collapsed.html", desktop(mini=True)),
                    ("TARGET_page_mobile.html", mobile())]:
    open(os.path.join(OUT, fn), "w").write(content)
    print("wrote", fn)
