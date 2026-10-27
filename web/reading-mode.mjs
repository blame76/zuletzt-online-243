// Horizontal touch gestures navigate the story without hijacking vertical scrolling.
// Deliberately reserve 32px screen edges for native browser/OS back gestures.
export function swipeDirection({startX,startY,endX,endY,width,duration,interactive=false,selected=false}) {
  if (interactive || selected || ![startX,startY,endX,endY,width,duration].every(Number.isFinite)) return null;
  if (width <= 64 || startX < 32 || startX > width - 32 || duration < 0 || duration > 1400) return null;
  const dx=endX-startX, dy=endY-startY;
  if (Math.abs(dx) < Math.max(50,width*.14) || Math.abs(dx) < Math.abs(dy)*1.5) return null;
  return dx < 0 ? "next" : "previous";
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
