import { describe, it, expect } from 'vitest';
import { initials } from '../src/lib/logo/tile';

describe('initials', () => {
  it('takes up to two leading letters of words', () => {
    expect(initials('Migros')).toBe('M');
    expect(initials('Coop City')).toBe('CC');
    expect(initials('  digitec galaxus ')).toBe('DG');
  });
  it('falls back to ? for empty', () => { expect(initials('')).toBe('?'); });
});
