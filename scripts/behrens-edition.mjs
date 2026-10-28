// Self-contained static side story. It does not enter the 243-choice graph.
const escape = s => String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const titles = [
  "Ein Morgen", "Die erste Tasse", "Das Kind auf der Straße",
  "Die Schublade", "Die Fernbedienung", "Nichts weiter", "Der Schaum"
];
const names = [
  "01-ein-morgen.md", "02-die-erste-tasse.md",
  "03-das-kind-auf-der-strasse.md", "04-die-schublade.md",
  "05-die-fernbedienung.md", "06-nichts-weiter.md", "07-der-schaum.md"
];
const base = "/lesen/herr-behrens/";
const pathFor = index => base + "kapitel-" + String(index + 1).padStart(2, "0") + "/";
const returnPath = "/lesen/gesamt/#behrens-begegnung";

export function generateBehrensEdition({read, write, markdownToHtml}) {
  const chapters = names.map((name, index) => {
    const source = read("spin-offs/herr-behrens/" + name);
    if (!source.startsWith("# ") || !source.includes("### Sonntag,")) {
      throw new Error("Ungültiges Spin-off-Kapitel: " + name);
    }
    // The manuscript uses *** as scene spacing; our shared renderer uses ---.
    const withoutTitle = source.replace(/^# [^\n]+\n*/, "");
    const html = markdownToHtml(withoutTitle.replace(/^\*\*\*[ \t]*$/gm, "---"));
    return {index, title:titles[index], html};
  });
  const title = "Herr Behrens – Ein Tag, ein Leben";
  const head = (pageTitle, description) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="description" content="${escape(description)}">
<title>${escape(pageTitle)} – ${escape(title)}</title>
<link rel="stylesheet" href="/web/static-reader.css">
</head>
<body><a class="skip-link" href="#text">Zum Lesetext springen</a>`;
  const footer = `<footer class="legal">
<a href="${returnPath}">Zurück zur Begegnung mit Thomas</a> ·
<a href="/">Interaktiver Roman (gespeicherte Leseposition)</a> ·
<a href="/impressum/">Impressum</a>
<p>© Benjamin Lam. Alle Rechte vorbehalten.</p>
</footer></body></html>`;
  const chapterLinks = chapters.map(ch =>
    `<li><a href="${pathFor(ch.index)}">${ch.index+1}. ${escape(ch.title)}</a></li>`
  ).join("\n");
  const introduction = `<p class="edition-note">Optionaler Nebenweg aus <em>Zuletzt online</em>. Sieben Entwurfskapitel über den Sonntagmorgen von Herrn Behrens. Seine Geschichte beginnt vor der Begegnung im Treppenhaus und ist hier noch nicht abgeschlossen. Der originale Roman geht unabhängig davon weiter.</p>`;
  const intro = `${head(title,"Sieben Kapitel über einen Sonntag aus der Sicht von Herrn Behrens.")}
<header><a href="${returnPath}">← Zurück zu Thomas</a><p class="edition">Zuletzt online · optionaler Nebenweg</p><h1>${escape(title)}</h1></header>
<main id="text">${introduction}<nav aria-label="Kapitel von Herr Behrens"><ol class="toc">${chapterLinks}</ol></nav>
<p><a href="${pathFor(0)}">Mit Kapitel 1 beginnen</a> · <a href="${base}gesamt/">Alle sieben Kapitel am Stück lesen</a></p>
</main>${footer}`;
  write("lesen/herr-behrens/index.html",intro);
  for (const ch of chapters) {
    const previous = ch.index > 0 ? pathFor(ch.index - 1) : base;
    const next = ch.index + 1 < chapters.length ? pathFor(ch.index + 1) : returnPath;
    const nextLabel = ch.index + 1 < chapters.length
      ? "Nächstes Kapitel →" : "Zurück zur Begegnung mit Thomas →";
    const nav = `<nav class="chapter-nav" aria-label="Kapitel wechseln">
<a href="${previous}" rel="prev">← Zurück</a>
<a href="${base}">Kapitelübersicht</a>
<a href="${next}">${nextLabel}</a>
</nav>`;
    write("lesen/herr-behrens/kapitel-" + String(ch.index+1).padStart(2,"0") + "/index.html",
      `${head(ch.title,"Herr Behrens, Kapitel "+(ch.index+1)+": "+ch.title)}
<header><a href="${base}">← Herr Behrens</a><p class="edition">Ein Tag, ein Leben · Entwurf</p><h1>${escape(title)}</h1></header>
${nav}<main id="text"><article class="prose" aria-label="Kapitel ${ch.index+1}: ${escape(ch.title)}"><h2 class="chapter-title">${ch.index+1}. ${escape(ch.title)}</h2>${ch.html}</article></main>${nav}${footer}`);
  }
  const sections = chapters.map(ch =>
    `<section aria-labelledby="behrens-ch-${ch.index+1}"><h2 id="behrens-ch-${ch.index+1}">${ch.index+1}. ${escape(ch.title)}</h2><div class="prose">${ch.html}</div></section>`
  ).join("\n");
  write("lesen/herr-behrens/gesamt/index.html",
    `${head("Alle Kapitel","Herr Behrens – alle sieben Kapitel als lineare Lesefassung.")}
<header><a href="${base}">← Kapitelübersicht</a><p class="edition">Herr Behrens · alle sieben Kapitel</p><h1>${escape(title)}</h1></header>
<main id="text">${introduction}<article aria-label="Herr Behrens, derzeit sieben Kapitel">${sections}</article>
<p><a href="${returnPath}">Weiter mit Thomas im Treppenhaus</a></p></main>${footer}`);
  return chapters.length;
}
