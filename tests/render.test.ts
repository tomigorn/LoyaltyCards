import { describe, it, expect } from 'vitest';
import { toBwipId } from '../src/lib/barcode/render';

describe('toBwipId', () => {
  it('maps our formats to bwip-js bcids', () => {
    expect(toBwipId('ean13')).toBe('ean13');
    expect(toBwipId('upca')).toBe('upca');
    expect(toBwipId('qr')).toBe('qrcode');
    expect(toBwipId('datamatrix')).toBe('datamatrix');
    expect(toBwipId('code128')).toBe('code128');
    expect(toBwipId('itf')).toBe('interleaved2of5');
  });
});
