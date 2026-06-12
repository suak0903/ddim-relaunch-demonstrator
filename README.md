# DDIM-Relaunch-Demonstrator

Statische, KI-erstellte Arbeitskopie von [ddim.de](https://ddim.de), Stand 12.06.2026.

**Zweck:** Diskussions- und Arbeitsgrundlage der DDIM.fachgruppe Digitale Transformation & KI
für die anstehende Relaunch-Entscheidung der DDIM-Plattform. Der Demonstrator zeigt, dass
Struktur, Inhalte und Erscheinungsbild der bestehenden Website mit KI-Werkzeugen in kurzer Zeit
in eine schlanke, vollständig kontrollierbare statische Form überführt werden können:
ohne CMS, ohne Datenbank, ohne Plugin-Abhängigkeiten, lauffähig auf jedem Webspace.

**Rechtlicher Rahmen:** Alle Inhalte, Texte, Bilder und Logos gehören der
DDIM Dachgesellschaft Deutsches Interim Management e. V. Dieses Repository ist eine
interne Arbeitskopie für die Gremienarbeit innerhalb des Verbands, kein öffentliches
Angebot. Die Seiten sind per `noindex` und `robots.txt` von der Indexierung
ausgeschlossen, sämtliches Tracking wurde entfernt. Auf Wunsch der DDIM-Geschäftsführung
wird das Repository jederzeit sofort entfernt oder privat gestellt.

## Was ist enthalten

- 73 Strukturseiten: Startseite, DDIM (Über uns, Vorstand, Geschäftsstelle, Partner,
  Public Affairs, Presse), Interim Management (Markt, für Unternehmen, FAQ),
  Mitgliedschaft, alle 18 Fachgruppen, Blog-Übersicht, DDIM.reporter,
  Veranstaltungskalender, Impressum, Datenschutz sowie vier exemplarische News-Beiträge
- Sämtliche referenzierten Medien (rund 1.200 Dateien: Bilder, PDFs, Theme-CSS/JS, Fonts)
- Original-Erscheinungsbild (Enfold-Theme-CSS unverändert)

## Was gegenüber dem Original bereinigt wurde

| Punkt | Original | Demonstrator |
|---|---|---|
| Google Tag Manager / Analytics | lädt ohne Consent | entfernt |
| Google Fonts | vom US-CDN | self-hosted (`docs/font/`) |
| Adobe Typekit (Zierschrift) | vom US-CDN, domaingebunden | entfernt, Fallback |
| YouTube / Antragsformular-iframes | statisch eingebettet | Consent-Platzhalter mit Direktlink |
| Responsive Bildvarianten (srcset) | ~2.500 Dateien | auf Originalbilder reduziert |
| WP-Metalinks, Emoji-Script, Feeds | vorhanden | entfernt |

## Was nicht abbildbar ist (und warum)

Suche, Veranstaltungskalender (AJAX/Datenbank), Mitgliederbereich und Managerportal
(externe Login-Systeme mit Mitgliederdaten, Zugangsdaten liegen bewusst nicht vor),
Newsletter- und Antragsformulare (Server-Endpoints). Details mit Status je Funktion:
[docs/hinweise-demonstrator/](docs/hinweise-demonstrator/index.html) bzw. im
Demonstrator unten über die blaue Leiste verlinkt.

## Reproduzierbarer Build (tools/)

| Skript | Aufgabe |
|---|---|
| `pages.txt` | Seitenliste (URL → lokaler Pfad), aus der Live-Sitemap destilliert |
| `download_pages.ps1` | Roh-HTML-Download nach `_raw/` (alternativ curl-Schleife) |
| `build_mirror.py` | Bereinigung, Link-/Asset-Umschreibung, Injektionen → `docs/` |
| `collect_assets.py` | Asset-Liste aus dem gebauten Stand extrahieren |
| `css_assets.py` | In CSS referenzierte Dateien (Fonts, Icons) auflösen |
| `selfhost_fonts.py` | Google Fonts lokal spiegeln, `fonts.css` generieren |

Lokal testen: `python -m http.server 8000` im Ordner `docs/`, dann `http://localhost:8000`.

## Erstellt mit

Claude Code (Anthropic) als Steuerung, Firecrawl (Site-Mapping und Einzel-Scrapes),
curl/Python für Spiegelung und Umbau, Git/GitHub CLI für Versionierung und
GitHub-Pages-Preview. Erstellungszeit: eine Sitzung am 12.06.2026.
