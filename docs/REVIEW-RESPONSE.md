# Reaktion auf das externe technische Review (26. Oktober 2026)
Quelle: bereitgestelltes externes Review zum Stand 675ec4a10705987f. Kein unabhängiger Nachweis eines externen Live-Audits.

## A – Release-Blocker
- A1 Cache-Invalidierung: **korrigiert**. Der SW-Hash enthält Editionshash sowie ausgelieferte Reader-Shell und PWA-Icons. Test prüft den ausgelieferten Hash.
- A2 Mehrabsatz-Blockquotes: **korrigiert** in \`web/markdown.mjs\`; drei Absatzblöcke und HTML-Escaping getestet.
- A3 Review JSON-Schema: **korrigiert** für die genannten Statuskombinationen; serverseitige Fehlermeldungen enthalten Details. Vollständige Gleichwertigkeit von JSON Schema und Imperativprüfung bedarf weiterhin eines schema-basierten Audits mit echtem Validator.
- A4 Fehlervertrag: **korrigiert** durch Export der \`ERROR_CODES\` aus der Serverfunktion und automatische Erzeugung von \`service.json\`. \`SERVICE_DISABLED\` ist nicht retryable.
- A5 Private Links und Tests im Deploy: **korrigiert**. Testcode wird nicht in \`dist/web/\` kopiert, private GitHub-Links wurden entfernt.

## B – Agentenfähigkeit
- B1: 15 Kapitel-Bundles statt 220 sequenzieller Abrufe möglich; Manifest nennt Zeichenumfang und Kapitel. Kapitelweise Notizen empfohlen.
- B2: Der Vertrag unterscheidet \`completed\` von \`abandoned\`. Zusammenfassungen allein legitimieren keinen Completed-Status. Explizites Coverage-Protokoll wäre denkbar, aber noch nicht nötig für das MVP.
- B3: Maschinenlesbare Variantenregel und gültiges Beispiel-Review ergänzt.
- B4: Server prüft die Ausgabeversion und tatsächliche Szenen-IDs über Cloudflare \`env.ASSETS.fetch\` statt manuelle Versionsvariable.
- B5: \`contract_version=1\` eingeführt, Schema-/API-Änderungen brauchen separate Vertragsversionierung.
- B6: CORS bleibt **absichtlich geschlossen** für browserbasierte Agenten. JSON-Leseendpunkte sind öffentlich; POST-Reviews sind Server-zu-Server mit Bearer-Token.

## C – Human First
- Quellen-/Überschriftenanker mit Absatzposition statt allein Szenenindex hinzugefügt (kein EPUB-CFI). Tempowechsel behält Satzposition bei.
- System-Dark-Mode bei erstmaliger Nutzung berücksichtigt; Kontrast für Auswahlrahmen erhöht; semantisches h1 und Role-Group für die Reader-Einstellungen ergänzt.
- PWA mit id, Apple-Touch-Icon, separater Manifest-PNG-Ausgabe; keine Maskable-Behauptung ohne sicheren Bildrand.
- Echte VoiceOver/TalkBack-, Browser-Sprachausgabe- und Sperrbildschirmtests **offen**.

## D – Security, Datenschutz, Betrieb
- 100% der 243 Erzählwege werden gegen die ursprüngliche Engine geprüft, inklusive aller Alternate-Messages.
- Generierte API-Fehlerverträge werden getestet; Quotenmeldung gibt HTTP 503 mit JSON + Retry-After zurück sofern Handler läuft. Bei Plattformlimit 1027/1102 gilt Cloudflare-HTML, siehe Agentendoku.
- Kein Tracking und keine automatische Rezensionen-Veröffentlichung. KV-Einmaligkeit **nicht atomar**; Einladungskreis klein halten.
- Quellen/Manuskripte öffentlich auslieferbar ist **bewusst beabsichtigt** für den Roman. © Benjamin Lam, alle Rechte vorbehalten. Keine automatische Creative-Commons-Freigabe.
- Rechtstexte, tatsächlicher Free-Account, Live-Deployment, WCAG und PageSpeed 100/100 weiterhin **nicht abgenommen**.
- \`edition/export.sh\` wird nicht ins Produktionsverzeichnis kopiert, solange nur \`npm run build\` läuft.

## Reviewentscheidung
Weiterhin **DRAFT / NO MERGE / NO PRODUCTION** bis Human+Agentenreview und echten Geräte-/Cloudflare-Tests. Nach jedem Commit ist CI erneut zu prüfen.
