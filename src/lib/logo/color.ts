const FALLBACK = '#444444';

/** Reduce RGBA pixels to a tile colour.
 *  Prefers the most frequent *saturated* (brand) colour; if a logo is purely
 *  black/white (no saturated colour), uses its dominant dark shade instead of a
 *  flat grey fallback. Near-white pixels (logo backgrounds) are ignored. */
export function dominantHexFromPixels(px: Uint8ClampedArray): string {
  const chroma = new Map<string, number>();   // saturated brand colours
  const dark = new Map<string, number>();     // dark/achromatic (e.g. black wordmarks)
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;                       // transparent
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r > 240 && g > 240 && b > 240) continue;          // near-white background
    const key = `${r},${g},${b}`;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat > 24) chroma.set(key, (chroma.get(key) ?? 0) + 1);
    else if (r < 110 && g < 110 && b < 110) dark.set(key, (dark.get(key) ?? 0) + 1);
  }
  const pick = (m: Map<string, number>) => {
    let best = '', n = 0;
    for (const [k, c] of m) if (c > n) { n = c; best = k; }
    return best;
  };
  const best = pick(chroma) || pick(dark);   // saturated wins over dark text
  if (!best) return FALLBACK;
  const [r, g, b] = best.split(',').map(Number);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Decode a logo Blob and extract its dominant colour (browser only). */
export async function extractDominantColor(blob: Blob): Promise<string> {
  try {
    const bmp = await createImageBitmap(blob);
    const size = 24;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0, size, size);
    return dominantHexFromPixels(ctx.getImageData(0, 0, size, size).data);
  } catch { return FALLBACK; }
}
