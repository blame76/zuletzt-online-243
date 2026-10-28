// Editorial branch at the exact point before the stairwell encounter.
// The original 243 choices and source manuscript remain unchanged.
const SOURCE = "../manuskript/009-nachwehen.md";
const HEADING = "Sonntag, 9:18 Uhr";
const TARGET = '<p>Unten im Treppenhaus begegnete er Herrn Behrens.</p>';

export function withBehrensBranch(scene, html) {
  if (scene?.source !== SOURCE || scene?.heading !== HEADING) return html;
  if (!html.includes(TARGET)) throw new Error("Herr-Behrens-Anker vor der Begegnung fehlt");
  const branch = '<aside class="nebenweg" aria-label="Optionaler Nebenweg">' +
    '<p class="nebenweg-label">Ein anderer Blick auf denselben Sonntag</p>' +
    '<p>Thomas geht die Treppe hinunter. Für seinen Nachbarn hat dieser Morgen schon einige Stunden gedauert.</p>' +
    '<p><a href="/herr-behrens/">Herr Behrens – Ein Tag, ein Leben</a> · Sieben Kapitel. Danach geht es hier weiter.</p>' +
    '</aside>';
  return html.replace(TARGET, branch + '\n' +
    '<p id="behrens-begegnung">Unten im Treppenhaus begegnete er Herrn Behrens.</p>');
}
