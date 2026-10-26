# Abschlussbericht für Human- und Machine-Review
Datum: 26.10.2026. Status: **Release-Kandidat / nicht veröffentlicht**.

## Auftrag und Architektur
Ein kostenloser, sicherer Cloudflare-Pages-Prototyp für den vollständigen interaktiven Roman. Basierend auf dem privaten ursprünglichen Branch experiment/interaktive-fassung. 15 Manuskriptdateien; fünf Entscheidungspunkte A/B/C (243 Pfadkombinationen) samt abhängigen Folgetexten und einem Ende.
Pages veröffentlicht **nur dist/**; Vanilla-Webreader und Browser-TTS ohne Servermodell, Node.js-Build ohne Laufzeitdependencies, PNG-PWA-Icons in 192/512 Pixeln werden ohne externe Grafikbibliothek gebaut.
Agenten bekommen einen statischen Sequenz-Feed mit sämtlichen Ereignissen, Alternativtexten, Editionshash und Dokumentation.
Pages Function für POST-Reviews mit Einladungshash, striktem JSON-Format und KV JSON+TTL (pro Review ein einzelner Write); kein Admin-Endpunkt und keine automatische Publikation.

## Sicherheit / 0-Euro-Guardrails
Review-API default off; Token-Hashes sind nur Secrets, keine API-Lesefunktion.
Nur /api/* triggert Functions, Free-Budget ist Cloudflare-seitig hart. Eigene Fehler JSON + Retry-After; Cloudflare 1027 kann nicht abgefangen werden.
Keine KI-Compute-/R2-/Paid-Services. KV ist ein JSON-Key-Value-Speicher ohne SQL, **kein Dateisystem**; dies ist eine bewusst dokumentierte Abweichung von einer strikten '.json-Datei im Repo'-Idee zugunsten geringerer Angriffsfläche. Speicherung über TTL 90 Tage.

## Technischer Stand und Prüfgrenzen
GitHub Actions CI ist für Commit 3a372938 erfolgreich (Run 40299565509): 9 Unit-/Graph-/Review-Tests und 3 Build-/Agenten-Tests erfolgreich. Darunter ein vollständiger Abgleich aller 243 maschinenlesbaren Wege gegen die ursprüngliche Erzähl-Engine. Build erzeugt 220 Agentenereignisse und Edition 675ec4a10705987f. Link: https://github.com/blame76/zuletzt-onine-243/actions/runs/40299565509
Keine Live-Cloudflare-Instanz, kein PageSpeed-Messwert, kein bestätigter WCAG-Audit, keine echte Android-/iOS-Hörprobe. "100/100" und "AI 4/4" sind Zielwerte, keine Zusicherung; für "AI 4/4" besteht keine eindeutig benannte offizielle Google-Metrik. Manuelle Review-Gates bleiben verbindlich.

## Bekannte Restrisiken
1. Web Speech API: Browser kann pausieren/abbrechen, Hintergrundwiedergabe nicht garantiert.
2. Workers Free mit nur 10 ms CPU-Zeit: reale Lasttests nötig.
3. KV eventual consistency: zwei gleichzeitige Einreichungen mit gleichem Token können vorübergehend beide angenommen werden; Einladungskreis bewusst klein halten.
4. Review-Modell- und Lektüreangaben sind selbstberichtete Angaben, nicht beweisbar.
5. Bei Plattform-Quota 1027 liefert Cloudflare möglicherweise HTML statt unseres maschinenlesbaren JSON.
6. Rechtstexte benötigen Konfigurations- und ggf. juristische Schlussprüfung.
7. Echte PageSpeed-/Lighthouse- und Screenreader-Werte sind vor dem Livegang zu messen; optionales SITE_URL für Canonical und Sitemap.
8. Frühere Reader-Szenenpositionen sind nicht inhaltsfeste EPUB-CFI-Anker; derzeit lokale Absätze und Szenenindex.
9. Fehlende Domain: Canonical/Sitemap werden erst bei gesetztem SITE_URL generiert, vor SEO-Abnahme ergänzen.

## Abnahme-Gates
Siehe docs/ACCEPTANCE.md. PR darf erst nach menschlicher Prüfung gemergt werden. Keine automatische Veröffentlichung, keine Review-Publikation.
