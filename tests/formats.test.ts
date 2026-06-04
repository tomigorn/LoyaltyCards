import { describe, it, expect } from 'vitest';
import { validateBarcode, FORMATS } from '../src/lib/barcode/formats';

describe('validateBarcode', () => {
  it('lists all 12 supported formats', () => { expect(FORMATS.length).toBe(12); });
  it('accepts a valid EAN-13 (correct checksum)', () => {
    expect(validateBarcode('ean13', '7612345678900').ok).toBe(true);
  });
  it('rejects EAN-13 with wrong length', () => {
    expect(validateBarcode('ean13', '123').ok).toBe(false);
  });
  it('rejects EAN-13 with bad checksum', () => {
    expect(validateBarcode('ean13', '7612345678901').ok).toBe(false);
  });
  it('accepts EAN-8 valid checksum', () => {
    expect(validateBarcode('ean8', '96385074').ok).toBe(true);
  });
  it('accepts any non-empty value for code128/qr', () => {
    expect(validateBarcode('code128', 'ABC-123').ok).toBe(true);
    expect(validateBarcode('qr', 'https://x').ok).toBe(true);
  });
  it('rejects empty value for any format', () => {
    expect(validateBarcode('qr', '').ok).toBe(false);
  });
});
