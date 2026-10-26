# Analyse – interaktive Fassung von *Zuletzt online*

Stand: experimenteller Reader auf Basis von `feature/alternatives-ende`. Dieses Dokument wird **vor den Alternativszenen und der Implementierung** angelegt. Der gedruckte Roman und der ursprüngliche Wortlaut der 15 Manuskriptdateien bleiben unverändert.

## Literarische Hypothese

Nicht die Schlüsselfrage „Welches Ende wählst du?“, sondern: **„Wem schaust du wie lange bei seinem Alltag zu?“**

Der gemeinsame Handlungsbogen bleibt: Thomas' Erwerbslosigkeit, sein Kontakt zu Herrn Behrens und das Reparieren, Marens Arbeits- und Familienleben, Nils/Laura, erste Störungen, Moratorium, L-17, später das offene Ende. Entscheidungen ändern den *erzählten Weg* und mitunter kleine Erlebnisse, nicht den Weltzustand oder den Schluss.

**Arbeitsregel:** Jede Abzweigung hat drei vollständig geschriebene Varianten und einen definierten Wiedereinstieg. Es gibt keine Punkte, versteckten „richtigen“ Entscheidungen, willkürlichen Strafen oder zusätzlichen Enden.

## Ergebnis der Bestandsaufnahme

15 nummerierte Markdown-Dateien in `manuskript/`; wiederkehrende `###`-Überschriften für Datum/Uhrzeit und `***` als Szenentrenner. Der alternative Schluss in `015-das-licht.md` endet offen.

Die Vorlage ist episodisch und dadurch für **lokale Verzweigungen** geeignet. Ein echter dauerhafter Entscheidungsbaum wäre derzeit kontraproduktiv: Spätere Kapitel setzen einige konkrete Ereignisse voraus, ohne daraus grundsätzlich neue Handlungswege zu machen.

### Harte Kontinuitätsregeln

1. Thomas erhält die Maschinebau-Stelle zum Januar, unabhängig von den gewählten Alltagsszenen.
2. Herr Behrens' Staubsauger und Rasierer werden repariert, der Plattenspieler bleibt bis zum Schluss in Arbeit.
3. Maren macht im Januar ihre kurze Reise allein; Thomas und die beiden Söhne bleiben zu Hause.
4. Laura und Nils bleiben zusammen und denken über Zusammenziehen nach.
5. Moratorium, L-17-Notizen und das offene Ende dürfen durch die Wahl nicht verändert oder zur Gewissheit erklärt werden.
6. Keine Variante behauptet etwas über das geheime Denken oder Bewusstsein des Systems.
7. Direkte spätere Rückbezüge müssen zur gewählten Variante passen. Besonders **Heuschrecken** sind nachweislich in mehreren späteren Abschnitten enthalten.

## Pilot: fünf Knoten × drei Wege

| ID / Art | Zeitpunkt / Original | Drei erzählte Möglichkeiten | Wiederzusammenführung | Abhängigkeit |
| --- | --- | --- | --- | --- |
| `kiosk` · Erleben | `005`, Mi 10:07 | A: Heuschrecken (Original); B: gewöhnliche Rückgabe mit kleinem Streit; C: Thomas verschiebt die Rückgabe | Mi 10:39, **mit gewählten Nachwirkungen**, weitere Wiedereinstiege nach Mi 15:22 und Do 08:37 | Hoch: drei spätere Szenen müssen passend mitgewechselt werden |
| `strassenbahn` · Perspektive | `005`, Mi 13:16 | A: Laura und Monstera (Original); B: der Mann mit der Pflanze; C: eine andere Fahrgästin | Mi 14:03 | Niedrig: unterschiedliche Blicke auf *dieselbe* Bahnfahrt |
| `tina` · Verweilen | `010`, So 13:47 | A: vollständiger Cafébesuch (Original); B: bei Tina am Tisch; C: bei Laura auf dem Heimweg | So 15:06 | Niedrig: Tina und Laura treffen sich; Tina vermisst Florian |
| `stadt` · Erleben | `013`, Sa 15:36 | A: Schuhgeschäft und Kuchen (Original); B: Verkäuferinnen-Perspektive; C: Thomas verliert Maren kurz aus dem Blick | Sa 16:22 | Mittel: Maren kauft in **allen drei** Wegen dieselben schwarzen Stiefel für 149 €, die abends wieder erwähnt werden |
| `nordsee` · Perspektive | `015`, Jan Fr 16:08 | A: Maren im Hotel (Original); B: Pension aus Sicht der Gastgeberin; C: Thomas zu Hause | Feb 10:19 | Niedrig: Maren bleibt allein zwei Nächte an der Nordsee und ist erreichbar |

**Varianten A sind die bestehenden Originalpassagen** und werden nicht dupliziert. Die B- und C-Varianten stehen in separaten Markdown-Dateien.

## Kiosk-Entscheidung: expliziter Abhängigkeitsgraph

```text
05 / Mittwoch 10:07 -> [A Heuschrecken | B Rückgabe | C Vertagen]
                         |
05 / Mittwoch 10:39 -> [A Heuschrecke am Strumpf | B Beleg | C Adapter bleibt]
                         |
05 / Mittwoch 15:22 -> [A Kiosk räumt Tiere | B Kiosk arbeitet weiter | C Kiosk-Alltag]
                         |
09 / Donnerstag 08:37 -> [A virales Video | B Alltag | C spätere Rückgabe]
                         |
                    alle weiteren Kapitel identisch
```

Die Original-Heuschrecken erscheinen außerhalb dieser vier isolierbaren Passagen **nicht als notwendiger späterer Plot-Motor**. Deshalb ist der Austausch möglich, ohne die restlichen 14 Manuskriptdateien umzuschreiben.

## Regel für lokale Bedeutung

- **Erleben:** kleine äußere Ereignisse unterscheiden sich; Rückkehr zu gleichem Zustand.
- **Perspektive:** dasselbe Ereignis aus anderer Wahrnehmung; keine Änderung des Geschehens.
- **Verweilen:** Leser entscheidet, welchem Gespräch oder unausgesprochenem Gedanken er Zeit gibt; keine zusätzliche Belohnung.

Auch das Nicht-Gelesene soll literarisch gültig bleiben. Keine „Vollständigkeits“-Mechanik, die Leser zum wiederholten Optimieren ihrer Wege nötigt.

## Leserführung und technische Anforderungen

- Lineare Lektüre mit fünf Entscheidungstafeln; je drei **unterschiedliche beschriebene Optionen**.
- Die gewählte Szene ersetzt genau den vorgesehenen Abschnitt. Beim Kiosk werden drei **stille Folgeersetzungen** angewendet.
- Text ist UTF-8-Markdown, aufbewahrt neben dem unveränderten Manuskript.
- Ein statischer Reader ohne Framework, Backend, Account, Tracking oder externe Schriftarten.
- Mobile-first, kontrastreich, lesbare Fließtextspalte; Tastaturbedienung und sichtbarer Fokus.
- Vor/Zurück, Fortschritt, Inhaltsübersicht, einstellbare Schriftgröße, Hell/Dunkel, lokales Lesezeichen.
- PWA-Grundlage mit App-Manifest und Offline-Cache nach erstem Laden aller Ressourcen.
- Keine automatische Veröffentlichung: Hosting (z. B. GitHub Pages) separat aktivieren.
- Testfälle: alle 3^5 = **243** Wahlkombinationen, insbesondere vollständige Kiosk-Kohärenz. Das Ende ist bei allen Wegen exakt gleich.

## Bewusst nicht enthalten

Spielpunkte, Charakterwerte, Entscheidungs-Timer, moralische Bewertungen, alternative Jobausgänge, neue L-17-Enden, KI-gestützte Laufzeiterzeugung von Text, Telemetrie über Leserentscheidungen.

## Qualitätsgate vor Veröffentlichung

- Jede Variante ist eine **vollwertige Szene**, kein Inhaltsabriss.
- Die Figuren haben auch dann eigene Interessen, wenn sich nichts „rechnet“.
- Alle 243 Kombinationen lesen denselben unveränderten letzten Abschnitt.
- Keine Heuschrecke ohne Kiosk-Vorfall; kein fehlender Stiefelkauf vor der Stiefeldiskussion.
- Das konkrete Datum wird aus der Manuskriptfassung übernommen; keine künstliche zeitliche Umordnung.
- Literarische Frage offen: Fördert die Auswahl tatsächlich Nähe oder fragmentiert sie den Text noch mehr?
