# -*- coding: utf-8 -*-
"""Rollout der Startseiten-Fixes auf alle Unterseiten (12.06.2026).

Pro Unterseite:
  1. boxed-Klassen entfernen (html_boxed am <html>, boxed am <body>) -> volle Breite
  2. Includes ergaenzen: Typekit (verveine), site-fixes.css, Inline-Block
     #ddim-button-fix (cache-immun, aus index.html uebernommen), site-demo.js
  3. Footer-Block (id='footer' bis vor id='socket') durch den abgenommenen
     Startseiten-Footer ersetzen; relative Links/srcs auf Seitentiefe umgeschrieben

ACHTUNG: einmaliges Migrationsskript. docs/ enthaelt manuelle Fixes -
build_mirror.py danach NICHT mehr laufen lassen.
"""
import re
import sys
import io
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
FOOTER_START = "<div class='container_wrap footer_color' id='footer'>"
SOCKET_START = "<footer class='container_wrap socket_color' id='socket'"

SKIP_DIRS = {"hinweise-demonstrator", "nicht-repliziert", "wp-content", "wp-includes", "demo-assets", "font"}

def read(p):
    return p.read_text(encoding="utf-8")

def write(p, s):
    p.write_text(s, encoding="utf-8", newline="\n")

# ---- Vorlagen aus der (abgenommenen) Startseite ziehen ----
index_html = read(DOCS / "index.html")

m = re.search(r'<style id="ddim-button-fix">.*?</style>', index_html, re.S)
assert m, "Inline-Block #ddim-button-fix nicht in index.html gefunden"
STYLE_BLOCK = m.group(0)

i0 = index_html.index(FOOTER_START)
i1 = index_html.index(SOCKET_START)
assert 0 < i0 < i1, "Footer-/Socket-Marker in index.html nicht plausibel"
FOOTER_TPL = index_html[i0:i1]

REL_ATTR = re.compile(r'''(href|src)=(["'])(?!https?:|//|/|#|mailto:|tel:|data:)([^"']*)\2''')

def prefixed_footer(prefix):
    if not prefix:
        return FOOTER_TPL
    def repl(mo):
        val = mo.group(3)
        if val == "./":
            val = prefix
        else:
            val = prefix + val
        return mo.group(1) + "=" + mo.group(2) + val + mo.group(2)
    return REL_ATTR.sub(repl, FOOTER_TPL)

# ---- Unterseiten einsammeln ----
pages = []
for p in DOCS.rglob("*.html"):
    rel = p.relative_to(DOCS)
    if rel.parts and rel.parts[0] in SKIP_DIRS:
        continue
    if rel.as_posix() == "index.html":  # Startseite bleibt unangetastet
        continue
    if p.name.startswith("_"):
        continue
    pages.append(p)

print("Seiten im Rollout:", len(pages))

ok, warn = 0, []
for p in sorted(pages):
    rel = p.relative_to(DOCS)
    depth = len(rel.parts) - 1
    prefix = "../" * depth
    s = read(p)
    orig = s

    # 1) boxed-Klassen entfernen
    s = re.sub(r'(<html[^>]*class=")([^"]*)"',
               lambda mo: mo.group(1) + mo.group(2).replace("html_boxed ", "").replace(" html_boxed", "") + '"',
               s, count=1)
    s = re.sub(r'(<body[^>]*class="[^"]*?)\bboxed\b ?', r'\1', s, count=1)

    # 2) Includes nach demo.css einfuegen
    demo_css = '<link rel="stylesheet" href="%sdemo-assets/demo.css">' % prefix
    if demo_css not in s:
        warn.append((rel.as_posix(), "demo.css-Link fehlt"))
        continue
    if "site-fixes.css" not in s:
        inject = (demo_css + "\n"
                  + '<link rel="stylesheet" href="https://use.typekit.net/cip4qtl.css">\n'
                  + '<link rel="stylesheet" href="%sdemo-assets/site-fixes.css?v=1">\n' % prefix
                  + STYLE_BLOCK)
        s = s.replace(demo_css, inject, 1)

    # 3) site-demo.js nach demo.js
    mjs = re.search(r'<script src="%sdemo-assets/demo\.js[^"]*"></script>' % re.escape(prefix), s)
    if not mjs:
        warn.append((rel.as_posix(), "demo.js-Script fehlt"))
        continue
    if "site-demo.js" not in s:
        s = s.replace(mjs.group(0),
                      mjs.group(0) + '\n<script src="%sdemo-assets/site-demo.js?v=1"></script>' % prefix, 1)

    # 4) Footer ersetzen
    n_f, n_s = s.count(FOOTER_START), s.count(SOCKET_START)
    if n_f == 1 and n_s == 1:
        a = s.index(FOOTER_START)
        b = s.index(SOCKET_START)
        assert a < b, rel.as_posix()
        s = s[:a] + prefixed_footer(prefix) + s[b:]
    else:
        warn.append((rel.as_posix(), "Footer-Marker %d/Socket-Marker %d" % (n_f, n_s)))

    if s != orig:
        write(p, s)
        ok += 1

print("Geaendert:", ok)
if warn:
    print("WARNUNGEN:")
    for w in warn:
        print("  ", w[0], "->", w[1])
