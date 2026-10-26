import { buildPages, resourcePaths } from "./engine.mjs";
import { SpeechReader } from "./speech.mjs";

const STORAGE = "zuletzt-online-interaktiv-v1";
const $ = selector => document.querySelector(selector);
const reader = $("#reader");
const status = $("#status");
const progress = $("#progress");
const backBtn = $("#back");
const nextBtn = $("#next");
const chapterSelect = $("#chapter");
const info = $("#info");

let manifest;
let resources;
let pages = [];
let index = 0;
let choices = {};
let fontSize = 19;
let theme = "light";
let savedBlock = 0;
let speechPosition = 0;
let speechSpeed = 1;
let restoring = false;
let speech;
const speechButton = $("#speech-toggle");
const speechStatus = $("#speech-status");
const speedSelect = $("#speech-speed");

function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    index = Number.isInteger(data.index) ? data.index : 0;
    choices = typeof data.choices === "object" && data.choices !== null ? data.choices : {};
    fontSize = Number.isFinite(data.fontSize) ? Math.min(26, Math.max(16, data.fontSize)) : 19;
    theme = data.theme === "dark" ? "dark" : "light";
    savedBlock = Number.isInteger(data.savedBlock) ? data.savedBlock : 0;
    speechPosition = Number.isInteger(data.speechPosition) ? data.speechPosition : 0;
    speechSpeed = [0.8,1,1.25].includes(data.speechSpeed) ? data.speechSpeed : 1;
  } catch { /* Funktioniert auch ohne Browser-Speicher. */ }
}
function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify({ index, choices, fontSize, theme, savedBlock, speechPosition, speechSpeed })); } catch {}
}
function escapeHtml(input) {
  return String(input).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>");
}
function markdownToHtml(text) {
  const rows = text.split("\n");
  let output = [];
  let paragraph = [];
  let quote = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push("<p>" + inline(paragraph.join(" ")) + "</p>");
    paragraph = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    output.push("<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>");
    quote = [];
  };
  for (const raw of rows) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushQuote(); continue; }
    if (line.startsWith(">")) {
      flushParagraph();
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }
    flushQuote();
    if (/^#{1,3}\s/.test(line)) {
      flushParagraph();
      const level = line.match(/^#+/)[0].length;
      const h = level === 1 ? "h1" : "h2";
      output.push("<" + h + ">" + inline(line.replace(/^#+\s*/, "")) + "</" + h + ">");
    } else if (/^---+$/.test(line)) {
      flushParagraph();
      output.push("<hr>");
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushQuote();
  return output.join("\n");
}
function updateTheme() {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.setProperty("--reader-size", fontSize + "px");
  $("#theme").textContent = theme === "dark" ? "Hell" : "Dunkel";
  $("#font-value").textContent = fontSize + " px";
}
function makeChapterSelect() {
  chapterSelect.replaceChildren();
  manifest.manuskript.forEach((chapter, i) => {
    const el = document.createElement("option");
    el.value = chapter.path;
    el.textContent = String(i + 1).padStart(2, "0") + " · " + chapter.label;
    chapterSelect.append(el);
  });
}
function setConnectivity() {
  $("#connectivity").textContent = navigator.onLine ? "" : "Offline – gespeicherte Fassung";
}
function setIndex(value) {
  speech?.stop(); speechPosition = 0; savedBlock = 0;
  index = Math.max(0, Math.min(value, pages.length - 1));
  save();
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function renderChoice(page) {
  const node = manifest.nodes.find(n => n.id === page.nodeId);
  const section = document.createElement("section");
  section.className = "decision";
  const kicker = document.createElement("p");
  kicker.className = "eyebrow";
  kicker.textContent = node.kind + " · Entscheidung " + (manifest.nodes.indexOf(node) + 1) + " von " + manifest.nodes.length;
  section.append(kicker);
  const title = document.createElement("h2");
  title.textContent = node.title;
  section.append(title);
  const prompt = document.createElement("p");
  prompt.textContent = node.question;
  section.append(prompt);
  const list = document.createElement("div");
  list.className = "options";
  node.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-option";
    const isCurrent = choices[node.id] === option.id;
    button.setAttribute("aria-pressed", String(isCurrent));
    if (isCurrent) button.classList.add("chosen");
    const label = document.createElement("strong");
    label.textContent = option.label;
    const description = document.createElement("span");
    description.textContent = option.description;
    button.append(label, description);
    button.addEventListener("click", () => {
      choices[node.id] = option.id;
      pages = buildPages(manifest, resources, choices);
      const decisionIndex = pages.findIndex(p => p.type === "choice" && p.nodeId === node.id);
      setIndex(decisionIndex + 1);
      speechStatus.textContent = "Entscheidung gespeichert. Zum Weiterhören ▶ Vorlesen wählen.";
    });
    list.append(button);
  });
  section.append(list);
  const note = document.createElement("p");
  note.className = "fineprint";
  note.textContent = "Alle Wege führen später in denselben Roman zurück. Du kannst mit „Zurück“ zu dieser Entscheidung zurückkehren.";
  section.append(note);
  return section;
}
function render() {
  if (!pages.length) return;
  const page = pages[index];
  if (speechButton) { speechButton.disabled = page.type !== "scene" || !speech.supported(); speechButton.textContent = "▶ Vorlesen"; }
  reader.replaceChildren();
  if (page.type === "choice") {
    reader.append(renderChoice(page));
  } else {
    const article = document.createElement("article");
    article.className = "prose";
    article.innerHTML = markdownToHtml(page.markdown);
    reader.append(article);
  }
  const chapter = manifest.manuskript.find(m => m.path === page.source);
  chapterSelect.value = chapter.path;
  const sceneNumber = index + 1;
  status.textContent = "Abschnitt " + sceneNumber + " von " + pages.length +
    (page.heading ? " · " + page.heading : "");
  progress.max = pages.length;
  progress.value = sceneNumber;
  progress.setAttribute("aria-valuetext", "Abschnitt " + sceneNumber + " von " + pages.length);
  backBtn.disabled = index === 0;
  nextBtn.disabled = index === pages.length - 1 ||
    (page.type === "choice" && !choices[page.nodeId]);
  nextBtn.textContent = index === pages.length - 1 ? "Ende" : "Weiter";
  info.textContent = page.type === "choice" ? "Wähle einen von drei erzählten Wegen." :
    "Originalmanuskript und geschriebene Varianten · ohne generierte Laufzeittexte";
  save();
}
function goToChapter(path) {
  const target = pages.findIndex(p => p.source === path);
  if (target >= 0) setIndex(target);
}
async function load() {
  restore();
  updateTheme();
  try {
    const response = await fetch("../interaktiv/entscheidungen.json");
    if (!response.ok) throw new Error("Entscheidungen: HTTP " + response.status);
    manifest = await response.json();
    const paths = resourcePaths(manifest);
    const loaded = await Promise.all(paths.map(async path => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(path + ": HTTP " + res.status);
      return [path, await res.text()];
    }));
    resources = Object.fromEntries(loaded);
    pages = buildPages(manifest, resources, choices);
    index = Math.max(0, Math.min(index, pages.length - 1));
    makeChapterSelect();
    $("#initial").hidden = true;
    $("#reading").hidden = false;
    render();
    speedSelect.value = String(speechSpeed);
    requestAnimationFrame(() => {
      const blocks = [...reader.querySelectorAll(".prose p,.prose h1,.prose h2")];
      if (blocks[savedBlock]) blocks[savedBlock].scrollIntoView({block:"start",behavior:"instant"});
    });
  } catch (err) {
    $("#initial").textContent = "Der Roman konnte nicht geladen werden: " + err.message +
      ". Bitte Webseite über einen HTTP-Server öffnen. Für Offline-Lektüre muss sie zuvor einmal vollständig geladen worden sein.";
  }
}
backBtn.addEventListener("click", () => setIndex(index - 1));
nextBtn.addEventListener("click", () => {
  const page = pages[index];
  if (page?.type === "choice" && !choices[page.nodeId]) return;
  setIndex(index + 1);
});
chapterSelect.addEventListener("change", () => goToChapter(chapterSelect.value));
$("#font-plus").addEventListener("click", () => { fontSize = Math.min(26, fontSize + 1); updateTheme(); save(); });
$("#font-minus").addEventListener("click", () => { fontSize = Math.max(16, fontSize - 1); updateTheme(); save(); });
$("#theme").addEventListener("click", () => { theme = theme === "dark" ? "light" : "dark"; updateTheme(); save(); });
$("#restart").addEventListener("click", () => {
  if (!window.confirm("Leseposition und alle fünf Entscheidungen zurücksetzen?")) return;
  choices = {};
  pages = buildPages(manifest, resources, choices);
  setIndex(0);
  speechStatus.textContent = "";
});
window.addEventListener("online", setConnectivity);
window.addEventListener("offline", setConnectivity);
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = document.activeElement?.tagName;
  if (["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
  if (e.key === "ArrowLeft") { e.preventDefault(); if (index > 0) setIndex(index - 1); }
  if (e.key === "ArrowRight") { e.preventDefault(); if (!nextBtn.disabled) setIndex(index + 1); }
});
setConnectivity();
load();
if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

speech = new SpeechReader(state=>{
 if(state.state==="playing"){speechButton.textContent="Ⅱ Pause";speechStatus.textContent="Satz "+(state.position+1)+" von "+state.total;speechPosition=state.position;save();}
 else if(state.state==="paused"){speechButton.textContent="▶ Fortsetzen";speechStatus.textContent="Pausiert";save();}
 else if(state.state==="error"){speechButton.textContent="▶ Vorlesen";speechStatus.textContent=state.message;}
 else{speechButton.textContent="▶ Vorlesen";if(state.state==="completed")speechStatus.textContent="Abschnitt vorgelesen.";}
});
function speakCurrent(){
 const current=pages[index];if(current?.type!=="scene")return;
 if(speech.parts.length&&speech.position>0&&!speech.active){speech.resume();return}
 speech.begin(reader.querySelector(".prose"),()=>{
  if(index>=pages.length-1){speechStatus.textContent="Ende des Romans.";return;}
  setIndex(index+1);
  if(pages[index]?.type==="choice"){speechStatus.textContent="Entscheidung erreicht. Bitte einen Weg auswählen.";reader.focus();return;}
  speakCurrent();
 },speechPosition,speechSpeed);
}
speechButton.addEventListener("click",()=>{if(speech.active)speech.pause();else speakCurrent();});
speedSelect.addEventListener("change",()=>{speechSpeed=Number(speedSelect.value);speech?.stop();speechPosition=0;speech.parts=[];speechButton.textContent="▶ Vorlesen";save()});
let scrollTimer=0;
window.addEventListener("scroll",()=>{
 if(!pages.length||pages[index]?.type!=="scene"||restoring)return;
 clearTimeout(scrollTimer);
 scrollTimer=setTimeout(()=>{
  const blocks=[...reader.querySelectorAll(".prose p,.prose h1,.prose h2")];let nearest=0;
  for(let i=0;i<blocks.length;i++){if(blocks[i].getBoundingClientRect().top<innerHeight*.28)nearest=i;else break;}
  savedBlock=nearest;save();
 },300);
},{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&speech?.active){speechStatus.textContent="Hintergrundwiedergabe hängt vom Browser ab.";save();}});
