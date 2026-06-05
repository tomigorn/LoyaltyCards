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
  it('uses a dark shade (not grey fallback) for black-on-white logos', () => {
    // 2 black (text) + 2 white (background) → white ignored, black kept
    const px = new Uint8ClampedArray([0,0,0,255, 0,0,0,255, 255,255,255,255, 255,255,255,255]);
    expect(dominantHexFromPixels(px)).toBe('#000000');
  });
  it('prefers a saturated brand colour over more-frequent black text', () => {
    const px = new Uint8ClampedArray([
      255,102,0,255, 255,102,0,255, 255,102,0,255,   // 3 orange (saturated)
      0,0,0,255, 0,0,0,255, 0,0,0,255, 0,0,0,255, 0,0,0,255, // 5 black
    ]);
    expect(dominantHexFromPixels(px)).toBe('#ff6600');
  });
});
