import { describe, it, expect } from 'vitest';
import { findCatalogEntry } from '../src/lib/catalog/catalog';

describe('findCatalogEntry', () => {
  it('matches by name case-insensitively', () => {
    expect(findCatalogEntry('migros')?.name).toBe('Migros');
  });
  it('matches by alias', () => {
    expect(findCatalogEntry('coop city')?.name).toBe('Coop');
  });
  it('returns undefined when unknown', () => {
    expect(findCatalogEntry('nonexistent store')).toBeUndefined();
  });
});
