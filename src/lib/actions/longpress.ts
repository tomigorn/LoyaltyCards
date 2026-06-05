/** Svelte action: dispatches a `longpress` CustomEvent after `duration` ms of holding,
 *  cancelled if the pointer moves too far or is released early. */
export function longpress(node: HTMLElement, duration = 500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sx = 0, sy = 0;
  const start = (e: PointerEvent) => {
    sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => node.dispatchEvent(new CustomEvent('longpress')), duration);
  };
  const move = (e: PointerEvent) => {
    if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(timer); timer = undefined; }
  };
  const cancel = () => { if (timer) { clearTimeout(timer); timer = undefined; } };
  node.addEventListener('pointerdown', start);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', cancel);
  node.addEventListener('pointerleave', cancel);
  node.addEventListener('pointercancel', cancel);
  return {
    destroy() {
      cancel();
      node.removeEventListener('pointerdown', start);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', cancel);
      node.removeEventListener('pointerleave', cancel);
      node.removeEventListener('pointercancel', cancel);
    },
  };
}
