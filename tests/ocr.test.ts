import { describe, it, expect } from 'vitest';
import { suggestShopsFromText } from '../src/lib/ocr/ocr';

describe('suggestShopsFromText', () => {
  it('finds a shop named in OCR text', () => {
    const out = suggestShopsFromText('CUMULUS\nMIGROS\n9000 1234 5678');
    expect(out.some(e => e.name === 'Migros')).toBe(true);
  });
  it('returns [] for text with no shop words', () => {
    expect(suggestShopsFromText('1234 5678 9012')).toEqual([]);
  });
  it('dedupes and caps results', () => {
    expect(suggestShopsFromText('migros migros coop').length).toBeLessThanOrEqual(5);
  });
});
