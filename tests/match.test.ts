import { describe, it, expect } from 'vitest';
import { normalize, matchShop } from '../src/lib/catalog/match';

describe('normalize', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalize('  Décathlon! ')).toBe('decathlon');
    expect(normalize('E.Leclerc')).toBe('eleclerc');
  });
});

describe('matchShop', () => {
  it('returns exact name match first', () => {
    expect(matchShop('migros')[0].name).toBe('Migros');
  });
  it('matches a prefix', () => {
    expect(matchShop('mig').some(e => e.name === 'Migros')).toBe(true);
  });
  it('matches an alias', () => {
    expect(matchShop('cumulus')[0].name).toBe('Migros');
  });
  it('tolerates a typo via similarity', () => {
    expect(matchShop('migors').some(e => e.name === 'Migros')).toBe(true);
  });
  it('returns at most `limit` results', () => {
    expect(matchShop('co', 3).length).toBeLessThanOrEqual(3);
  });
  it('returns [] for empty query', () => {
    expect(matchShop('')).toEqual([]);
  });
});
