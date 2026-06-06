import { describe, it, expect } from 'vitest';
import { toRemote, fromRemote } from './map';
import type { Card } from '../types';

const card: Card = {
  id: 'uuid1', storeName: 'Migros', barcodeValue: '76', barcodeFormat: 'ean13',
  brandColor: '#E30613', logo: { source: 'uploaded', url: 'migros.ch', blobRef: 'lb1' }, notes: 'n',
  favorite: true, order: 3, createdAt: 100, updatedAt: 200, lastUsedAt: 150,
  catalogId: 'ch-migros', tileColor: '#fff', bgColor: '#abcdef',
  frontPhotoRef: 'fp1', backPhotoRef: 'bp1',
};

describe('sync mapping', () => {
  it('toRemote maps fields + the image REFs (not the blobs)', () => {
    const r = toRemote(card, 'owner1');
    expect(r).toMatchObject({
      owner: 'owner1', cardId: 'uuid1', storeName: 'Migros', barcodeValue: '76',
      barcodeFormat: 'ean13', brandColor: '#E30613', tileColor: '#fff', bgColor: '#abcdef',
      logoSource: 'uploaded', logoUrl: 'migros.ch', catalogId: 'ch-migros',
      frontPhotoRef: 'fp1', backPhotoRef: 'bp1', logoBlobRef: 'lb1',
      notes: 'n', favorite: true, order: 3, lastUsedAt: 150,
      clientCreatedAt: 100, clientUpdatedAt: 200, deleted: false,
    });
    // the binary file fields are NOT part of the JSON mapping (the engine handles uploads)
    expect('frontPhoto' in r).toBe(false);
    expect('logoImage' in r).toBe(false);
  });
  it('fromRemote round-trips back to a Card', () => {
    const back = fromRemote(toRemote(card, 'o'));
    expect(back).toEqual(card);
  });
  it('fromRemote tolerates empty optionals', () => {
    const back = fromRemote({ ...toRemote({ ...card, tileColor: undefined, catalogId: undefined,
      lastUsedAt: undefined, bgColor: undefined, frontPhotoRef: undefined, backPhotoRef: undefined,
      logo: { source: 'generated' } }, 'o') });
    expect(back.tileColor).toBeUndefined();
    expect(back.bgColor).toBeUndefined();
    expect(back.catalogId).toBeUndefined();
    expect(back.lastUsedAt).toBeUndefined();
    expect(back.frontPhotoRef).toBeUndefined();
    expect(back.backPhotoRef).toBeUndefined();
    expect(back.logo).toEqual({ source: 'generated' });
  });
});
