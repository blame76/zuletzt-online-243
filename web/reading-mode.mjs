// Pure tap/reading navigation. A long section is read a screen at a time.
export function tapDirection(x, width, {interactive=false, selected=false}={}) {
  if (interactive || selected || !Number.isFinite(x) || !Number.isFinite(width) || width <= 0) return null;
  if (x < width * .3) return "previous";
  if (x > width * .7) return "next";
  return null; // Keep the middle clear for text selection and ordinary interaction.
}

export function readingStep({direction, scrollY, maxScroll, viewportHeight, canPrevious, canNext}) {
  const step = Math.max(1, Math.round(viewportHeight * .84));
  if (direction === "previous") {
    if (scrollY > 24) return {type:"scroll", offset:-Math.min(step, scrollY)};
    return {type:canPrevious ? "previous" : "none"};
  }
  if (direction === "next") {
    if (maxScroll - scrollY > 24) return {type:"scroll", offset:Math.min(step, maxScroll-scrollY)};
    return {type:canNext ? "next" : "none"};
  }
  return {type:"none"};
}
