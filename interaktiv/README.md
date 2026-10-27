# Zuletzt online: interaktive Edition

Experimenteller eigenständiger Branch `experiment/interaktive-fassung`, basierend auf `feature/alternatives-ende`.

## Status

- **5 Entscheidungspunkte × je 3 erzählte Möglichkeiten**, insgesamt 15 mögliche direkte Szenenwege (fünf davon sind Originaltext)
- **10 vollständig geschriebene neue Szenen** und **6 abhängige Kiosk-Nachwirkungen**
- **243 Kombinationen** (3^5), aber **ein einziges gemeinsames Ende**
- Die 15 Dateien unter `manuskript/` wurden dafür nicht verändert
- Der Graph steht in `interaktiv/entscheidungen.json`; die Analyse in `interaktiv/ANALYSE.md`

## Lokal lesen

Repository auschecken und vom **Repository-Wurzelverzeichnis** aus einen statischen HTTP-Server starten:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000/web/` öffnen.

**Nicht** `web/index.html` per `file://` öffnen: Der Reader lädt Markdown-Dateien mit `fetch` und benötigt HTTP.

Alternativ kann der gesamte Repository-Root über GitHub Pages veröffentlicht werden, sofern das Konto/Repository diese Option unterstützt. Dann ist der Reader unter `/web/` erreichbar. **GitHub Pages wurde mit diesem Commit nicht aktiviert.** Bei einem privaten Repository muss die Unterstützung des Hosting-Angebots separat geprüft werden.

## Technische Architektur

- `web/index.html`, `web/style.css`, `web/app.js`: Vanilla JS + CSS; kein Framework.
- `web/engine.mjs`: pure Funktionen für Quellen, Markdown-Szenenanker, stille Folgen und Zusammenführung.
- `web/sw.js`, `web/manifest.webmanifest`: offlinefähige PWA-Basis.
- `interaktiv/entscheidungen.json`: maschinenlesbares Manifest mit fünf Wahlknoten und Folgeersetzungen.
- `interaktiv/szenen/`: B- und C-Alternativtexte mit derselben Zeitmarke wie die ersetzte Originalszene.
- `interaktiv/folgen/`: drei Kiosk-Folgeanker für B und C.

**A** ist in jedem Fall der Originaltext und wird nicht kopiert. So existiert das Manuskript als Single Source of Truth. Der Reader ersetzt beim Anzeigen nur die ausgewählten Abschnitte im Speicher.

### Leserführung

- Vor/Zurück, Kapitelwahl, Schriftvergrößerung, Hell/Dunkel.
- Leseposition und Entscheidungen bleiben nur lokal im Browser (`localStorage`).
- Mit Zurück zu einer Entscheidung kann man sie ändern; der spätere Pfad wird angepasst.
- Kein Login, Tracking, Ranking oder dynamisch per KI generierter Szenentext.
- Bei erster vollständiger Online-Ladung legt der Service Worker App-Dateien und alle 31 Manuskript-/Szenenressourcen in den Cache. Danach ist Offline-Lektüre vorgesehen. Offline-Funktion im konkreten Browser prüfen.

## Prüfen

Node.js 18+:

```bash
node --test web/tests.mjs
```

Der Test prüft **alle 243 Kombinationen**, die fünf Entscheidungsstellen, die Kiosk-Nachwirkungen, den Stiefelkauf und das unveränderte Schlussstück.

## Redaktioneller Hinweis

Das Experiment beantwortet noch nicht, ob ein interaktiver Text literarisch stärker ist. Besonders die dritte Wahl („Verweilen“) verschiebt die Gewichtung einer Szene, ohne den Handlungsverlauf zu ändern. Ob dies Nähe schafft oder den Roman fragmentiert, lässt sich nur durch Lektüre und Rückmeldungen beurteilen.

Die nächste Iteration sollte **nicht** automatisch weitere Abzweigungen hinzufügen, sondern die fünf bestehenden Stellen mit Lesern testen.
