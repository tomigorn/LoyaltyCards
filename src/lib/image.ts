import { putImage } from './db';

/** Downscale a raster image so its longest side is ≤ maxDim, re-encoded as JPEG to keep card
 *  photos small (local storage + sync payloads). Returns the original blob unchanged if it
 *  can't be decoded (e.g. SVG, or no canvas available), so it's always safe to call. */
export async function downscaleImage(blob: Blob, maxDim = 1600, quality = 0.85): Promise<Blob> {
  if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml') return blob;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return blob; // no decoder / no canvas (e.g. test env) — store as-is
  }
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    if (scale === 1 && blob.type === 'image/jpeg') return blob; // already small enough
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    return out ?? blob;
  } finally {
    bitmap.close?.();
  }
}

/** Downscale + store an image blob in IndexedDB; returns its generated key. */
export async function storeImage(blob: Blob): Promise<string> {
  const small = await downscaleImage(blob);
  const key = crypto.randomUUID();
  await putImage(key, small);
  return key;
}
