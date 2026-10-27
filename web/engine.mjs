// Zuletzt online — Erzählgraph ohne Framework und ohne Netzwerklogik.
export function resourcePaths(manifest) {
  const paths = new Set(manifest.manuskript.map(item => item.path));
  for (const node of manifest.nodes) {
    for (const option of node.options) if (option.scene) paths.add(option.scene);
    for (const ripple of (node.ripples || [])) {
      for (const path of Object.values(ripple.scenes)) paths.add(path);
    }
  }
  return [...paths];
}

function headingMarker(heading) {
  return "### " + heading;
}

// Ersetzt exakt eine zeitlich markierte Sequenz; das Original bleibt in manuskript/.
// Abgrenzung durch die nächste ###-Überschrift statt durch Absatzpositionen.
export function replaceSection(markdown, heading, replacement) {
  markdown = markdown.replace(/\r\n/g, "\n");
  replacement = replacement.replace(/\r\n/g, "\n");
  const marker = headingMarker(heading);
  const index = markdown.indexOf(marker + "\n");
  if (index < 0) throw new Error("Szenenanker fehlt: " + heading);
  const later = markdown.indexOf(marker + "\n", index + marker.length + 1);
  if (later >= 0) throw new Error("Szenenanker nicht eindeutig: " + heading);
  const next = markdown.indexOf("\n### ", index + marker.length);
  const end = next < 0 ? markdown.length : next + 1;
  const rewritten = replacement.trim();
  if (!rewritten.startsWith(marker + "\n")) {
    throw new Error("Alternativszene hat falsche Überschrift: " + heading);
  }
  return markdown.slice(0, index) + rewritten + "\n\n" + markdown.slice(end);
}

export function splitIntoPages(markdown, source) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const pages = [];
  let buffer = [];
  let runningHeading = "";
  let startHeading = null;

  const flush = () => {
    const text = buffer.join("\n").trim();
    // The standalone manuscript title is metadata, not a separate blank reading page.
    // Keep the original Markdown untouched for archival and agent provenance.
    if (text && !(pages.length === 0 && !runningHeading && /^# [^\n]+$/.test(text))) {
      pages.push({
        type: "scene",
        source,
        markdown: text,
        heading: runningHeading,
        startHeading
      });
    }
    buffer = [];
    startHeading = null;
  };

  for (const line of lines) {
    if (/^###\s+/.test(line)) {
      flush();
      runningHeading = line.slice(4).trim();
      startHeading = runningHeading;
      buffer.push(line);
    } else if (/^\*\*\*\s*$/.test(line)) {
      flush();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return pages;
}

// Für Optionen ohne Auswahl wird der Originalpfad verwendet, etwa bei Kapitel-Sprüngen.
// Eine Entscheidungstafel wird dennoch angezeigt, wenn man regulär dorthin liest.
export function buildPages(manifest, resources, choices = {}) {
  const pages = [];
  const nodesByLocation = new Map(
    manifest.nodes.map(n => [n.at.source + "|" + n.at.heading, n])
  );

  for (const manuscript of manifest.manuskript) {
    let text = resources[manuscript.path];
    if (typeof text !== "string") throw new Error("Manuskript fehlt: " + manuscript.path);

    for (const node of manifest.nodes) {
      const chosen = node.options.find(x => x.id === choices[node.id]) || node.options[0];
      if (node.at.source === manuscript.path && chosen.scene) {
        const alternative = resources[chosen.scene];
        if (typeof alternative !== "string") throw new Error("Variante fehlt: " + chosen.scene);
        text = replaceSection(text, node.at.heading, alternative);
      }
      for (const ripple of node.ripples || []) {
        const path = ripple.scenes[chosen.id];
        if (ripple.at.source !== manuscript.path || !path) continue;
        const alternative = resources[path];
        if (typeof alternative !== "string") throw new Error("Folgeszene fehlt: " + path);
        text = replaceSection(text, ripple.at.heading, alternative);
      }
    }

    for (const scene of splitIntoPages(text, manuscript.path)) {
      const node = scene.startHeading &&
        nodesByLocation.get(manuscript.path + "|" + scene.startHeading);
      if (node) pages.push({ type: "choice", nodeId: node.id, source: manuscript.path, heading: scene.startHeading });
      pages.push(scene);
    }
  }

  for (const node of manifest.nodes) {
    const matches = pages.filter(page => page.type === "choice" && page.nodeId === node.id);
    if (matches.length !== 1) throw new Error("Entscheidung nicht eindeutig: " + node.id);
  }
  return pages;
}

export function storyEnding(pages) {
  // Das Markdown-Manuskript endet auf einer eigenen **Ende.**-Seite.
  // Für den Vergleich ist auch der letzte erzählte Absatz wichtig.
  const finalScenes = pages.filter(page => page.type === "scene").slice(-2);
  return finalScenes.map(page => page.markdown).join("\n\n***\n\n");
}
