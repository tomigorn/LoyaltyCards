import { describe, it, expect } from 'vitest';
import { downscaleImage, storeImage } from './image';
import { getImage } from './db';

describe('image util', () => {
  it('downscaleImage returns a blob and never throws (passthrough when no canvas)', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    const out = await downscaleImage(blob);
    expect(out).toBeInstanceOf(Blob);
  });

  it('downscaleImage leaves non-images untouched', async () => {
    const blob = new Blob(['x'], { type: 'application/octet-stream' });
    expect(await downscaleImage(blob)).toBe(blob);
  });

  it('storeImage stores the blob under a returned key', async () => {
    const blob = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/jpeg' });
    const key = await storeImage(blob);
    expect(typeof key).toBe('string');
    // NOTE: fake-indexeddb in jsdom doesn't reconstruct Blob, so just assert something was stored.
    expect(await getImage(key)).toBeDefined();
  });
});
