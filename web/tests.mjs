// Ausführen aus dem Repository: node --test web/tests.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { buildPages, resourcePaths, storyEnding, replaceSection } from "./engine.mjs";
import { swipeDirection, sceneTurn, scrollMenuState } from "./reading-mode.mjs";

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

test("Roman beginnt sofort mit Montag und Thomas, nicht mit einer Titelseite", () => {
  const first=buildPages(manifest,resources,{} )[0];
  assert.equal(first.type,"scene");
  assert.equal(first.heading,"Montag");
  assert.match(first.markdown,/Thomas hatte seit drei Tagen nicht geduscht\./);
  assert.doesNotMatch(first.markdown,/^# Zuletzt online$/m);
});


test("Swipe links blättert vorwärts und Swipe rechts zurück", () => {
  const gesture={startX:180,startY:310,width:390,duration:320};
  assert.equal(swipeDirection({...gesture,endX:105,endY:315}), "next");
  assert.equal(swipeDirection({...gesture,endX:260,endY:315}), "previous");
});

test("Vertikales Scrollen, leichte Diagonalen und kurze Taps blättern nicht", () => {
  const gesture={startX:180,startY:300,width:390,duration:300};
  assert.equal(swipeDirection({...gesture,endX:184,endY:160}), null);
  assert.equal(swipeDirection({...gesture,endX:100,endY:200}), null);
  assert.equal(swipeDirection({...gesture,endX:155,endY:305}), null);
  assert.equal(swipeDirection({...gesture,endX:90,endY:302,duration:1600}), null);
});

test("Browser-Randgesten, Textauswahl und interaktive Elemente bleiben unberührt", () => {
  const gesture={startX:180,startY:310,endX:95,endY:310,width:390,duration:300};
  assert.equal(swipeDirection({...gesture,startX:12}), null);
  assert.equal(swipeDirection({...gesture,startX:376,endX:280}), null);
  assert.equal(swipeDirection({...gesture,interactive:true}), null);
  assert.equal(swipeDirection({...gesture,selected:true}), null);
  assert.equal(swipeDirection({...gesture,width:0}), null);
});

test("Swipe wechselt den ganzen Erzählabschnitt unabhängig von seiner Scrolllänge", () => {
  const baseline={index:17,count:219,canNext:true};
  assert.equal(sceneTurn({...baseline,direction:"next"}),18);
  assert.equal(sceneTurn({...baseline,direction:"previous"}),16);
  // No viewport height, pixel position or scroll offset influences the turn.
  assert.equal(sceneTurn({...baseline,direction:"next",scrollY:0}),18);
  assert.equal(sceneTurn({...baseline,direction:"next",scrollY:25000}),18);
});

test("Swipe überspringt weder offene Entscheidungen noch Buchgrenzen", () => {
  assert.equal(sceneTurn({direction:"next",index:28,count:219,canNext:false}),28);
  assert.equal(sceneTurn({direction:"previous",index:28,count:219,canNext:false}),27);
  assert.equal(sceneTurn({direction:"previous",index:0,count:219,canNext:true}),0);
  assert.equal(sceneTurn({direction:"next",index:218,count:219,canNext:true}),218);
  assert.equal(sceneTurn({direction:"invalid",index:28,count:219,canNext:true}),28);
  assert.equal(sceneTurn({direction:"next",index:-1,count:219,canNext:true}),-1);
});

test("Menü verschwindet erst nach deutlichem Abwärtsscrollen",()=>{
 const step=(position,previousPosition,travel,visible)=>scrollMenuState({position,previousPosition,travel,visible});
 assert.deepEqual(step(35,20,0,true),{visible:true,travel:15});
 assert.deepEqual(step(48,35,15,true),{visible:false,travel:0});
 // First direction switch resets progress and prevents flickering.
 assert.deepEqual(step(58,35,15,true),{visible:false,travel:0});
 assert.deepEqual(step(60,58,0,false),{visible:false,travel:2});
});

test("Menü erscheint erst nach deutlichem Hochscrollen und am Textanfang",()=>{
 assert.deepEqual(scrollMenuState({position:220,previousPosition:234,travel:0,visible:false}),{visible:false,travel:-14});
 assert.deepEqual(scrollMenuState({position:203,previousPosition:220,travel:-14,visible:false}),{visible:true,travel:0});
 assert.deepEqual(scrollMenuState({position:12,previousPosition:203,travel:0,visible:false}),{visible:true,travel:0});
});

test("Jitter und programmatische Scrollsprünge verändern Menü nicht",()=>{
 assert.deepEqual(scrollMenuState({position:140,previousPosition:139,travel:0,visible:true}),{visible:true,travel:0});
 assert.deepEqual(scrollMenuState({position:980,previousPosition:100,travel:0,visible:true}),{visible:true,travel:0});
 assert.deepEqual(scrollMenuState({position:100,previousPosition:980,travel:0,visible:false}),{visible:false,travel:0});
});
