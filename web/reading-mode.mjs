// Pure tap/reading navigation. A long section is read a screen at a time.
export function tapDirection(x, width, {interactive=false, selected=false}={}) {
  if (interactive || selected || !Number.isFinite(x) || !Number.isFinite(width) || width <= 0) return null;
  if (x < width * .3) return "previous";
  if (x > width * .7) return "next";
  return null; // Keep the middle clear for text selection and ordinary interaction.
}

// Align every turn with a predictable page start instead of scrolling relative
// to wherever the user happened to tap (or leaving the previous scroll position).
export function readingStep({direction, scrollY, maxScroll, viewportHeight, canPrevious, canNext, startScroll=0}) {
  if (!Number.isFinite(scrollY) || !Number.isFinite(maxScroll) || !Number.isFinite(viewportHeight) || viewportHeight <= 0) return {type:"none"};
  const step = Math.max(1, Math.round(viewportHeight * .84));
  const start = Math.max(0, startScroll);
  const end = Math.max(start, maxScroll);
  const at = Math.min(end, Math.max(start, scrollY));
  const currentPage = Math.floor((at - start + .5) / step);
  if (direction === "previous") {
    if (at > start + 24) return {type:"scroll", target:Math.max(start, start + (currentPage - 1) * step)};
    return {type:canPrevious ? "previous" : "none"};
  }
  if (direction === "next") {
    if (at < end - 24) return {type:"scroll", target:Math.min(end, start + (currentPage + 1) * step)};
    return {type:canNext ? "next" : "none"};
  }
  return {type:"none"};
}
