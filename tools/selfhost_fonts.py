"""Holt die von ddim.de genutzten Google-Fonts-CSS, laedt WOFF2 lokal und schreibt font/fonts.css."""
import re, urllib.request
from pathlib import Path

BASE = Path(r"d:\Claude\VS Code\DDIM")
FONT = BASE / "docs" / "font"
FONT.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"}
CSS_URLS = [
    "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&display=swap",
    "https://fonts.googleapis.com/css?family=Noto+Sans:400,400italic,700|Poppins:700,800,900&subset=latin,latin-ext&display=swap",
]

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=60).read()

css_all = []
seen = {}
for cu in CSS_URLS:
    css = fetch(cu).decode("utf-8")
    def repl(m):
        gurl = m.group(1)
        fname = gurl.rsplit("/", 1)[-1]
        # eindeutige Namen: familienpfad einbeziehen
        key = "/".join(gurl.split("/")[-3:]).replace("/", "-")
        if key not in seen:
            (FONT / key).write_bytes(fetch(gurl))
            seen[key] = True
        return f"url({key})"
    css = re.sub(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', repl, css)
    css_all.append(f"/* Quelle: {cu} */\n{css}")

(FONT / "fonts.css").write_text("\n\n".join(css_all), encoding="utf-8")
print(f"Font-Dateien: {len(seen)}, fonts.css geschrieben")
