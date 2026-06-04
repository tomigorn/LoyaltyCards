import { describe, it, expect } from 'vitest';
import { mapDetectedFormat } from '../src/lib/barcode/scan';

describe('mapDetectedFormat', () => {
  it('maps BarcodeDetector format strings to ours', () => {
    expect(mapDetectedFormat('ean_13')).toBe('ean13');
    expect(mapDetectedFormat('qr_code')).toBe('qr');
    expect(mapDetectedFormat('upc_a')).toBe('upca');
    expect(mapDetectedFormat('code_128')).toBe('code128');
  });
  it('returns undefined for unsupported', () => {
    expect(mapDetectedFormat('unknown')).toBeUndefined();
  });
});
