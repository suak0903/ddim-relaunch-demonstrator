"""Sammelt aus site/ alle lokal referenzierten wp-content/wp-includes-Pfade."""
import re
from pathlib import Path

BASE = Path(r"d:\Claude\VS Code\DDIM")
SITE = BASE / "docs"

RE = re.compile(r'(?:\.\./)*(wp-(?:content|includes)/[^\s"\'<>)]+)')
assets = set()
for f in SITE.rglob("*.html"):
    for m in RE.finditer(f.read_text(encoding="utf-8")):
        a = m.group(1).replace("&amp;", "&").split("?")[0].split("#")[0]
        if not a.endswith(".php"):
            assets.add(a)

(BASE / "tools" / "assets_final.txt").write_text("\n".join(sorted(assets)), encoding="utf-8")
exts = {}
for a in assets:
    name = a.rsplit("/", 1)[-1]
    e = name.rsplit(".", 1)[-1].lower() if "." in name else "(none)"
    exts[e] = exts.get(e, 0) + 1
print(f"Assets: {len(assets)}")
for e, n in sorted(exts.items(), key=lambda x: -x[1]):
    print(f"  .{e}: {n}")
