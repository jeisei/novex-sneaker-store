// Older WebKit ports ignore overscroll-behavior. Block only vertical gestures
// that no scroll container can consume, preserving scroll, pinch and 3D input.
export function installScrollBoundaries() {
  if (CSS.supports('overscroll-behavior-y', 'none')) return;
  let touch;
  document.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 ? {
      x:event.touches[0].clientX, y:event.touches[0].clientY,
      lastY:event.touches[0].clientY,
    } : undefined;
  }, { passive:true });
  document.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1 || !event.cancelable || event.defaultPrevented) return;
    const current = event.touches[0];
    const delta = current.clientY - touch.lastY;
    touch.lastY = current.clientY;
    if (!delta || Math.abs(current.clientX - touch.x) > Math.abs(current.clientY - touch.y)) return;
    if (event.target.closest?.('.product-stage-viewer')) return;
    const root = document.scrollingElement;
    for (let node = event.target; node && node !== root; node = node.parentElement) {
      if (node.nodeType !== 1 || !/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) continue;
      if (canScroll(node, delta)) return;
    }
    if (root && canScroll(root, delta)) return;
    event.preventDefault();
  }, { passive:false });
  document.addEventListener('touchend', () => { touch = undefined; }, { passive:true });
  document.addEventListener('touchcancel', () => { touch = undefined; }, { passive:true });
}

function canScroll(node, delta) {
  const maximum = node.scrollHeight - node.clientHeight;
  return maximum > 1 && (delta > 0 ? node.scrollTop > 0 : node.scrollTop < maximum - 1);
}
