"""Loest url()-Referenzen in den gespiegelten CSS-Dateien auf und listet fehlende Dateien."""
import re
from pathlib import Path
from urllib.parse import unquote

BASE = Path(r"d:\Claude\VS Code\DDIM")
SITE = BASE / "docs"

URL_RE = re.compile(r'url\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)')
need = set()
for css in SITE.rglob("*.css"):
    rel_dir = css.parent.relative_to(SITE)
    for m in URL_RE.finditer(css.read_text(encoding="utf-8", errors="replace")):
        u = m.group(1).strip().split("?")[0].split("#")[0]
        if not u or u.startswith(("data:", "http", "//")):
            # absolute ddim.de-URLs in CSS separat behandeln
            if u.startswith(("http", "//")) and "ddim.de" in u:
                p = re.sub(r'^(?:https?:)?//(?:www\.)?ddim\.de/', "", u)
                if p.startswith("wp-"):
                    need.add(p)
            continue
        # relativ zur CSS-Datei aufloesen
        parts = list(rel_dir.parts)
        for seg in u.split("/"):
            if seg == "..":
                if parts: parts.pop()
            elif seg in (".", ""):
                continue
            else:
                parts.append(seg)
        need.add(unquote("/".join(parts)))

missing = sorted(p for p in need if not (SITE / p).exists() and p.startswith("wp-"))
(BASE / "tools" / "css_assets.txt").write_text("\n".join(missing), encoding="utf-8")
print(f"CSS-Referenzen gesamt: {len(need)}, fehlend: {len(missing)}")
for p in missing[:40]:
    print(" ", p)
