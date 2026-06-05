import { describe, it, expect } from 'vitest';
import { findCatalogEntry, displayName } from '../src/lib/catalog/catalog';
import type { CatalogEntry } from '../src/lib/types';

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

describe('displayName', () => {
  const base: CatalogEntry = { id: 'x', name: 'Migros', aliases: [], domain: 'migros.ch', country: 'CH' };
  it('combines store and program when a program exists', () => {
    expect(displayName({ ...base, program: 'Cumulus' })).toBe('Migros Cumulus');
  });
  it('falls back to the store name when there is no program', () => {
    expect(displayName(base)).toBe('Migros');
  });
});

describe('catalog has program data', () => {
  it('Migros has the Cumulus program', () => {
    expect(findCatalogEntry('migros')?.program).toBe('Cumulus');
  });
});
