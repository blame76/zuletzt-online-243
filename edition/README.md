# Vorbereitung für eine Druckfassung

**Bitte den Originaltext in `manuskript/` erhalten.** Stilistische Änderungen und chronologische Eingriffe später in einer separaten Editionsfassung (`edition/text/` oder einem eigenen Git-Branch) vornehmen.

## Textregeln

- UTF-8 und Markdown ohne eingebettete HTML-Layoutanweisungen.
- `# Zuletzt online` für den Titel; `##` für spätere Kapitel; die im ursprünglichen Chat verwendeten Tages- und Uhrzeitmarken vorerst `###`.
- `***` als Szenentrenner verwenden (im gesetzten Buch später durch Abstand oder Vignette ersetzbar).
- Dialoge als gewöhnliche Absätze, Anführungszeichen als deutsche typografische Zeichen („…“).
- Szenen, die bewusst nichts „vorantreiben“, nicht allein deshalb streichen.
- Kursivsetzungen sparsam; Druckausgabe später über Stylesheet gestalten.
- Nicht ungefragt auf ein einheitliches Datum normalisieren; Zeitsprünge und Kontinuität zunächst dokumentieren.

## Offene Lektoratsfragen

- Die Wochen- und Monatsfolge ist während des Schreibens frei gewachsen. Vor Druck Satz für Satz prüfen, nicht automatisch korrigieren.
- Figurennamen, Alter, Wochentage und Jahreszeiten konsistent prüfen.
- Die letzten Abschnitte beschleunigen die Zeit vom Januar bis April; literarisch bewusst entscheiden, ob diese Montage bleibt.
- Der Schluss setzt eine physikalisch-surrealistische Pointe. Ihre Wirkung sollte redaktionell geprüft, nicht beim Import verändert werden.

## Pandoc-Beispiel

Nach vollständiger Übertragung der Manuskriptdateien, aus dem Projektverzeichnis:

```bash
pandoc manuskript/*.md --from markdown --to epub3 \
  --metadata title="Zuletzt online" \
  -o zuletzt-online.epub
```

Für PDF ist eine installierte LaTeX-Engine nötig:

```bash
pandoc manuskript/*.md --from markdown \
  --metadata title="Zuletzt online" \
  --pdf-engine=xelatex -o zuletzt-online.pdf
```

Die endgültige Titelei, Impressum, Kapitelgestaltung, Schusterjungen/Hurenkinder, Silbentrennung, Typografie und Seitenzählung werden erst im Satz festgelegt.
