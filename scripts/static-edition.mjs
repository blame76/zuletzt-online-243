// Build a fully static, sequential version of the default story path.
// No JavaScript, local storage, cookies, client-side rendering or external fonts.
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const chapterPath = n => n === 0 ? "/lesen/" : "/lesen/kapitel-" + String(n+1).padStart(2,"0") + "/";
const indexPath = "/lesen/inhaltsverzeichnis/";

export function generateStaticEdition({manifest,pages,write,markdownToHtml}) {
  const chapters = manifest.manuskript.map((chapter,index) => ({
    ...chapter,index,scenes:pages.filter(p=>p.type==="scene" && p.source===chapter.path)
  }));
  if (chapters.some(ch=>!ch.scenes.length)) throw Error("Static chapter unexpectedly empty");
  if (pages.filter(p=>p.type==="choice").length!==manifest.nodes.length) throw Error("Choice graph mismatch");

  const toc = chapters.map(ch=>`<li><a href="${chapterPath(ch.index)}">${escapeHtml(ch.label)}</a></li>`).join("\n");
  const head = (title) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="description" content="Zuletzt online – vollständig als statisches HTML lesbare, lineare Fassung.">
<title>${escapeHtml(title)} – Zuletzt online</title>
<link rel="stylesheet" href="/web/static-reader.css">
</head>
<body>
<a class="skip-link" href="#text">Zum Lesetext springen</a>`;

  const footer = `<footer class="legal"><a href="/">Interaktive Fassung</a> · <a href="/about/">Über das Buch</a> · <a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a><p>© Benjamin Lam. Alle Rechte vorbehalten.</p></footer></body></html>`;
  const index = `${head("Inhaltsverzeichnis")}
<header><a href="/">← Interaktive Fassung</a><p class="edition">Statische Lesefassung · ein festgelegter Erzählweg</p><h1>Zuletzt online</h1><p>Inhaltsverzeichnis</p></header>
<main id="text"><nav aria-label="Alle Kapitel"><ol class="toc">${toc}</ol></nav>
<p><a href="/lesen/">Mit Kapitel 1 beginnen</a></p></main>${footer}`;
  write("lesen/inhaltsverzeichnis/index.html",index);

  for(const chapter of chapters){
    const path = chapterPath(chapter.index);
    const first = chapter.index===0;
    const previous = chapter.index>0 ? chapterPath(chapter.index-1) : null;
    const next = chapter.index+1<chapters.length ? chapterPath(chapter.index+1) : null;
    const links = `<nav class="chapter-nav" aria-label="Kapitel wechseln">${previous?`<a href="${previous}" rel="prev">← Vorheriges Kapitel</a>`:`<span>Beginn des Romans</span>`}<a href="${indexPath}">Inhaltsverzeichnis</a>${next?`<a href="${next}" rel="next">Nächstes Kapitel →</a>`:`<span>Ende des Romans</span>`}</nav>`;
    const text = chapter.scenes.map(p=>markdownToHtml(p.markdown)).join("\n");
    const intro = first
      ? `<p class="edition-note">Diese lineare Fassung verwendet an allen fünf Entscheidungspunkten jeweils die erste Option. Für eigene Entscheidungen die <a href="/">interaktive Fassung</a> öffnen.</p>`
      : "";
    const output=`${head(chapter.label)}
<header><a href="/">← Interaktive Fassung</a><p class="edition">Zuletzt online · Lineare Lesefassung</p><h1>Zuletzt online</h1></header>
${links}
<main id="text"><article aria-label="${escapeHtml(chapter.label)}"><h2 class="chapter-title">${escapeHtml(chapter.label)}</h2>${intro}<div class="prose">${text}</div></article></main>
${links}${footer}`;
    write(path.slice(1)+"index.html",output);
  }
  return chapters.length;
}
