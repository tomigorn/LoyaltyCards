export interface LongpressParams {
  duration?: number;
  onlongpress?: () => void;
}

/** Svelte action: calls `onlongpress` callback (or dispatches a `longpress` CustomEvent) after
 *  `duration` ms of holding, cancelled if the pointer moves too far or is released early. */
export function longpress(node: HTMLElement, params: LongpressParams | number = 500) {
  let duration = typeof params === 'number' ? params : (params.duration ?? 500);
  let cb: (() => void) | undefined = typeof params === 'number' ? undefined : params.onlongpress;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sx = 0, sy = 0;
  const start = (e: PointerEvent) => {
    sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => {
      if (cb) cb();
      else node.dispatchEvent(new CustomEvent('longpress'));
    }, duration);
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
    update(newParams: LongpressParams | number) {
      duration = typeof newParams === 'number' ? newParams : (newParams.duration ?? duration);
      cb = typeof newParams === 'number' ? undefined : newParams.onlongpress;
    },
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
