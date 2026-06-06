import type { Card, LogoSource } from '../types';

export interface RemoteCardData {
  owner: string; cardId: string; storeName: string; barcodeValue: string; barcodeFormat: string;
  brandColor: string; tileColor: string; bgColor: string; logoSource: string; logoUrl: string; catalogId: string;
  notes: string; favorite: boolean; order: number; lastUsedAt: number;
  clientCreatedAt: number; clientUpdatedAt: number; deleted: boolean;
}

export function toRemote(card: Card, owner: string): RemoteCardData {
  return {
    owner, cardId: card.id, storeName: card.storeName, barcodeValue: card.barcodeValue,
    barcodeFormat: card.barcodeFormat, brandColor: card.brandColor, tileColor: card.tileColor ?? '',
    bgColor: card.bgColor ?? '',
    logoSource: card.logo.source, logoUrl: card.logo.url ?? '', catalogId: card.catalogId ?? '',
    notes: card.notes, favorite: card.favorite, order: card.order, lastUsedAt: card.lastUsedAt ?? 0,
    clientCreatedAt: card.createdAt, clientUpdatedAt: card.updatedAt, deleted: false,
  };
}

export function fromRemote(r: RemoteCardData | (Partial<RemoteCardData> & Record<string, unknown>)): Card {
  return {
    id: String(r.cardId), storeName: String(r.storeName ?? ''), barcodeValue: String(r.barcodeValue ?? ''),
    barcodeFormat: (r.barcodeFormat as Card['barcodeFormat']) ?? 'code128',
    brandColor: String(r.brandColor ?? '#444'),
    logo: { source: (r.logoSource as LogoSource) || 'generated', url: r.logoUrl ? String(r.logoUrl) : undefined },
    notes: String(r.notes ?? ''), favorite: !!r.favorite, order: Number(r.order ?? 0),
    createdAt: Number(r.clientCreatedAt ?? 0), updatedAt: Number(r.clientUpdatedAt ?? 0),
    lastUsedAt: r.lastUsedAt ? Number(r.lastUsedAt) : undefined,
    catalogId: r.catalogId ? String(r.catalogId) : undefined,
    tileColor: r.tileColor ? String(r.tileColor) : undefined,
    bgColor: r.bgColor ? String(r.bgColor) : undefined,
  };
}
