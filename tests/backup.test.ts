// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { exportBackup, importBackup } from '../src/lib/backup';
import { resetDB, putCard, putImage, getAllCards, getImage } from '../src/lib/db';
import type { Card } from '../src/lib/types';

const card: Card = {
  id: 'c1', storeName: 'Migros', barcodeValue: '7612345678900', barcodeFormat: 'ean13',
  brandColor: '#FF6600', logo: { source: 'uploaded', blobRef: 'img1' }, notes: 'hi',
  favorite: true, order: 0, createdAt: 1, updatedAt: 1,
};

describe('backup', () => {
  beforeEach(async () => { await resetDB(); });
  it('round-trips cards and images through export→import (replace)', async () => {
    await putCard(card);
    await putImage('img1', new Blob(['PNGDATA'], { type: 'image/png' }));
    const json = await exportBackup();
    await resetDB();
    await importBackup(json, 'replace');
    expect((await getAllCards())[0].storeName).toBe('Migros');
    expect((await getImage('img1'))?.size).toBe(7);
  });
});
