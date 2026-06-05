import { describe, it, expect } from 'vitest';
import { detectBrandId } from '../src/lib/barcode/detect';

const TABLE = [
  { prefix: '9900', catalogId: 'ch-migros' },
  { prefix: '990012', catalogId: 'ch-coop' },   // longer, more specific
];

describe('detectBrandId', () => {
  it('matches the longest prefix', () => {
    expect(detectBrandId('9900123456789', TABLE)).toBe('ch-coop');     // 990012 wins over 9900
  });
  it('matches a shorter prefix when the longer does not apply', () => {
    expect(detectBrandId('9900999999999', TABLE)).toBe('ch-migros');
  });
  it('returns undefined when nothing matches', () => {
    expect(detectBrandId('1234567890123', TABLE)).toBeUndefined();
  });
  it('ignores non-digits when matching', () => {
    expect(detectBrandId('9900-12-345', TABLE)).toBe('ch-coop');
  });
});
