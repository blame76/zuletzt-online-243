# Abnahme (NICHT als erledigt markieren ohne echten Lauf)

## Security & Kosten
- [ ] Cloudflare Workers Free verifiziert, keine Paid-/R2-/AI-Produkte eingeschaltet
- [ ] GitHub-Secrets nur in Cloudflare, keine token im Repo
- [ ] Ohne KV/Secrets/Edition liefert POST 503 SERVICE_DISABLED als JSON
- [ ] Gültige Einladung führt zu 202 pending, Duplikat 409; Pending nicht per GET erreichbar
- [ ] Quota-Simulation liefert 503 STORAGE_UNAVAILABLE und Retry-After; Cloudflare 1027 im Agentenprotokoll dokumentiert
- [ ] Cloudflare Fail closed und dist/_routes.json mit /api/* geprüft
- [ ] Build output enthält nur öffentliche Dateien

## Menschliches Lesen
- [ ] 15 Manuskriptteile, alle 5 Entscheidungen und 243 Kombinationen korrekt
- [ ] PWA offline nach Erstladung; neue Edition ersetzt Cache
- [ ] Smartphone iOS/Android, TalkBack/VoiceOver, Tastatur, Zoom 200%, Kontrast
- [ ] 30 Minuten Browser-TTS, Pause/Wiederaufnahme, Entscheidungspause, Browser-Hintergrundgrenzen dokumentiert
- [ ] Leseposition nach Reload inkl. aktueller Absatz, Wegentscheidung bleibt erhalten

## Agenten
- [ ] Manifest und alle scene URLs sind erreichbar; Agent liest tatsächlich jeden Abschnitt
- [ ] Fünf eigene Entscheidungen, Folgevarianten passen zu Pfad, gemeinsame Schlusssequenz
- [ ] JSON-Schema und API-Validierung stimmen überein
- [ ] Einreichung für vollständige und abgebrochene Lektüre getestet

## Release
- [ ] Impressum & Datenschutz rechtlich geprüft, Betreiber bestätigt
- [ ] Custom Domain / Canonical / Sitemap überprüft
- [ ] PageSpeed/Lighthouse vier Kategorien mobil und Desktop gemessen
- [ ] AI/GEO-Prüfkriterien explizit vereinbart und anhand echter Agentenläufe dokumentiert
- [ ] Redaktionelle Freigabe zum öffentlichen Deployment
