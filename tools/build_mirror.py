"""Baut aus _raw/ die bereinigte statische Replik im Ordner site/.

Schritte je Seite:
  1. Asset-URLs auf lokale Pfade umschreiben (wp-content/, wp-includes/)
  2. Interne Seitenlinks auf lokale relative Pfade umschreiben (nur gespiegelte Seiten)
  3. srcset/sizes entfernen (nur Originalbild, spart ~80 % Volumen)
  4. Tracking (GTM/gtag/Site-Kit), Emoji-Script, WP-Metalinks entfernen
  5. Google-Fonts-CDN gegen self-hosted fonts.css tauschen, Typekit entfernen
  6. YouTube- und Drittanbieter-iframes durch Consent-Platzhalter ersetzen
  7. noindex, Provenienz-Kommentar, Demo-Leiste und demo.css/demo.js injizieren
"""
import re
from pathlib import Path

BASE = Path(r"d:\Claude\VS Code\DDIM")
RAW, SITE = BASE / "_raw", BASE / "docs"

# Seitenliste: URL-Pfad -> lokaler Pfad
pages = {}
for line in (BASE / "tools" / "pages.txt").read_text(encoding="utf-8").splitlines():
    if "|" not in line:
        continue
    url, rel = line.split("|")
    path = url.replace("https://ddim.de", "").strip("/")
    pages[path] = "" if rel == "index.html" else rel.rsplit("/index.html", 1)[0]

PROVENANCE = """<!--
  DDIM-Relaunch-Demonstrator (statische Arbeitskopie)
  Quelle: ddim.de, Stand 12.06.2026. Alle Inhalte, Texte, Bilder und Logos:
  (c) DDIM Dachgesellschaft Deutsches Interim Management e. V.
  Erstellt als interne Arbeits- und Diskussionsgrundlage der DDIM.fachgruppe
  Digitale Transformation & KI fuer die Relaunch-Entscheidung der DDIM.
  Kein oeffentliches Angebot, keine Indexierung (noindex), kein Tracking.
-->"""

BANNER = """<div id="ddim-demo-bar" role="note">
  <span><strong>Demonstrator:</strong> statische, KI-erstellte Arbeitskopie von ddim.de (Stand 12.06.2026) als Diskussionsgrundlage der DDIM.fachgruppe Digitale Transformation &amp; KI. Kein offizielles Angebot der DDIM e. V.</span>
  <a href="{prefix}hinweise-demonstrator/">Was funktioniert hier nicht?</a>
  <button type="button" aria-label="Hinweis schliessen" onclick="this.parentNode.remove()">&times;</button>
</div>"""

def asset_rewrite(html: str, prefix: str) -> str:
    def repl(m):
        p = m.group(1).split("?")[0]
        return prefix + p.lstrip("/")
    html = re.sub(r'https?://(?:www\.)?ddim\.de(/wp-(?:content|includes)/[^\s"\'<>)]+)', repl, html)
    return html

def page_link_rewrite(html: str, prefix: str) -> str:
    # Achtung: Enfold mischt doppelte UND einfache Anfuehrungszeichen bei href
    def repl(m):
        quote = m.group(1)
        path = (m.group(2) or "").strip("/")
        # Query-/Anker-Reste abtrennen
        anchor = ""
        if "#" in path:
            path, anchor = path.split("#", 1)
            anchor = "#" + anchor
            path = path.strip("/")
        if path in pages:
            local = pages[path]
            target = prefix + (local + "/" if local else "")
            if not target:
                target = "./"
            return "href=" + quote + target + anchor + quote
        return m.group(0)  # nicht gespiegelt -> Live-Link belassen
    return re.sub(r'href=(["\'])https?://(?:www\.)?ddim\.de/?([^"\']*)\1', repl, html)

def strip_blocks(html: str) -> str:
    # Script-Bloecke mit Tracking-Inhalt oder -Quelle entfernen
    def script_filter(m):
        s = m.group(0)
        bad = ("googletagmanager", "google-analytics", "gtag(", "dataLayer",
               "googlesitekit", "wpemoji", "twemoji", "_gaq")
        return "" if any(b in s for b in bad) else s
    html = re.sub(r'(?s)<script\b[^>]*>.*?</script>', script_filter, html)
    # WP-Metalinks, Feeds, oEmbed, Pingback, Generatoren
    html = re.sub(r'<link[^>]*rel="(?:EditURI|wlwmanifest|shortlink|pingback|alternate)"[^>]*/?>\s*', "", html)
    html = re.sub(r'<link[^>]*rel=\'(?:EditURI|wlwmanifest|shortlink|pingback|alternate)\'[^>]*/?>\s*', "", html)
    html = re.sub(r'<link[^>]*href="https://api\.w\.org[^>]*/?>\s*', "", html)
    html = re.sub(r'<meta name="generator"[^>]*/?>\s*', "", html)
    # Preconnect/Prefetch zu Dritt-CDNs
    html = re.sub(r'<link[^>]*(?:preconnect|dns-prefetch)[^>]*(?:googletagmanager|google-analytics|gstatic|googleapis|typekit)[^>]*/?>\s*', "", html)
    html = re.sub(r'<link[^>]*(?:googletagmanager|google-analytics)[^>]*/?>\s*', "", html)
    return html

def fonts_rewrite(html: str, prefix: str) -> str:
    # Erste Google-Fonts-CSS gegen lokale fonts.css tauschen, weitere entfernen
    gf = re.compile(r'<link[^>]*href=[\'"]https://fonts\.googleapis\.com[^\'"]*[\'"][^>]*/?>\s*')
    n = [0]
    def repl(m):
        n[0] += 1
        return f'<link rel="stylesheet" href="{prefix}font/fonts.css">\n' if n[0] == 1 else ""
    html = gf.sub(repl, html)
    # Typekit: Kit ist domaingebunden, auf GitHub Pages ohnehin nicht lieferbar -> entfernen
    html = re.sub(r'<link[^>]*use\.typekit\.net[^>]*/?>\s*', "", html)
    return html

def iframe_placeholder(html: str) -> str:
    def repl(m):
        tag = m.group(0)
        srcm = re.search(r'src="([^"]+)"', tag)
        src = (srcm.group(1) if srcm else "").replace("&amp;", "&")
        if "youtube" in src or "youtu.be" in src:
            vid = re.search(r'embed/([A-Za-z0-9_-]+)', src)
            watch = f"https://www.youtube.com/watch?v={vid.group(1)}" if vid else src
            label = "YouTube-Video"
            link = watch
        elif "der-moderne-verein.de" in src:
            label = "Online-Mitgliedsantrag (externer Dienst: der-moderne-verein.de)"
            link = src
        else:
            label = "Externer Inhalt"
            link = src
        return ('<div class="ddim-demo-embed">'
                '<p><strong>' + label + '</strong></p>'
                '<p>Dieser Inhalt wird im Original von einem externen Anbieter geladen. '
                'Im statischen Demonstrator wird er aus Datenschutzgruenden nicht eingebettet. '
                'In der finalen Version wuerde er erst nach Einwilligung (Consent) geladen.</p>'
                '<p><a href="' + link + '" target="_blank" rel="noopener">Inhalt beim Anbieter ansehen</a></p>'
                '</div>')
    return re.sub(r'(?s)<iframe\b[^>]*>.*?</iframe>', repl, html)

def srcset_strip(html: str) -> str:
    html = re.sub(r'\s(?:srcset|sizes|data-lazy-srcset|data-srcset)="[^"]*"', "", html)
    return html

def inject(html: str, prefix: str) -> str:
    head_add = (PROVENANCE + "\n"
                '<meta name="robots" content="noindex, nofollow">\n'
                f'<link rel="stylesheet" href="{prefix}demo-assets/demo.css">\n')
    html = re.sub(r'(<head[^>]*>)', r'\1\n' + head_add.replace("\\", "\\\\"), html, count=1)
    # vorhandene robots-Metas der Altseite entfernen (wir setzen eigene)
    html = re.sub(r'<meta name="robots"[^>]*content="(?!noindex)[^"]*"[^>]*/?>\s*', "", html)
    body_add = BANNER.format(prefix=prefix) + f'\n<script src="{prefix}demo-assets/demo.js"></script>\n'
    html = re.sub(r'</body>', body_add.replace("\\", "\\\\") + "</body>", html, count=1)
    return html

def build():
    SITE.mkdir(exist_ok=True)
    count = 0
    for path, local in sorted(pages.items()):
        raw = RAW / (local if local else "") / "index.html" if local else RAW / "index.html"
        raw = RAW / local / "index.html" if local else RAW / "index.html"
        if not raw.exists():
            print(f"FEHLT: {raw}")
            continue
        html = raw.read_text(encoding="utf-8", errors="replace")
        depth = local.count("/") + 1 if local else 0
        prefix = "../" * depth
        html = asset_rewrite(html, prefix)
        html = page_link_rewrite(html, prefix)
        html = srcset_strip(html)
        html = strip_blocks(html)
        html = fonts_rewrite(html, prefix)
        html = iframe_placeholder(html)
        html = inject(html, prefix)
        out = SITE / local / "index.html" if local else SITE / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        count += 1
    print(f"Seiten gebaut: {count}")

if __name__ == "__main__":
    build()
