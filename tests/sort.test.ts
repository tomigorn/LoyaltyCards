import { describe, it, expect } from 'vitest';
import { sortCards } from '../src/lib/sort';
import type { Card } from '../src/lib/types';

const mk = (o: Partial<Card>): Card => ({
  id: o.id!, storeName: o.storeName ?? 'X', barcodeValue: '1', barcodeFormat: 'code128',
  brandColor: '#333', logo: { source: 'generated' }, notes: '',
  favorite: o.favorite ?? false, order: o.order ?? 0,
  createdAt: o.createdAt ?? 0, updatedAt: 0, lastUsedAt: o.lastUsedAt,
});

describe('sortCards', () => {
  it('alpha: A→Z by name, favorites pinned first', () => {
    const out = sortCards([
      mk({ id: 'c', storeName: 'Coop' }),
      mk({ id: 'a', storeName: 'Aldi' }),
      mk({ id: 'm', storeName: 'Migros', favorite: true }),
    ], 'alpha');
    expect(out.map(c => c.id)).toEqual(['m', 'a', 'c']); // fav first, then A→Z
  });
  it('added: newest createdAt first (favorites pinned)', () => {
    const out = sortCards([
      mk({ id: 'old', createdAt: 1 }),
      mk({ id: 'new', createdAt: 5 }),
    ], 'added');
    expect(out.map(c => c.id)).toEqual(['new', 'old']);
  });
  it('lastUsed: highest lastUsedAt first, falling back to createdAt', () => {
    const out = sortCards([
      mk({ id: 'a', createdAt: 1, lastUsedAt: 10 }),
      mk({ id: 'b', createdAt: 2 }),            // no lastUsedAt → uses createdAt=2
      mk({ id: 'c', createdAt: 1, lastUsedAt: 50 }),
    ], 'lastUsed');
    expect(out.map(c => c.id)).toEqual(['c', 'a', 'b']);
  });
  it('custom: by order asc, favorites NOT pinned', () => {
    const out = sortCards([
      mk({ id: 'x', order: 2, favorite: true }),
      mk({ id: 'y', order: 1 }),
      mk({ id: 'z', order: 0 }),
    ], 'custom');
    expect(out.map(c => c.id)).toEqual(['z', 'y', 'x']);
  });
  it('does not mutate the input array', () => {
    const input = [mk({ id: 'a', storeName: 'B' }), mk({ id: 'b', storeName: 'A' })];
    const copy = [...input];
    sortCards(input, 'alpha');
    expect(input.map(c => c.id)).toEqual(copy.map(c => c.id));
  });
});
