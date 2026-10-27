// Horizontal touch gestures navigate the story without hijacking vertical scrolling.
// Deliberately reserve 32px screen edges for native browser/OS back gestures.
export function swipeDirection({startX,startY,endX,endY,width,duration,interactive=false,selected=false}) {
  if (interactive || selected || ![startX,startY,endX,endY,width,duration].every(Number.isFinite)) return null;
  if (width <= 64 || startX < 32 || startX > width - 32 || duration < 0 || duration > 1400) return null;
  const dx=endX-startX, dy=endY-startY;
  if (Math.abs(dx) < Math.max(50,width*.14) || Math.abs(dx) < Math.abs(dy)*1.5) return null;
  return dx < 0 ? "next" : "previous";
}

// Each numbered story unit is one reading section, no matter its scroll height.
// Unchosen decisions and the beginning/end of the story block advancement.
export function sceneTurn({direction,index,count,canNext}) {
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 ||
      index < 0 || index >= count) return index;
  if (direction === "previous") return Math.max(0,index-1);
  if (direction === "next" && canNext) return Math.min(count-1,index+1);
  return index;
}

/** Hide controls on intentional downward reading, reveal when scrolling up.
 * Small scroll jitter should not flash the menu on and off.
 */
export function scrollMenuState({position,previousPosition,travel=0,visible=true,threshold=28}) {
  if (![position,previousPosition,travel].every(Number.isFinite)) return {visible,travel:0};
  if (position <= 20) return {visible:true,travel:0};
  const delta=position-previousPosition;
  if (Math.abs(delta) < 2) return {visible,travel};
  // A single large jump normally means programmatic section navigation.
  if (Math.abs(delta) > 800) return {visible,travel:0};
  const sameDirection=travel===0||Math.sign(delta)===Math.sign(travel);
  const nextTravel=(sameDirection?travel:0)+delta;
  if (Math.abs(nextTravel) < threshold) return {visible,travel:nextTravel};
  return {visible:nextTravel<0,travel:0};
}
