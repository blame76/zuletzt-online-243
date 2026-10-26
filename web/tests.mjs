// Ausführen aus dem Repository: node --test web/tests.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { buildPages, resourcePaths, storyEnding, replaceSection } from "./engine.mjs";

const basedir = dirname(fileURLToPath(import.meta.url));
const read = location => readFileSync(resolve(basedir, location), "utf8");
const manifest = JSON.parse(read("../interaktiv/entscheidungen.json"));
const resources = Object.fromEntries(resourcePaths(manifest).map(p => [p, read(p)]));
const options = ["a", "b", "c"];

test("Alle Ressourcen und fünf Entscheidungspunkte vorhanden", () => {
  assert.equal(manifest.nodes.length, 5);
  assert.equal(resourcePaths(manifest).length, 31);
  for (const node of manifest.nodes) assert.deepEqual(node.options.map(x => x.id), options);
});

test("Änderung verlangt exakt die richtige Markdown-Zeitmarke", () => {
  assert.throws(() => replaceSection("### Dienstag, 12:00 Uhr\n\nText.", "Mittwoch, 12:00 Uhr",
    "### Mittwoch, 12:00 Uhr\n\nText."), /fehlt/);
  assert.throws(() => replaceSection("### Dienstag, 12:00 Uhr\n\nText.", "Dienstag, 12:00 Uhr",
    "### Dienstag, 11:00 Uhr\n\nText."), /falsche/);
});

test("Szenenanker funktionieren auch mit Windows-CRLF-Zeilenenden", () => {
  const markdown = "### Dienstag, 12:00 Uhr\n\nAlt.\n\n### Danach\n\nText.".replace(/\n/g, "\r\n");
  const replacement = "### Dienstag, 12:00 Uhr\n\nNeu.".replace(/\n/g, "\r\n");
  const rewritten = replaceSection(markdown, "Dienstag, 12:00 Uhr", replacement);
  assert.match(rewritten, /### Dienstag, 12:00 Uhr\n\nNeu\./);
  assert.match(rewritten, /### Danach\n\nText\./);
});

test("243 Kombinationen bleiben zusammenhängend und haben exakt dasselbe Ende", () => {
  let ending = null;
  let count = 0;
  for (const a of options) for (const b of options)
  for (const c of options) for (const d of options) for (const e of options) {
    const choices = Object.fromEntries(manifest.nodes.map((node, i) =>
      [node.id, [a, b, c, d, e][i]]));
    const pages = buildPages(manifest, resources, choices);
    assert.equal(pages.filter(page => page.type === "choice").length, 5);
    for (const node of manifest.nodes) {
      assert.equal(pages.filter(p => p.type === "choice" && p.nodeId === node.id).length, 1);
    }
    const allText = pages.filter(p => p.type === "scene").map(p => p.markdown).join("\n");
    if (a === "a") {
      assert.match(allText, /Heuschrecken/);
      assert.match(allText, /LEBENDE TIERE/);
    } else {
      assert.doesNotMatch(allText, /Heuschreck/);
      assert.match(allText, /HDMI-Adapter/);
    }
    assert.match(allText, /hundertneunundvierzig|149 Euro/i);
    assert.match(allText, /L-17/);
    assert.match(allText, /Plattenspieler/);
    const final = storyEnding(pages);
    assert.match(final, /Er beschloss, morgen nachzusehen/);
    if (ending === null) ending = final;
    else assert.equal(final, ending);
    count++;
  }
  assert.equal(count, 243);
});

test("Keine Alternativfassung verändert die 15 linearen Quelltexte", () => {
  const paths = manifest.manuskript.map(p => p.path);
  assert.equal(paths.length, 15);
  assert.equal(new Set(paths).size, 15);
});
