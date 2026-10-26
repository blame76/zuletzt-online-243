# Abschlussbericht für Human- und Machine-Review
Datum: 26.10.2026. Status: **Release-Kandidat / nicht veröffentlicht**.

## Auftrag und Architektur
Ein kostenloser, sicherer Cloudflare-Pages-Prototyp für den vollständigen interaktiven Roman. Basierend auf dem privaten ursprünglichen Branch experiment/interaktive-fassung. 15 Manuskriptdateien; fünf Entscheidungspunkte A/B/C (243 Pfadkombinationen) samt abhängigen Folgetexten und einem Ende.
Pages veröffentlicht **nur dist/**; Vanilla-Webreader und Browser-TTS ohne Servermodell, Node.js-Build ohne Laufzeitdependencies, PNG-PWA-Icons in 192/512 Pixeln werden ohne externe Grafikbibliothek gebaut.
Agenten bekommen 219 statische Leseereignisse (die isolierte Titelseite ist jetzt entfernt), alternativ 15 Kapitel-Bundles, Editionshash und Versionierung des API-Vertrags (contract_version=1).
Pages Function für POST-Reviews mit Einladungshash, striktem JSON-Format und KV JSON+TTL (pro Review ein einzelner Write); kein Admin-Endpunkt und keine automatische Publikation.

## Sicherheit / 0-Euro-Guardrails
Review-API default off; Token-Hashes sind nur Secrets, keine API-Lesefunktion.
Nur /api/* triggert Functions, Free-Budget ist Cloudflare-seitig hart. Eigene API-Fehler erscheinen als JSON (nur vorübergehende Fehler mit Retry-After); Cloudflare 1027 kann nicht abgefangen werden.
Keine KI-Compute-/R2-/Paid-Services. KV ist ein JSON-Key-Value-Speicher ohne SQL, **kein Dateisystem**; dies ist eine bewusst dokumentierte Abweichung von einer strikten '.json-Datei im Repo'-Idee zugunsten geringerer Angriffsfläche. Speicherung über TTL 90 Tage.

## Technischer Stand und Prüfgrenzen
GitHub Actions CI erfolgreich für Commit 1e0a0ccd, Run 40304898906 (13 Unit-/Graph-/Review-/Markdown-Tests plus 7 Build-/Agenten-/Cache-/Contract-Tests). Alle 243 Entscheidungswege wurden mit der ursprünglichen Erzähl-Engine abgeglichen; erzeugt werden 220 Leseereignisse und Edition 675ec4a10705987f. Nachweis: https://github.com/blame76/zuletzt-onine-243/actions/runs/40304898906
Keine Live-Cloudflare-Instanz, kein PageSpeed-Messwert, kein bestätigter WCAG-Audit, keine echte Android-/iOS-Hörprobe. "100/100" und "AI 4/4" sind Zielwerte, keine Zusicherung; für "AI 4/4" besteht keine eindeutig benannte offizielle Google-Metrik. Manuelle Review-Gates bleiben verbindlich.

## Bekannte Restrisiken
1. Web Speech API: Browser kann pausieren/abbrechen, Hintergrundwiedergabe nicht garantiert.
2. Workers Free mit nur 10 ms CPU-Zeit: reale Lasttests nötig.
3. KV eventual consistency: zwei gleichzeitige Einreichungen mit gleichem Token können vorübergehend beide angenommen werden; Einladungskreis bewusst klein halten.
4. Review-Modell- und Lektüreangaben sind selbstberichtete Angaben, nicht beweisbar.
5. Bei Plattform-Quota 1027 liefert Cloudflare möglicherweise HTML statt unseres maschinenlesbaren JSON.
6. Rechtstexte benötigen Konfigurations- und ggf. juristische Schlussprüfung.
7. Echte PageSpeed-/Lighthouse- und Screenreader-Werte sind vor dem Livegang zu messen; optionales SITE_URL für Canonical und Sitemap.
8. Reader-Leseposition: Kapitelquelle, Zeitmarke, Unterabschnitt und Absatzposition, kein EPUB-CFI. Änderung der Textsegmentierung kann die Wiederaufnahme dennoch verschieben.
9. Fehlende Domain: Canonical/Sitemap werden erst bei gesetztem SITE_URL generiert, vor SEO-Abnahme ergänzen.

## Abnahme-Gates
Siehe docs/ACCEPTANCE.md. PR darf erst nach menschlicher Prüfung gemergt werden. Keine automatische Veröffentlichung, keine Review-Publikation.

## Externes Review
Die technischen Befunde A1–A5 wurden code-seitig bearbeitet, weitere Hinweise aus B–D teilweise umgesetzt bzw. als offene Prüfgates dokumentiert. Detaillierte Zuordnung: `docs/REVIEW-RESPONSE.md`. Realgeräte-, Cloudflare-, Rechts-, Datenschutz- und PageSpeed-Abnahme weiterhin offen. **Nicht merge- oder deploymentfreigegeben.**

## Redaktioneller Abschluss: Roman zuerst (26.10.2026)
Der frühere Werbe-/Erklär-Einstieg wurde durch die eigentliche Romanseite unter `/` ersetzt. Die erste Szene beginnt bei „Montag“ direkt mit „Thomas hatte seit drei Tagen nicht geduscht.“ und ist bereits im statischen HTML vorgerendert. Informationen zur Entstehung und maschinellen Schnittstelle stehen optional unter `/about/`; der Reader erwähnt weder die Zahl der Entscheidungen noch die Zusammenführung der Wege. Die isolierte Titelseite wird beim Aufbau der Erzähl-Engine ausgelassen, ohne das Manuskript zu verändern. Die maschinenlesbare Edition erhält wegen der geänderten Szenen-IDs die neue Kennung `3bf340ca82d98144`; der Inhalt und alle 243 Wege bleiben erhalten. Cache und PWA-Startpunkt sind auf Root ausgerichtet. GitHub Actions Run 40329726614: 21 Unit-/Graph-/Review-/Speech-Tests plus 9 Build-/Agenten-/PWA-Tests bestanden. Ein echter Root-Offline- und Android-/iOS-Test bleibt offen. Kein Merge, kein Deployment.
