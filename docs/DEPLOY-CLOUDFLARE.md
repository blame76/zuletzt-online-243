# Cloudflare Pages Free: Betrieb ohne Gebühren

## Verbindliche Voraussetzungen
1. Sicherstellen, dass der Cloudflare-Account **Workers Free** nutzt. **Nicht** auf Workers Paid wechseln, keine R2-Subscription, Workers AI oder bezahlten Service aktivieren.
2. GitHub-Konto blame76 für Pages erlauben (privates Repo "zuletzt-onine-243").
3. In Cloudflare Pages Projekt über Git anbinden, Production branch nach PR-Review: main. Framework "None", Root directory ".", Build command "npm run build", Build output directory "dist", Node.js >=22.
4. Optional vor dem Livegang: Pages Build-Variable **SITE_URL=https://deine-echte-domain.example** (nur echte HTTPS-Origin, ohne Pfad). Damit erzeugt der Build Canonical-URLs und eine Sitemap. Ohne bekannte Domain absichtlich keine erfundene Canonical-URL. Cloudflare V3 Build-System verwendet standardmäßig Node 22 (sonst NODE_VERSION=22 setzen).
5. In der Pages-Einstellung Functions fail behavior **Fail closed** wählen. Dabei kann bei erschöpftem Free-Budget eine Cloudflare-Fehlerseite statt JSON kommen. Die Leseseiten sollen durch dist/_routes.json keine Function-Requests auslösen.
6. Build in der Cloudflare-Konsole verifizieren, bevor der Domainlink geteilt wird.

## Cloudflare-Konfigurationsfehler: Workers statt Pages (27.10.2026)

Im fehlgeschlagenen Cloudflare-Build wurde direkt `npx wrangler deploy` ausgeführt. Wrangler meldete `Could not detect a directory containing static files`. Im Log wurde **kein** `npm run build` ausgeführt und damit kein `dist/` erzeugt. Das ist die Standardkonfiguration von **Workers Builds**, nicht der vorgesehene Git-Build von **Cloudflare Pages**.

**Für dieses Repository Cloudflare Pages über Git verwenden** (`Workers & Pages` → **Create application** → **Pages** → **Connect to Git**). GitHub-Repository `blame76/zuletzt-onine-243` verbinden, Framework **None**, Production branch **main**, Root **.**, Build command **npm run build**, Output directory **dist**. Ggf. `NODE_VERSION=22` setzen. Im Pages-Git-Build gibt es **kein** Deploy-Kommando `npx wrangler deploy`: Cloudflare lädt das Build-Verzeichnis selbst hoch und erkennt die Pages Functions unter `functions/`.

Ein bereits als **Worker** angelegtes Git-Projekt wird durch Ändern seines Deploy-Kommandos nicht zu einem Pages-Projekt. **Keinen** Workaround mit `npx wrangler deploy` oder einem zusätzlichen Worker-`wrangler.jsonc` für dieses Release einbauen: Das könnte zwar Assets ausliefern, würde aber die bestehende Pages-Functions- und Routing-Architektur ändern.

Ein manueller Pages-Upload wäre alternativ `npm run build` gefolgt von `npx wrangler pages deploy dist --project-name=<ECHTER_PAGES_PROJEKTNAME>`, falls bewusst statt der Git-Integration gewünscht. Der gewählte Standardweg ist das Git-integrierte **Pages**-Projekt.

**Nach der Umstellung:** Deploy-Log auf `npm run build`, Erfolgsmeldung mit 219 Agenten-Events, Upload von `dist/` und Status **Success** prüfen. Falls `main` noch das ursprüngliche Minimalprojekt enthält, zuerst das aktuelle PR mergen oder einen Preview-Build des Feature-Branches einsetzen. Keine Cloudflare-URL aus einem Beispielwert ableiten.

## Nur wenn Rezensionen aktiviert werden sollen
1. Workers & Pages → KV → Namespace erstellen, z.B. "zuletzt-online-reviews" (Free).
2. Pages → Settings → Bindings: KV namespace **REVIEWS** anlegen, für Production (bei Preview die API deaktiviert lassen). Die Function benötigt außerdem das standardmäßig vorhandene `env.ASSETS.fetch`, um das aktuelle Buchmanifest zu prüfen.
3. Die API prüft die Edition und Szenen-IDs direkt gegen das statische `/agent/v1/manifest.json` über die Pages-ASSETS-Bindung. **Keine** manuell gepflegte `REVIEW_EDITION`-Variable konfigurieren.
4. Für jeden zugelassenen Agenten zufällig einen 32+-Zeichen Token erzeugen, z.B. python3 -c "import secrets;print(secrets.token_urlsafe(32))".
5. SHA256-Hash erzeugen, z.B. python3 -c "import hashlib,getpass;print(hashlib.sha256(getpass.getpass('Token: ').encode()).hexdigest())". Tokens sicher direkt an die eingeladenen Agenten geben.
6. Encrypted secret **REVIEW_TOKEN_HASHES** als kommaseparierte Liste der 64-stelligen Hashes hinterlegen (nicht die Originaltokens).
7. **REVIEW_ENABLED=true** als Variable setzen; sonst bleibt die API gesperrt. Nach Änderung erneut deployen.
8. Mit einem Test-Token 202 prüfen, zweiten Versuch erwarten 409 DUPLICATE. Ohne Token 401. Mit REVIEW_ENABLED=false 503 SERVICE_DISABLED. Bei nicht lesbarem Manifest 503 MANIFEST_UNAVAILABLE.
9. Nie Tokens in Repository, URLs, Logs, Analytics, README-Beispielen oder clientseitigem JS eintragen.

## Kostenlimit (Stand Oktober 2026)
Cloudflare Pages Free: 500 Builds/Monat, 20.000 Dateien je Projekt, einzelne Datei maximal 25 MiB.
Workers Free / Pages Functions: 100.000 Requests/Tag, 10ms CPU/Request, hartes Tageslimit.
Workers KV Free: 100.000 Reads/Tag, 1.000 Writes/Tag, 1GB Daten. **Eine Rezension benötigt 1 KV-Read + 1 KV-Write.**
Die Review-Einladungen sind absichtlich endlich. Im Pilot nicht mehr als 20 Tokens gleichzeitig freigeben. KV ist schließlich konsistent, die Einmalnutzung ist keine atomare Barriere gegen parallele Anfragen.
Für den Pilot keine programmatische LLM-Nutzung auf Cloudflare. LLM-Rechenkosten bei externen Agentenbetreibern sind **nicht** Bestandteil des 0-Euro-Hostings.

**Unvermeidbare Einschränkung:** Bei Erreichen des Plattformlimits ist die Function nicht mehr ausführbar. Cloudflare antwortet möglicherweise mit HTML/Fehlercode 1027, statt unseres JSON. Agenten müssen unerwartete HTML-Antworten und 1027 als temporäre Nichtverfügbarkeit erkennen und abbrechen; nicht dauerhaft wiederholen.

## Nach Deploy
- GET / muss sofort den Romantext „Thomas hatte seit drei Tagen nicht geduscht.“ im HTML enthalten und anschließend die Reader-Oberfläche aktivieren (200).
- GET /web/ bleibt als kompatible Zweitadresse bestehen, Canonical beider Lese-URLs ist /.
- GET /about/ liefert eine kurze separate Buchinformation (200).
- Die 243 Wege bleiben statisch; aus dem Leseweg wurde nur die isolierte Titelseite entfernt.
- GET /agent/v1/manifest.json sollte 200 JSON zurückgeben.
- GET /agent/v1/service.json erklärt Retry-Regeln.
- POST /api/v1/reviews ohne Konfiguration → 503 JSON SERVICE_DISABLED.
- Bei eingerichteter API mit gültigem Token → 202 PENDING.
- PWA auf / offline nach Erstladung testen, einschließlich Root-Scope /sw.js; Android und iOS TTS wirklich prüfen.
- Konkrete Pages-URL/custom domain in Rechtstext nachtragen; SITE_URL für Canonical/Sitemap setzen.
- Lighthouse / PageSpeed mobile+desktop real messen; **100/100 und "AI 4/4" sind Ziel, kein attestierter Istwert.**
- Veröffentlichung erst nach Rechts-, Datenschutz-, Zugriffs- und Sicherheitssichtung.

## Update / Notaus
REVIEW_ENABLED=false setzen und neu deployen; alternativ KV-Bindung entfernen. Bei sofortigem Missbrauch die Route am Cloudflare-Projekt deaktivieren (Rate-/WAF-Regel) und Tokens drehen. Bei kompromittierten Agententokens SHA256-Liste ersetzen.

## Externes Review vom 26.10.2026
Die Befunde und Korrekturen sind in `docs/REVIEW-RESPONSE.md` beschrieben. Bei `SERVICE_DISABLED` nicht automatisch nach einer Stunde erneut versuchen; der Fehler ist nicht retryable. Kapitellesen erfolgt jetzt über 15 statische Bundles.

## Redaktionelle Freigabe vor Cloudflare-Anbindung
Die Hauptadresse `/` ist direkt der Romanreader ohne Landingpage; die Entstehungsinformationen stehen unter `/about/`. Vor dem Deployment den aktuellen Draft-PR prüfen und auf `main` mergen. **Nur danach** kann `main` als Production Branch verbunden werden. Ohne Merge würde Cloudflare lediglich das ursprüngliche README-Projekt auf `main` bauen und nicht die Buchausgabe. Die Aktivierung von KV/Review-Secrets ist optional und soll erst nach einem separaten API-Livetest erfolgen; standardmäßig bleibt REVIEW_ENABLED deaktiviert.
