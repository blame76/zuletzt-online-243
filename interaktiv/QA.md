# QA- und Leseprotokoll – interaktive Edition

## Automatisierte Strukturprüfung

```bash
node --test web/tests.mjs
```

Die Tests iterieren alle 243 Kombinationen und prüfen gemeinsame Schlusssequenz, sämtliche Entscheidungstafeln, keine Geister-Heuschrecken in den B-/C-Pfaden, Stiefelkauf und L-17. Ein Workflow unter `.github/workflows/interaktive-fassung.yml` ist vorbereitet.

**Status der Erstellung:** Die Zeitmarken aller acht variablen Manuskriptanker wurden im Repository überprüft: jede kommt exakt einmal vor. Die 16 neuen Markdown-Dateien wurden auf richtige Überschriften geprüft. Für die drei Kiosk-Pfade wurden alle vier berührten Abschnitte gemeinsam erfolgreich zusammengeführt und auf widersprüchliche Heuschrecken-Erwähnungen geprüft.

**Noch auszuführen:** Node-Tests in einer regulären Checkout-Umgebung und ein echter Browsertest. Die Prüfungen hier ersetzen keine erfolgreiche CI-Ausführung.

## Manuelle Browser-Checks

- [ ] Lesestart: Alle 15 ursprünglichen Manuskriptdateien erscheinen in Reihenfolge.
- [ ] Kiosk A: Heuschrecken, Tier auf Thomas' Socke, spätere Kiosk-Nachricht.
- [ ] Kiosk B: Abgabe mit Quittung, korrespondierende unauffällige Folgeszenen, **keine Heuschrecken**.
- [ ] Kiosk C: Rückgabe vertagt, am Folgetag erledigt, **keine Heuschrecken**.
- [ ] Vier weitere Entscheidungspunkte: drei anklickbare Optionen, Vor/Zurück und nachfolgende Szenen korrekt.
- [ ] Sprung nach vorn: ungewählte Knoten verwenden Originalweg A, bis bewusst umgeschaltet wird.
- [ ] Maren kauft die Stiefel für 149 € auf allen Wegen; das spätere Gespräch passt.
- [ ] Letzte beiden Textabschnitte lauten bei allen Wegen gleich; es gibt kein zusätzliches Ende.
- [ ] Schriftgröße von 16–26 px, Hell/Dunkel, Tastatur, sichtbare Fokusmarkierung.
- [ ] Android/iOS: Navigation, Textumbruch und 200%-Zoom prüfen.
- [ ] Nach erstmaligem vollständigem Online-Besuch: Netzwerk ausschalten und Seite neu laden; Offline-Lesen prüfen.
- [ ] Lokale Lesezeichen: Neuladen erhält Position und Auswahl.
- [ ] Zurücksetzen löscht Auswahl und Position, nicht die Originaltexte.

## Redaktions-Review nach dem Test mit Lesern

Fragen, die wir *nicht* allein durch technische Tests beantworten können:

1. Wird die Freiheit als Zugewinn erlebt oder als Unterbrechung des Leseflusses?
2. Ist die ungleiche Länge der Alternativszenen ein erzählerischer Gewinn?
3. Fallen die stillen Nachwirkungen beim Zurückspringen überhaupt auf?
4. Gibt die Wahl von Perspektiven tatsächlich Nähe, oder braucht eine Perspektive mehr Platz?
5. Entsteht das Bedürfnis nach mehr Entscheidungen – oder nach weniger?

Empfehlung: Mit 3–5 Testlesern beginnen. Keine Telemetrie einbauen; kurze qualitative Gespräche reichen für die erste Iteration.
