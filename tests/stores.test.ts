import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { cards, query, filtered, loadCards } from '../src/lib/stores';
import { resetDB, putCard } from '../src/lib/db';
import type { Card } from '../src/lib/types';

const mk = (id: string, name: string): Card => ({
  id, storeName: name, barcodeValue: '1', barcodeFormat: 'code128',
  brandColor: '#333', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt: 1,
});

describe('stores', () => {
  beforeEach(async () => { await resetDB(); query.set(''); });
  it('loadCards populates the cards store', async () => {
    await putCard(mk('a', 'Migros')); await loadCards();
    expect(get(cards).length).toBe(1);
  });
  it('filtered narrows by query (case-insensitive)', async () => {
    await putCard(mk('a', 'Migros')); await putCard(mk('b', 'Coop'));
    await loadCards(); query.set('co');
    expect(get(filtered).map(c => c.storeName)).toEqual(['Coop']);
  });
});
