# Cloudflare Pages Free: Betrieb ohne Gebühren

## Verbindliche Voraussetzungen
1. Sicherstellen, dass der Cloudflare-Account **Workers Free** nutzt. **Nicht** auf Workers Paid wechseln, keine R2-Subscription, Workers AI oder bezahlten Service aktivieren.
2. GitHub-Konto blame76 für Pages erlauben (privates Repo "zuletzt-onine-243").
3. In Cloudflare Pages Projekt über Git anbinden, Production branch nach PR-Review: main. Framework "None", Root directory ".", Build command "npm run build", Build output directory "dist", Node.js >=22.
4. Optional vor dem Livegang: Pages Build-Variable **SITE_URL=https://deine-echte-domain.example** (nur echte HTTPS-Origin, ohne Pfad). Damit erzeugt der Build Canonical-URLs und eine Sitemap. Ohne bekannte Domain absichtlich keine erfundene Canonical-URL. Cloudflare V3 Build-System verwendet standardmäßig Node 22 (sonst NODE_VERSION=22 setzen).
5. In der Pages-Einstellung Functions fail behavior **Fail closed** wählen. Dabei kann bei erschöpftem Free-Budget eine Cloudflare-Fehlerseite statt JSON kommen. Die Leseseiten sollen durch dist/_routes.json keine Function-Requests auslösen.
6. Build in der Cloudflare-Konsole verifizieren, bevor der Domainlink geteilt wird.

## Nur wenn Rezensionen aktiviert werden sollen
1. Workers & Pages → KV → Namespace erstellen, z.B. "zuletzt-online-reviews" (Free).
2. Pages → Settings → Bindings: KV namespace **REVIEWS** anlegen, für Production (bei Preview die API deaktiviert lassen).
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
- GET / sollte 200 HTML liefern, /web/ und 243 Wege sind statisch.
- GET /agent/v1/manifest.json sollte 200 JSON zurückgeben.
- GET /agent/v1/service.json erklärt Retry-Regeln.
- POST /api/v1/reviews ohne Konfiguration → 503 JSON SERVICE_DISABLED.
- Bei eingerichteter API mit gültigem Token → 202 PENDING.
- PWA offline nach Erstladung testen; Android und iOS TTS wirklich prüfen.
- Konkrete Pages-URL/custom domain in Rechtstext nachtragen; SITE_URL für Canonical/Sitemap setzen.
- Lighthouse / PageSpeed mobile+desktop real messen; **100/100 und "AI 4/4" sind Ziel, kein attestierter Istwert.**
- Veröffentlichung erst nach Rechts-, Datenschutz-, Zugriffs- und Sicherheitssichtung.

## Update / Notaus
REVIEW_ENABLED=false setzen und neu deployen; alternativ KV-Bindung entfernen. Bei sofortigem Missbrauch die Route am Cloudflare-Projekt deaktivieren (Rate-/WAF-Regel) und Tokens drehen. Bei kompromittierten Agententokens SHA256-Liste ersetzen.
