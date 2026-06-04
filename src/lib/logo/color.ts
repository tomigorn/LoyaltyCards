const FALLBACK = '#444444';

/** Reduce RGBA pixels to the most frequent opaque colour (quantised), as hex. */
export function dominantHexFromPixels(px: Uint8ClampedArray): string {
  const counts = new Map<string, number>();
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 200) continue;                       // skip transparent/near-transparent
    // quantise to 5 bits/channel to group similar shades
    const rq = px[i] & 0xf8, gq = px[i + 1] & 0xf8, bq = px[i + 2] & 0xf8;
    // skip near-white and near-black (logos on white bg / outlines)
    if (rq > 240 && gq > 240 && bq > 240) continue;
    if (rq < 16 && gq < 16 && bq < 16) continue;
    // use original values as key so we report the actual pixel colour
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const key = `${r},${g},${b}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = '', bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k; }
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
