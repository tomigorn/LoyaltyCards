// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDB, putCard, getCard, getAllCards, deleteCard,
         putImage, getImage, clearAll } from '../src/lib/db';
import type { Card } from '../src/lib/types';

const sample = (over: Partial<Card> = {}): Card => ({
  id: 'c1', storeName: 'Migros', barcodeValue: '7612345678900',
  barcodeFormat: 'ean13', brandColor: '#FF6600', logo: { source: 'generated' },
  notes: '', favorite: false, order: 0, createdAt: 1, updatedAt: 1, ...over,
});

describe('db', () => {
  beforeEach(async () => { await resetDB(); });

  it('stores and reads a card', async () => {
    await putCard(sample());
    expect((await getCard('c1'))?.storeName).toBe('Migros');
  });
  it('lists cards ordered by order asc', async () => {
    await putCard(sample({ id: 'a', order: 2 }));
    await putCard(sample({ id: 'b', order: 1 }));
    expect((await getAllCards()).map(c => c.id)).toEqual(['b', 'a']);
  });
  it('deletes a card', async () => {
    await putCard(sample());
    await deleteCard('c1');
    expect(await getCard('c1')).toBeUndefined();
  });
  it('stores and reads an image blob', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    await putImage('img1', blob);
    expect((await getImage('img1'))?.size).toBe(1);
  });
  it('clearAll empties both stores', async () => {
    await putCard(sample()); await putImage('i', new Blob(['y']));
    await clearAll();
    expect(await getAllCards()).toEqual([]);
    expect(await getImage('i')).toBeUndefined();
  });
});
