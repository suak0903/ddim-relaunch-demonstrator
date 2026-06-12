# -*- coding: utf-8 -*-
"""Biegt <a>-Links auf nicht replizierte DDIM-Ziele auf die Platzhalter-Seite
nicht-repliziert/ um (12.06.2026).

Regeln pro <a href="...">:
  - ddim.de / www.ddim.de:
      * Datei-Endung (.pdf, .jpg, ...)        -> bleibt (oeffnet das Dokument live)
      * Startseite (/)                        -> lokale Startseite
      * Pfad lokal gespiegelt                 -> lokalisieren
      * sonst                                 -> nicht-repliziert/?ziel=<URL>
  - mitgliederbereich/managerportal/manager .ddim.de -> nicht-repliziert/?ziel=<URL>
  - andere Domains (ddim-kongress.de, Partner, Social) -> bleiben

Einmaliges Migrationsskript; idempotent (bereits umgebogene Links matchen nicht mehr).
"""
import re
import html as htmlmod
from pathlib import Path
from urllib.parse import quote, urlsplit

DOCS = Path(__file__).resolve().parent.parent / "docs"
SKIP_DIRS = {"hinweise-demonstrator", "nicht-repliziert", "wp-content", "wp-includes", "demo-assets", "font"}
FILE_EXT = re.compile(r'\.(pdf|jpe?g|png|gif|webp|svg|zip|mp[34]|docx?|xlsx?|pptx?|ics|txt)$', re.I)
A_HREF = re.compile(r'''(<a\b[^>]*?href=)(["'])(https?://[^"']+)\2''', re.I)
SUBDOMAIN = re.compile(r'^(mitgliederbereich|managerportal|manager)\.ddim\.de$', re.I)

stats = {"platzhalter": 0, "lokalisiert": 0, "datei": 0}

def handle(url_raw, prefix):
    """liefert neuen href-Wert oder None (unveraendert)"""
    url = htmlmod.unescape(url_raw)
    try:
        sp = urlsplit(url)
    except ValueError:
        return None
    host = (sp.hostname or "").lower()
    if SUBDOMAIN.match(host):
        stats["platzhalter"] += 1
        return prefix + "nicht-repliziert/?ziel=" + quote(url, safe="")
    if host not in ("ddim.de", "www.ddim.de"):
        return None
    path = sp.path or "/"
    if FILE_EXT.search(path):
        stats["datei"] += 1
        return None
    if path in ("", "/") and not sp.query:
        stats["lokalisiert"] += 1
        return prefix if prefix else "./"
    local = path.strip("/")
    if local and not sp.query and (DOCS / local / "index.html").is_file():
        stats["lokalisiert"] += 1
        return prefix + local + "/"
    stats["platzhalter"] += 1
    return prefix + "nicht-repliziert/?ziel=" + quote(url, safe="")

changed_files = 0
for p in sorted(DOCS.rglob("*.html")):
    rel = p.relative_to(DOCS)
    if rel.parts[0] in SKIP_DIRS and len(rel.parts) > 1 or rel.parts[0] in SKIP_DIRS:
        continue
    if p.name.startswith("_"):
        continue
    depth = len(rel.parts) - 1
    prefix = "../" * depth
    s = p.read_text(encoding="utf-8")

    def repl(mo):
        new = handle(mo.group(3), prefix)
        if new is None:
            return mo.group(0)
        return mo.group(1) + mo.group(2) + new + mo.group(2)

    out = A_HREF.sub(repl, s)
    if out != s:
        p.write_text(out, encoding="utf-8", newline="\n")
        changed_files += 1

print("Dateien geaendert:", changed_files)
print("auf Platzhalter umgebogen:", stats["platzhalter"])
print("lokalisiert (war gespiegelt):", stats["lokalisiert"])
print("Datei-Links unveraendert gelassen:", stats["datei"])
