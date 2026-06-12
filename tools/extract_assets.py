"""Sammelt alle lokal zu spiegelnden Asset-URLs aus den Roh-HTML-Seiten in _raw/."""
import re, sys
from pathlib import Path

BASE = Path(r"d:\Claude\VS Code\DDIM")
RAW = BASE / "_raw"

# Alles, was auf ddim.de unter wp-content/ oder wp-includes/ liegt
ASSET_RE = re.compile(
    r'https?://(?:www\.)?ddim\.de(/wp-(?:content|includes)/[^\s"\'<>)\\]+)', re.I)
# Wurzelrelative Verweise (selten, aber möglich)
REL_RE = re.compile(r'["\'(](/wp-(?:content|includes)/[^\s"\'<>)\\]+)')

assets = set()
for f in RAW.rglob("*.html"):
    text = f.read_text(encoding="utf-8", errors="replace")
    for m in ASSET_RE.finditer(text):
        assets.add(m.group(1))
    for m in REL_RE.finditer(text):
        assets.add(m.group(1))

# HTML-Entities und Query-Strings bereinigen (?ver=... ist Cache-Busting, Datei ist gleich)
clean = set()
for a in assets:
    a = a.replace("&amp;", "&").replace("\\/", "/")
    a = a.split("?")[0].split("#")[0]
    if a.endswith((".php",)):  # keine Server-Endpoints spiegeln
        continue
    clean.add(a)

out = BASE / "tools" / "assets.txt"
out.write_text("\n".join(sorted(clean)), encoding="utf-8")
exts = {}
for a in clean:
    e = a.rsplit(".", 1)[-1].lower() if "." in a.rsplit("/", 1)[-1] else "(none)"
    exts[e] = exts.get(e, 0) + 1
print(f"Assets gesamt: {len(clean)}")
for e, n in sorted(exts.items(), key=lambda x: -x[1]):
    print(f"  .{e}: {n}")
