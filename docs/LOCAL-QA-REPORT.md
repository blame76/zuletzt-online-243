# Lokaler QA-Bericht

**Stand:** 26.10.2026 · **Status:** lokal bereit für manuelle Abnahme nach HTTP-Start; keine Release-Freigabe.

## Repository und Umgebung

- Branch: `feature/cloudflare-free-release`
- HEAD: `614a26968c13e610087bfdf7faf022081458eb95` (`fix(reader): restore scene anchors and speech position, improve accessible controls and disclose copyright`)
- Node.js: `v26.7.0`; npm: `11.19.0`; Python: `3.13.14`; `py`-Launcher ist nicht installiert.
- Zu Beginn war der Arbeitsbaum sauber. Der lokale Branch lag gegenüber dem vorhandenen Remote-Tracking-Stand zwei Commits zurück; es wurde weder gefetcht noch gewechselt. Kein Netzwerkzugriff, Commit, Push, Merge oder Deployment.
- CI-Konfiguration `.github/workflows/ci.yml` führt `npm run check` mit Node.js 22 aus. Der lokale `docs/FINAL-REPORT.md` dokumentiert ältere grüne CI-Ergebnisse. Im bereits lokal vorhandenen Remote-Tracking-Verlauf liegen zwei neuere Dokumentations-/Testcommits einschließlich `docs/REVIEW-RESPONSE.md`; sie sind nicht in den lokalen Arbeitsbaum übernommen. Der tatsächliche aktuelle GitHub-CI-Status wurde ohne Fetch/Netzwerk nicht geprüft und frühere grüne CI ist kein Ersatz für die lokale Prüfung.

## Befehle und Ergebnisse

Alle Test- und Buildläufe wurden einzeln und nacheinander ausgeführt, ohne parallele Test-Worker. `npm run test` setzt zusätzlich `--test-concurrency=1`.

| Befehl | Ergebnis | Geprüfte Eigenschaften |
| --- | --- | --- |
| `npm run check` (Ausgangslauf) | **Fehlgeschlagen:** 8/9 Tests; 1 Fehler. Pipeline stoppte vor Build. | Vorhandene Review-, Ressourcen- und 243-Wege-Tests. Der Story-Test reproduzierte den fehlenden Szenenanker bei Windows-CRLF. |
| `npm run test` (Ausgangslauf) | **Fehlgeschlagen:** 8/9, derselbe reproduzierte CRLF-Fehler. | Isolierte Bestätigung, dass Fehler nicht nur aus Pipeline-/Buildcode kam. |
| `npm run build` (Ausgangslauf) | **Fehlgeschlagen.** | Separat reproduzierter LF-Ankerfehler im Buildpfad. `dist/` wurde dabei nicht erzeugt. |
| `npm run test` (nach CRLF-Fix) | **10/10 bestanden.** | 243 kombinierte Entscheidungswege einschließlich identischem Ende und neuer CRLF-Regression. |
| `npm run build` (nach CRLF-Fix) | **Erfolgreich:** 220 Leseereignisse, Edition `33f92e9723a10fda`. | Build der menschlichen und Agentenartefakte. |
| `npm run check` (nach CRLF-Fix) | **Fehlgeschlagen:** 14/14 Unit-Tests grün; 4/5 Build-Tests grün. | Entdeckte plattformabhängigen Pfadfilter: `web/tests.mjs` landete unter Windows ungewollt im `dist/`-Artefakt. |
| `get_errors` auf geänderte JS-Dateien | **Keine Editorfehler.** | Statische Diagnose der betroffenen JavaScript-Dateien. |
| `npm run test` (erweiterte Suite) | **17/17 bestanden.** | Markdown, Review, Speech-Simulation, CRLF und vollständiger Erzählgraph. |
| `npm run check` (nach Build-Filterkorrektur) | **Erfolgreich:** 14/14 Unit-Tests und 5/5 Build-Tests. | Vollständiger Graph-/Agentenvergleich, 15 Bundles/220 Events, PWA und Test-/Privatdateiausschluss. |

**Endgültiger Stand:** `npm run check` erfolgreich. Unit-/Markdown-/Review-/Speech-Tests: **18/18 bestanden**; Build-/Agenten-/PWA-/Cache-Tests: **6/6 bestanden**. Der Build erzeugte 220 Agentenereignisse, Edition `33f92e9723a10fda`. `git diff --check` war erfolgreich.

### Automatisierte Eigenschaften

- Alle fünf Entscheidungen haben je drei Optionen; alle 243 Kombinationen bauen erfolgreich, abhängige Folgeszenen werden gegen den tatsächlich ausgegebenen Inhalt geprüft, und das gemeinsame Ende ist identisch.
- Der Agentenfeed hat 220 geordnete Ereignisse in 15 Kapitel-Bundles; alle Pfade/Varianten werden mit dem menschlichen Reader verglichen. Edition und Beispiel-/Schemaartefakte werden geprüft.
- Markdown: getrennte Blockzitatabsätze und HTML-Escaping.
- Review-Handler mit Mock-Bindings: deaktivierter Dienst, fehlende/ungültige Authentifizierung, ungültiges JSON, Medientyp, Größenlimit, Schema, Annahme als `pending` ohne Veröffentlichung, Duplikat, Editionsabweichung, Manifestausfall und KV-Ausfall mit maschinenlesbaren Fehlern.
- Vorleselogik mit kontrollierter Speech-API-Simulation: Satzposition, Pause/Fortsetzen, Weiterschalten, Tempoübergabe, Abschnittsabschluss, Fehler und nicht verfügbare API.
- PWA-Artefakt, Service-Worker-Cache-Hash aus Edition und ausgelieferten Shell-Dateien sowie Ausschluss privater Tests aus `dist/`.
- Windows-spezifisch wurden LF/CRLF-Ankerersetzung und `\`-Pfadbehandlung im Build reproduziert und korrigiert.

### Nicht automatisiert geprüft

Keine echte Browser-/DOM-Interaktion, Screenreader-/WCAG-Prüfung, PWA-Installation, Offline-Navigation, physische Audiowiedergabe, Hintergrund-/Sperrbildschirm, Mobilgeräte, Performance/PageSpeed, rechtliche Freigabe, Cloudflare/KV-Livebetrieb oder echte Pages-Function-End-to-End-Anfrage. Node-Tests mit Mock-Speech-API sind kein Nachweis einer realen Stimme oder Hintergrundwiedergabe. Statischer HTTP-Server führt keine Pages Functions aus.

## Änderungen in diesem QA-Auftrag

- `web/engine.mjs`: Normalisierung von CRLF in Quell- und Variantentext vor Ankerprüfungen.
- `web/tests.mjs`: gezielter Regressionstest für CRLF-Szenenanker.
- `scripts/build.mjs`: plattformübergreifender Filter gegen versehentliche Kopie der Web-Testdatei.
- `package.json`: Standardtests schließen Markdown- und Vorlesetests ein; Testdateien seriell.
- `tests/reviews.test.mjs`: fehlende Authentifizierung, ungültiges JSON, Medien-/Größenfehler, Edition/Manifest-Ausfälle und explizit nicht publizierte Annahme.
- `tests/speech.test.mjs`: neue Tests mit kleinem lokalen Speech-API-Mock, ohne zusätzliche Abhängigkeit.
- `tests/build.test.mjs`: Cache-Schlüssel muss Edition und Reader-Shell-Dateien abdecken.
- `docs/LOCAL-ACCEPTANCE.md`: manuelle Prüfanleitung.
- `docs/LOCAL-QA-REPORT.md`: dieser Bericht.

Keine Manuskripte oder Erzählentscheidungstexte wurden geändert. Keine Abhängigkeiten oder Pakete wurden installiert.

## Befunde, Korrekturen und Restrisiken

1. **Korrigiert – kritischer QA-Blocker:** Windows-CRLF ließ `replaceSection()` Zeitmarken nicht erkennen und brach 243-Wege-Test sowie Build. Regressionstest hinzugefügt.
2. **Korrigiert – Artefakt-/Sicherheitsqualität:** Der Unix-spezifische Slash-Filter kopierte unter Windows `web/tests.mjs` nach `dist/`. Filter ist separatorunabhängig; Artefakttest bestätigt Ausschluss.
3. **Offen – echte Geräte/Browser:** gespeicherte Absatzposition, Tastaturfokus, Screenreader, responsive Darstellung und reale Sprachausgabe manuell prüfen.
4. **Offen – Offline/PWA:** Service-Worker-Installation, echte Offline-Nutzung und Cacheaustausch im Browser durchführen.
5. **Offen – Cloudflare:** Review-API, KV, Secrets, Limits und Plattformfehler wurden nicht live ausgeführt. Die API bleibt standardmäßig deaktiviert; Annahme ist keine Veröffentlichung.
6. **Offen – Release-Gates:** Impressum/Datenschutz, Domains/Canonical, Performance/SEO, Redaktion und Deployment sind nicht freigegeben.
7. **Branchabweichung:** zwei Commits hinter dem lokalen Tracking-Ref; deren Änderungen/CI wurden nicht in den Arbeitsbaum integriert oder live verifiziert.

## Lokale Abnahmesitzung

- Vorgesehener Server: `http://127.0.0.1:8000/`, ausschließlich gebunden an Loopback und aus `dist/`.
- Port 8000 war durch einen vorhandenen IPv6-Wildcard-Listener (PID 1956) belegt und wurde nicht beendet. Port 8001 war frei; gestartet mit `python -m http.server 8001 --bind 127.0.0.1 --directory dist`. Python-Server läuft im dedizierten VS-Code-Terminal unter `http://127.0.0.1:8001/`, gebunden an `127.0.0.1`, Verzeichnis `dist/`.
- HTTP-Prüfungen einzeln erfolgreich (**200**): `/`, `/web/`, `/agent/v1/manifest.json`, `/agent/v1/chapters/ch01.json`, `/agent/v1/review.schema.json`, `/impressum/`, `/datenschutz/`. Die beiden Agenten-JSON-Beispiele und das Review-Schema lieferten `application/json`; Seiten HTML.
- Stoppen: `Ctrl+C` im dedizierten Serverterminal. Der Server wurde nach den HTTP-Prüfungen nicht beendet und bleibt für die Abnahme aktiv.
- Manuelle Reihenfolge: Reader laden und Position wiederherstellen; den in `docs/LOCAL-ACCEPTANCE.md` beschriebenen vollständigen Beispielweg lesen; Stimme/Pause/Tempo/Entscheidungsstopp prüfen; Tastatur/Screenreader und 200%-Zoom prüfen; danach Service Worker/Offline- und Cacheaktualisierung kontrollieren.

## Empfehlung

**Bereit für lokale manuelle Abnahme.** Der abschließende Check und die geforderten HTTP-200-Prüfungen sind erfolgreich; die oben aufgeführten menschlichen Browser-/Geräteprüfungen bleiben offen. Das ist ausdrücklich **keine** Merge-, Deployment- oder Release-Freigabe. Vor Abschluss der lokalen manuellen Prüfpunkte und separaten Cloudflare-/Rechts-/Redaktionsgates nicht veröffentlichen.
