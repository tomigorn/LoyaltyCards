import { describe, it, expect } from 'vitest';
import { mapDetectedFormat } from './scan';

describe('mapDetectedFormat', () => {
  it('maps detector format strings to our BarcodeFormat', () => {
    expect(mapDetectedFormat('qr_code')).toBe('qr');
    expect(mapDetectedFormat('ean_13')).toBe('ean13');
    expect(mapDetectedFormat('code_128')).toBe('code128');
  });
  it('returns undefined for unknown formats', () => {
    expect(mapDetectedFormat('totally_unknown')).toBeUndefined();
  });
});
