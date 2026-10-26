# Lokale Abnahme

Diese Anleitung dient der manuellen Prüfung des gebauten statischen Artefakts. Sie ist keine Release-Freigabe. Der lokale Python-Server bindet ausschließlich an die Loopback-Adresse; er startet keine Cloudflare- oder GitHub-Funktionen.

## Voraussetzungen und Start

- Windows 11, vorhandenes Python 3 und Node.js 22 oder neuer; lokal geprüft mit Node.js 26.7.0, npm 11.19.0 und Python 3.13.14.
- Im Repository `npm run check` erfolgreich ausführen. Das erzeugt `dist/` und führt Unit-, Build- und Artefakttests nacheinander aus.
- Port 8000 war bei der Prüfung bereits belegt (IPv6-Wildcard, PID 1956); dieser fremde Prozess bleibt unberührt. Der lokale Abnahmeserver läuft deshalb auf dem freien Port 8001. Bei einem späteren Neustart Portbelegung neu prüfen und keinen bestehenden Prozess beenden.
- In einem dedizierten VS-Code-Terminal aus dem Repository starten:

  `python -m http.server 8001 --bind 127.0.0.1 --directory dist`

- Stopp: im selben Terminal `Ctrl+C` drücken. Der Server bleibt während der Abnahme manuell geöffnet; kein Watcher und kein zusätzlicher Runtime-Server ist erforderlich.

## Lokale URLs

- Landingpage: http://127.0.0.1:8001/
- Reader: http://127.0.0.1:8001/web/
- Agentenmanifest: http://127.0.0.1:8001/agent/v1/manifest.json
- Erstes Kapitel-Bundle: http://127.0.0.1:8001/agent/v1/chapters/ch01.json
- Review-Schema: http://127.0.0.1:8001/agent/v1/review.schema.json
- Impressum: http://127.0.0.1:8001/impressum/
- Datenschutz: http://127.0.0.1:8001/datenschutz/

Erwartung: alle oben genannten statischen Ressourcen liefern HTTP 200. Der lokale HTTP-Server bedient ausschließlich Dateien in `dist/`; er führt Pages Functions nicht aus. Insbesondere ist der Review-Endpunkt auf diesem Server nicht end-to-end testbar.

## Menschliches Lesen

1. Reader öffnen und warten, bis Abschnitt, Fortschritt und Kapitelwahl sichtbar sind.
2. Mit **Weiter** einige Abschnitte lesen. Überschriften, Absätze und Blockzitate auf korrekte Darstellung prüfen.
3. Bei „Ein Paket auf dem Rückweg“ eine Option auswählen. Erwartung: eine Entscheidung ist markiert, die Fortsetzung zeigt den gewählten Weg; mit **Zurück** ist die Entscheidung wieder erreichbar.
4. Kapitelwahl verwenden und in einen anderen Manuskriptteil springen. Mit **Zurück**/**Weiter** die normale Navigation wieder aufnehmen.
5. Leseposition und Wegwahl speichern lassen, Seite neu laden. Erwartung: der Abschnitt, der Absatzanker und die gespeicherten Entscheidungen werden wiederhergestellt.
6. A−/A+ mehrfach betätigen und Hell/Dunkel wechseln. Einstellung und Lesbarkeit prüfen; die Schriftgröße wird zwischen 16 und 26 px begrenzt.
7. Mit „Von vorn beginnen …“ nach Bestätigung einen Reset durchführen. Erwartung: Entscheidungen und Leseposition sind zurückgesetzt.
8. Den Ablauf in einem privaten Fenster wiederholen, um zu prüfen, dass Speicherstände getrennt sind.

## Vollständiger interaktiver Testweg

Dieser konkrete Weg wählt nacheinander alle fünf Entscheidungspunkte und erreicht das gemeinsame Ende:

1. Kiosk: **b – Er gibt den Adapter einfach zurück**.
2. Straßenbahn: **c – Einer anderen Fahrgästin**.
3. Tina: **b – In Tinas Gedanken**.
4. Stadt: **c – Thomas beim Abstecher nebenan**.
5. Nordsee: **b – Die Pensionswirtin**.

An jedem Entscheidungspunkt Auswahl treffen und mit Weiter bzw. Vorlesen bis zum nächsten Punkt gehen. Erwartung: die jeweilige geschriebene Variante einschließlich abhängiger Folgeszenen erscheint; nach der fünften Wahl wird das gemeinsame Romanende erreicht. Das ist ein manueller Reader-Weg, nicht der vollständige Test sämtlicher Wege; automatisiert werden alle 243 Kombinationen geprüft.

## Vorlesen

1. In einem unterstützten Browser die Wiedergabe eines Textabschnitts starten. Erwartung: Satznummer und Status werden angezeigt.
2. Pausieren und fortsetzen; prüfen, ob an der aktuellen Satzposition fortgesetzt wird.
3. Das Tempo auf 0,8× und 1,25× ändern. Während der Wiedergabe prüfen, ob sie mit dem neuen Tempo weiterläuft.
4. Bis an eine Entscheidung sprechen lassen. Erwartung: das automatische Weiterlesen stoppt; eine Wegwahl ist erforderlich.
5. Abschnitt wechseln und Vorlesen neu starten. Erwartung: die neue Wiedergabe startet abschnittsbezogen.
6. Bei fehlender oder fehlerhafter Browser-Sprachausgabe Meldung und erneuten Start prüfen.
7. Gerät sperren bzw. Tab in den Hintergrund legen und Verhalten beobachten. Hintergrundwiedergabe ist browser- und geräteabhängig und wird **nicht zugesichert**.

Automatisierte Node-Tests prüfen Satzposition, Pause/Fortsetzen, Abschnittsabschluss, Tempoübergabe, Fehlerstatus und fehlende Speech API mit einer kontrollierten API-Simulation. Sie simulieren keine echte Stimme, Audioausgabe, Browser-Sperrbildschirm oder Mobilgeräte.

## Tastatur und Screenreader

- Ohne Maus mit Tab/Shift+Tab durch Skip-Link, Einstellungen, Kapitelwahl, Vorlesen und Navigation gehen. Fokusindikator und logische Reihenfolge prüfen.
- Skip-Link aktivieren; danach soll der Reader-Inhalt im Fokus stehen.
- Mit Tab zu jeder Entscheidungsoption gehen; Beschriftung, Beschreibung und gewählter Zustand („gedrückt“/`aria-pressed`) prüfen. Auswahl und Fokus nach der Entscheidung kontrollieren.
- Reader-Fortschritt, Abschnittsstatus, Verbindungsstatus und Vorlesestatus mit einem Screenreader prüfen.
- Mit NVDA unter Windows mindestens eine vollständige Entscheidung und Kapitelwechsel prüfen; bei Veröffentlichung zusätzlich VoiceOver und TalkBack auf echten Geräten.
- Browser-Zoom auf 200 % erhöhen und bei schmaler Viewportbreite Lesbarkeit und Bedienelemente prüfen.

Diese Schritte sind noch manuell auszuführen; automatisierte Tests sind kein WCAG- oder Screenreader-Audit.

## Offline und Cache

1. Reader über HTTP vollständig laden und kurz warten, bis der Service Worker installiert ist. Browser-Entwicklertools, Application/Storage öffnen und registrierten Worker sowie Cache kontrollieren.
2. Netzwerk in den Entwicklertools offline schalten und Reader neu laden. Prüfen, ob Reader und zuvor vollständig geladener Roman verfügbar bleiben.
3. Netzwerk wieder einschalten. In einem separaten lokalen Checkout Build-/Textänderungen testen; einen vorhandenen Browser-Cache nicht manuell löschen. Nach erneutem Build und Reload soll die neue Edition den alten App-Shell-Cache ersetzen.
4. Für einen kontrollierten Negativtest Website-Daten/Service-Worker im Browser löschen und offline laden. Erwartung: ohne vorherige Installation bzw. Cache ist Offline-Lektüre nicht verfügbar.

Die automatisierte Cache-Prüfung kontrolliert, dass die generierte Cachekennung vom Editionshash und sämtlichen ausgelieferten Reader-Shell-Dateien abhängt. Installation, Offline-Verhalten und tatsächliche Browser-Invalidierung sind manuell noch zu prüfen.

## Agenten-Leseschnittstelle

- Manifest öffnen und Edition, fünf Entscheidungspunkte, 15 Kapitel-Bundles und 220 geordnete Leseereignisse kontrollieren.
- `ch01.json` öffnen; `edition`, Szenenreihenfolge und `next` prüfen. Der dokumentierte Agentenvertrag steht in `/agent/v1/guide.json` und im lokalen Repository unter `docs/AGENT-HOWTO.md`.
- Tests prüfen die 243 Wege, Variantenersetzung, Szenenreihenfolge, Kapitelabdeckung, Editionskennung und Textgleichheit gegenüber dem menschlichen Erzähl-Engine-Pfad.

## Noch nicht lokal testbare Cloudflare-Funktionen

- `POST /api/v1/reviews`, Bearer-Secrets, Workers KV und Plattformquoten: Unit-Tests verwenden lokale Mock-Bindings; der statische Python-Server führt keine Pages Functions aus.
- Cloudflare-Fehler 1027/1102 können vor Ausführung der Function auftreten und sind nicht durch deren JSON-Vertrag abgedeckt.
- Kein Wrangler wurde installiert/gestartet; vor einer lokalen Wrangler-Simulation wäre eine gesonderte Freigabe erforderlich.
- Keine Verbindung, Änderung, Veröffentlichung oder kostenpflichtige Aktivierung bei Cloudflare oder GitHub im Rahmen dieser Anleitung.

## Erwartete Ergebnisse und bekannte Einschränkungen

**Automatisiert lokal geprüft:** 243 vollständige Erzählwege mit gemeinsamem Ende; Übereinstimmung der maschinenlesbaren Varianten mit dem Reader; 15 Kapitel-Bundles/220 Events; Markdown-Escaping und mehrteilige Blockzitate; Review-API-Vertragsfehler mit Mock-Bindings; PWA-Artefakte und Cache-Hash; Windows-CRLF-Anker; Ausschluss privater Testdateien aus `dist/`.

**Manuell noch offen:** echter Browserlauf und gespeicherte Leseposition, tatsächliche PWA-Installation/Offline-Wiedergabe, Cache-Aktualisierung, reale Sprachausgabe und Gerätegrenzen, Tastatur- und Screenreader-Abnahme, Responsive/Zoom-Prüfung sowie menschliche Lektüre aller Entscheidungen.

**Außerhalb dieser lokalen Abnahme:** Live-Cloudflare/KV-Integration, reale Review-Einreichung, juristische Prüfung von Impressum/Datenschutz, Deployment, SEO-/PageSpeed-Messung und Freigabe zur Veröffentlichung. Ein erfolgreicher lokaler Test ist keine Release-Freigabe.
