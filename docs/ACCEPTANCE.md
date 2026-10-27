# Abnahme (NICHT als erledigt markieren ohne echten Lauf)

## Deployment-Plattform
- [ ] Cloudflare-Projekttyp ist **Pages** mit Git-Integration, nicht Workers Builds mit `npx wrangler deploy`
- [ ] Cloudflare-Build führt `npm run build` aus und veröffentlicht `dist/` (Node >= 22)
- [ ] Produktions-URL liefert Roman unter `/`, Agentenmanifest unter `/agent/v1/manifest.json` und deaktivierte Review-API mit 503 SERVICE_DISABLED
- [ ] Rechtstexte auf Cloudflare-Konfiguration, tatsächliche Domain und Angaben zum Verantwortlichen geprüft

## Security & Kosten
- [ ] Cloudflare Workers Free verifiziert, keine Paid-/R2-/AI-Produkte eingeschaltet
- [ ] GitHub-Secrets nur in Cloudflare, keine token im Repo
- [x] Ohne KV/Secrets liefert POST 503 SERVICE_DISABLED als JSON (Unit-Test)
- [ ] Deaktivierten Endpunkt auf Cloudflare selbst verifizieren
- [x] Gültige Einladung → 202 pending, Duplikat → 409; GET → 405 (Unit-Tests)
- [ ] Auf Cloudflare KV-Instanz real prüfen
- [x] KV-Quota-Simulation liefert 503 STORAGE_UNAVAILABLE und Retry-After (Unit-Test); Cloudflare 1027 im Agentenprotokoll dokumentiert
- [ ] Cloudflare-Limits und Fail-Closed real verifizieren
- [ ] Cloudflare Fail closed und dist/_routes.json mit /api/* geprüft
- [x] Build output enthält keine internen API-/Test-/Docs-Quelldateien (CI)

## Menschliches Lesen
- [x] 15 Manuskriptteile, 5 Entscheidungen, 243 Kombinationen von Graph- und Agentenexport automatisch abgeglichen
- [ ] PWA offline nach Erstladung; neue Edition ersetzt Cache
- [ ] Smartphone iOS/Android, TalkBack/VoiceOver, Tastatur, Zoom 200%, Kontrast
- [ ] 30 Minuten Browser-TTS, Pause/Wiederaufnahme, Entscheidungspause, Browser-Hintergrundgrenzen dokumentiert
- [ ] Leseposition nach Reload inkl. aktueller Absatz, Wegentscheidung bleibt erhalten

## Agenten
- [ ] Manifest und alle scene URLs sind erreichbar; Agent liest tatsächlich jeden Abschnitt
- [x] Alle 243 Wege und Varianten des Agentenexports stimmen im Test mit der originalen Erzähl-Engine überein
- [ ] JSON-Schema und API-Validierung stimmen überein
- [ ] Einreichung für vollständige und abgebrochene Lektüre getestet

## Release
- [ ] Impressum & Datenschutz rechtlich geprüft, Betreiber bestätigt
- [ ] Custom Domain / Canonical / Sitemap überprüft
- [ ] PageSpeed/Lighthouse vier Kategorien mobil und Desktop gemessen
- [ ] AI/GEO-Prüfkriterien explizit vereinbart und anhand echter Agentenläufe dokumentiert
- [ ] Redaktionelle Freigabe zum öffentlichen Deployment
