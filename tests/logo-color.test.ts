import { describe, it, expect } from 'vitest';
import { dominantHexFromPixels } from '../src/lib/logo/color';

describe('dominantHexFromPixels', () => {
  it('ignores transparent pixels and returns the most common opaque colour', () => {
    // 3 pixels: red opaque, red opaque, transparent
    const px = new Uint8ClampedArray([255,0,0,255, 255,0,0,255, 0,0,0,0]);
    expect(dominantHexFromPixels(px)).toBe('#ff0000');
  });
  it('falls back to a neutral when all transparent', () => {
    expect(dominantHexFromPixels(new Uint8ClampedArray([0,0,0,0]))).toBe('#444444');
  });
});
