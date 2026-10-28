import { buildPages, resourcePaths } from "./engine.mjs";
import { SpeechReader } from "./speech.mjs";
import { markdownToHtml } from "./markdown.mjs";
import { withBehrensBranch } from "./spinoff-branch.mjs";
import { swipeDirection, sceneTurn, scrollMenuState } from "./reading-mode.mjs";
import { initUpdates } from "./updates.mjs";

const STORAGE = "zuletzt-online-interaktiv-v1";
const $ = selector => document.querySelector(selector);
const reader = $("#reader");
const status = $("#status");
const progress = $("#progress");
const backBtn = $("#back");
const nextBtn = $("#next");
const chapterSelect = $("#chapter");
const readingModeToggle = $("#reading-mode-toggle");

let manifest;
let resources;
let pages = [];
let index = 0;
let choices = {};
let fontSize = 19;
let theme = "light";
let readingMode = true;
let menuVisible = true;
let lastScrollY = 0;
let menuScrollTravel = 0;
let savedBlock = 0;
let restoredAnchor = null;
let speechPosition = 0;
let speechSpeed = 1;
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
    theme = ["dark","light"].includes(data.theme) ? data.theme : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    restoredAnchor = data.anchor || null;
    savedBlock = Number.isInteger(data.savedBlock) ? data.savedBlock : 0;
    speechPosition = Number.isInteger(data.speechPosition) ? data.speechPosition : 0;
    speechSpeed = [0.8,1,1.25].includes(data.speechSpeed) ? data.speechSpeed : 1;
    readingMode = data.readingMode !== false;
  } catch { /* Funktioniert auch ohne Browser-Speicher. */ }
}
function save() {
  try { const page=pages[index]; const anchor=page?{source:page.source,heading:page.heading,ordinal:pages.slice(0,index).filter(p=>p.source===page.source&&p.heading===page.heading).length,block:savedBlock}:restoredAnchor; localStorage.setItem(STORAGE, JSON.stringify({ index, choices, fontSize, theme, readingMode, savedBlock, speechPosition, speechSpeed, anchor })); } catch {}
}
function updateTheme() {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.setProperty("--reader-size", fontSize + "px");
  $("#theme").textContent = theme === "dark" ? "Hell" : "Dunkel";
  $("#font-value").textContent = fontSize + " px";
}
function resetReadingMenu() {
  menuVisible = true;
  menuScrollTravel = 0;
  lastScrollY = Math.max(0, window.scrollY);
  document.documentElement.dataset.readingMenu = "visible";
}
function updateScrollMenu() {
  const position = Math.max(0, window.scrollY);
  if (!readingMode || (document.activeElement === readingModeToggle && readingModeToggle.matches(":focus-visible"))) {
    lastScrollY = position;
    menuScrollTravel = 0;
    return;
  }
  const state = scrollMenuState({
    position, previousPosition:lastScrollY,
    travel:menuScrollTravel, visible:menuVisible
  });
  lastScrollY = position;
  menuScrollTravel = state.travel;
  if (state.visible !== menuVisible) {
    menuVisible = state.visible;
    document.documentElement.dataset.readingMenu = menuVisible ? "visible" : "hidden";
  }
}
function updateReadingMode() {
  resetReadingMenu();
  document.documentElement.dataset.readingMode = readingMode ? "on" : "off";
  readingModeToggle.textContent = readingMode ? "Menü" : "Lesemodus";
  readingModeToggle.setAttribute("aria-pressed", String(readingMode));
  const label = readingMode ? "Menü und Leseeinstellungen anzeigen" : "Lesemodus einschalten";
  readingModeToggle.setAttribute("aria-label", label);
  readingModeToggle.title = label;
}
function visibleReadingBlock() {
  return [...reader.querySelectorAll(".prose p, .prose h1, .prose h2, .decision")].find(
    el => el.getBoundingClientRect().bottom > 65
  );
}
function turnReadingPage(direction) {
  if (!pages.length || !readingMode) return;
  // A horizontal swipe changes the complete story section, regardless of
  // how far the reader has scrolled inside its text.
  const target = sceneTurn({
    direction,
    index,
    count:pages.length,
    canNext:!nextBtn.disabled
  });
  if (target !== index) setIndex(target);
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
  speech?.stop(); if(speech)speech.parts=[]; speechPosition = 0; savedBlock = 0;
  index = Math.max(0, Math.min(value, pages.length - 1));
  save();
  render();
  reader.focus({preventScroll:true});
  // Rendered text can be shorter than the old section. Anchor the viewport
  // after layout as well: browsers otherwise retain the old scroll position.
  const goToStart = () => {
    const top = Math.max(0, window.scrollY + reader.getBoundingClientRect().top);
    window.scrollTo({top, behavior:"instant"});
  };
  goToStart();
  resetReadingMenu();
  requestAnimationFrame(() => {
    goToStart();
    resetReadingMenu();
  });
}
function renderChoice(page) {
  const node = manifest.nodes.find(n => n.id === page.nodeId);
  const section = document.createElement("section");
  section.className = "decision";
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
  return section;
}
function render() {
  if (!pages.length) return;
  const page = pages[index];
  reader.setAttribute("aria-label", "Lesetext: Abschnitt "+(index+1)+" von "+pages.length);
  if (speechButton) { speechButton.disabled = page.type !== "scene" || !speech.supported(); speechButton.textContent = "▶ Vorlesen"; }
  reader.replaceChildren();
  if (page.type === "choice") {
    reader.append(renderChoice(page));
  } else {
    const article = document.createElement("article");
    article.className = "prose";
    article.innerHTML = withBehrensBranch(page, markdownToHtml(page.markdown));
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
  save();
}
function goToChapter(path) {
  const target = pages.findIndex(p => p.source === path);
  if (target >= 0) setIndex(target);
}
async function load() {
  restore();
  updateTheme();
  updateReadingMode();
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
    if(restoredAnchor?.source){
      const matches=pages.map((p,i)=>({p,i})).filter(({p})=>p.source===restoredAnchor.source&&p.heading===restoredAnchor.heading);
      if(matches.length){const at=Math.max(0,Math.min(Number(restoredAnchor.ordinal)||0,matches.length-1));index=matches[at].i;savedBlock=Number(restoredAnchor.block)||0;}
    }
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
    $("#reading").hidden = true;
    $("#initial").hidden = false;
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
readingModeToggle.addEventListener("click", () => {
  const block = visibleReadingBlock();
  readingMode = !readingMode;
  updateReadingMode();
  save();
  if (block) block.scrollIntoView({block:"start",behavior:"instant"});
});
// Horizontal touch swipe: left means next, right means previous.
// Normal vertical scroll, selection, decision buttons and browser-edge back
// gestures keep their native behaviour. Mouse clicks no longer turn pages.
let swipeStart = null;
reader.addEventListener("touchstart", event => {
  swipeStart = null;
  if (!readingMode || !pages.length || event.touches.length !== 1) return;
  const touch = event.touches[0];
  swipeStart = {
    identifier: touch.identifier,
    x: touch.clientX, y: touch.clientY, time: performance.now(),
    interactive: !!event.target.closest?.("a,button,input,select,textarea,summary,[contenteditable]")
  };
}, {passive:true});
reader.addEventListener("touchmove", event => {
  if (event.touches.length !== 1) swipeStart = null;
}, {passive:true});
reader.addEventListener("touchend", event => {
  const start = swipeStart;
  swipeStart = null;
  if (!start || !readingMode || event.touches.length !== 0) return;
  const touch = [...event.changedTouches].find(t => t.identifier === start.identifier);
  if (!touch) return;
  const direction = swipeDirection({
    startX:start.x, startY:start.y,
    endX:touch.clientX, endY:touch.clientY, width:window.innerWidth,
    duration:performance.now()-start.time, interactive:start.interactive,
    selected:!!window.getSelection()?.toString().trim()
  });
  if (direction) turnReadingPage(direction);
}, {passive:true});
reader.addEventListener("touchcancel", () => { swipeStart = null; }, {passive:true});

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
  if (e.key === "Escape" && readingMode) {
    e.preventDefault(); readingMode = false; updateReadingMode(); save();
    readingModeToggle.focus(); return;
  }
  if (e.key === "ArrowLeft") { e.preventDefault(); if (readingMode) turnReadingPage("previous"); else if (index > 0) setIndex(index - 1); }
  if (e.key === "ArrowRight") { e.preventDefault(); if (readingMode) turnReadingPage("next"); else if (!nextBtn.disabled) setIndex(index + 1); }
});
setConnectivity();
load();
// Preserve the locally saved story path and position before opt-in activation.
window.addEventListener("load", () => initUpdates({
  currentVersion:document.querySelector('meta[name="reader-version"]')?.content,
  onBeforeReload:save
}));

speech = new SpeechReader(state=>{
 if(state.state==="playing"){speechButton.textContent="Ⅱ Pause";speechStatus.textContent="Satz "+(state.position+1)+" von "+state.total;speechPosition=state.position;save();}
 else if(state.state==="paused"){speechButton.textContent="▶ Fortsetzen";speechStatus.textContent="Pausiert";save();}
 else if(state.state==="error"){speechButton.textContent="▶ Vorlesen";speechStatus.textContent=state.message;}
 else{speechButton.textContent="▶ Vorlesen";if(state.state==="completed")speechStatus.textContent="Abschnitt vorgelesen.";}
});
function speakCurrent(){
 const current=pages[index];if(current?.type!=="scene")return;
 if(speech.parts.length&&!speech.active){speech.resume();return}
 speech.begin(reader.querySelector(".prose"),()=>{
  if(index>=pages.length-1){speechStatus.textContent="Ende des Romans.";return;}
  setIndex(index+1);
  if(pages[index]?.type==="choice"){speechStatus.textContent="Entscheidung erreicht. Bitte einen Weg auswählen.";reader.focus();return;}
  speakCurrent();
 },speechPosition,speechSpeed);
}
speechButton.addEventListener("click",()=>{if(speech.active)speech.pause();else speakCurrent();});
speedSelect.addEventListener("change",()=>{const wasPlaying=speech?.active; speechPosition=speech?.parts.length?speech.position:speechPosition; speech?.stop();if(speech)speech.parts=[];speechSpeed=Number(speedSelect.value);speechButton.textContent="▶ Vorlesen";save();if(wasPlaying)speakCurrent();});
let scrollTimer=0;
window.addEventListener("scroll",()=>{
 updateScrollMenu();
 if(!pages.length||pages[index]?.type!=="scene" )return;
 clearTimeout(scrollTimer);
 scrollTimer=setTimeout(()=>{
  const blocks=[...reader.querySelectorAll(".prose p,.prose h1,.prose h2")];let nearest=0;
  for(let i=0;i<blocks.length;i++){if(blocks[i].getBoundingClientRect().top<innerHeight*.28)nearest=i;else break;}
  savedBlock=nearest;save();
 },300);
},{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&speech?.active){speechStatus.textContent="Hintergrundwiedergabe hängt vom Browser ab.";save();}});
