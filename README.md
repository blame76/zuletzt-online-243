# Zuletzt online – Roman + Agentenexperiment (Cloudflare Pages Free)

**Status: Deployment vorbereitet, nicht veröffentlicht.** Review-API ist standardmäßig **aus**.
Quellen: interaktiver Branch des ursprünglichen Romans von Benjamin Lam. Ursprüngliche 15 Manuskriptdateien und alle fünf dreifachen Entscheidungswege wurden für dieses private Experiment übernommen.

## Reihenfolge der Ziele
1. Sicherheit und Qualität
2. Dokumentation und How-to
3. Lesen und Vorlesen für Menschen
4. Vollständiger Agenten-Lesepfad
5. Moderierter Rezensionseingang
6. SEO/GEO

## Lokal ausführen (Node 22+, ohne npm install)
- npm run check
- npm run build
- python3 -m http.server 8000 --directory dist
- Browser: http://localhost:8000/  und  http://localhost:8000/web/
- **Achtung:** Der Python-Server kann keine Pages Functions ausführen; die Review-API testet man mit Wrangler oder den Unit-Tests.

Zum lokalen Test von Pages Functions optional: npx wrangler pages dev dist. Wrangler ist kein Runtime-Dependency und wird nicht automatisch installiert.

## Cloudflare verbinden
Bitte [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md) Schritt für Schritt lesen.
Cloudflare Pages: Git-Repository verbinden, Build command "npm run build", Output "dist", Root ".".
**Kein Token, keine kostenpflichtigen Dienste, kein Deployment werden automatisch angelegt.**

## Öffentliche Routen
- / : direkter Romanbeginn, Reader mit Browser-TTS und lokalem Lesefortschritt
- /web/ : Legacy-Leseadresse, ebenfalls direkt im Roman, Canonical verweist auf /
- /about/ : kurze freiwillige Informationen über Buch, Entstehung und Technik
- /agent/v1/manifest.json : vollständige Szenenreihenfolge, Ausgabeversion
- /agent/v1/guide.json : Agenten-Leseprotokoll
- /agent/v1/chapters/ch01.json bis ch15.json : kapitelweise Agenten-Lektüre (15 Abrufe)
- /agent/v1/scenes/p0001.json usw. : pro Event Text, ggf. Wahl und Varianten
- /agent/v1/example-review.json : rein formales Einreichungsbeispiel
- /agent/v1/review.schema.json : Maschinenvertrag
- /agent/v1/service.json : Limit- und Fehlerkontrakt
- POST /api/v1/reviews : optionaler, eingeladener Review-Eingang (standardmäßig 503)
- /impressum/ und /datenschutz/ : Rechtstexte **vor Freigabe juristisch abgleichen**

## Keine unerwarteten Kosten
Nur Cloudflare Pages + Workers Free + Workers KV Free; keine R2-Bindung, kein KI-Inferenzservice, keine Datenbank, keine automatisierten Modellaufrufe. Nur das öffentliche JSON-Rezensions-Objekt wird im KV gespeichert; keine SQL-DB, keine Anmeldung und keine öffentlichen Pending-Rezensionen. Worker-Free-Limits werden an der Plattformgrenze hart beendet. Wenn Cloudflare selbst 1027 als HTML zurückgibt, kann unsere Funktion nicht mehr antworten: Agenten müssen das ausdrücklich erkennen, siehe docs/AGENT-HOWTO.md.

## Redaktionelle Grenzen
Niemand publiziert eingehende Rezensionen automatisch. Moderation nur via Cloudflare-KV-Dashboard, ohne öffentliches Admin-Panel. Bei Bedarf wird eine geprüfte öffentliche JSON-Datei später separat erstellt; zunächst gibt es keine Veröffentlichung.

## Dokumentation
- docs/DEPLOY-CLOUDFLARE.md – Setup und Limits
- docs/AGENT-HOWTO.md – Auftrag an Leseagenten und Fehlerszenarien
- docs/SECURITY.md – Threat Model, Datenschutz, Notbetrieb
- docs/REVIEW-OPERATIONS.md – Einladungstoken, Sichtung, Freigabe
- docs/ACCEPTANCE.md – Human- und Agenten-Abnahmeliste
- docs/FINAL-REPORT.md – Architektur, erledigte Arbeiten, offene Punkte und Review-Gates

## Review des Release-Kandidaten
Die externen Review-Befunde und ihre Bearbeitung sind in [docs/REVIEW-RESPONSE.md](docs/REVIEW-RESPONSE.md) dokumentiert. Es gibt **keine** automatische Produktionsfreigabe. 20 automatische Tests (13 Unit/Graph/Review/Markdown und 7 Build/Agent/Cache) sind im Run 40304898906 nachgewiesen. Live-Cloudflare-/WCAG-/Performance-Tests stehen aus.

## Optionaler Nebenweg: Herr Behrens

In der Sonntagszene von `manuskript/009-nachwehen.md`, unmittelbar vor dem Aufeinandertreffen um 9:26 Uhr, erscheint im Reader ein zurückhaltender Link auf `/lesen/herr-behrens/`. Der Quelltext des Ursprungsromans und die fünf 3-Wege-Entscheidungen bleiben unverändert. Der Nebenweg enthält derzeit sieben Kapitel, getrennte Kapitelansichten sowie eine statische Gesamtfassung; danach führt ein Rücklink direkt zur Begegnung mit Thomas. Inhaltliche Quelle und eingefrorener Stand stehen in `spin-offs/herr-behrens/README.md`. Aktualisierung erfolgt nur nach manueller Prüfung.
