import { describe, it, expect } from 'vitest';
import { toRemote, fromRemote } from './map';
import type { Card } from '../types';

const card: Card = {
  id: 'uuid1', storeName: 'Migros', barcodeValue: '76', barcodeFormat: 'ean13',
  brandColor: '#E30613', logo: { source: 'catalog', url: 'migros.ch' }, notes: 'n',
  favorite: true, order: 3, createdAt: 100, updatedAt: 200, lastUsedAt: 150,
  catalogId: 'ch-migros', tileColor: '#fff', bgColor: '#abcdef',
};

describe('sync mapping', () => {
  it('toRemote maps fields + flattens logo, omits photos', () => {
    const r = toRemote(card, 'owner1');
    expect(r).toMatchObject({
      owner: 'owner1', cardId: 'uuid1', storeName: 'Migros', barcodeValue: '76',
      barcodeFormat: 'ean13', brandColor: '#E30613', tileColor: '#fff', bgColor: '#abcdef',
      logoSource: 'catalog', logoUrl: 'migros.ch', catalogId: 'ch-migros',
      notes: 'n', favorite: true, order: 3, lastUsedAt: 150,
      clientCreatedAt: 100, clientUpdatedAt: 200, deleted: false,
    });
    expect('frontPhotoRef' in r).toBe(false);
  });
  it('fromRemote round-trips back to a Card', () => {
    const back = fromRemote(toRemote(card, 'o'));
    expect(back).toEqual(card);
  });
  it('fromRemote tolerates empty optionals', () => {
    const back = fromRemote({ ...toRemote({ ...card, tileColor: undefined, catalogId: undefined,
      lastUsedAt: undefined, bgColor: undefined, logo: { source: 'generated' } }, 'o') });
    expect(back.tileColor).toBeUndefined();
    expect(back.bgColor).toBeUndefined();
    expect(back.catalogId).toBeUndefined();
    expect(back.lastUsedAt).toBeUndefined();
    expect(back.logo).toEqual({ source: 'generated' });
  });
});
