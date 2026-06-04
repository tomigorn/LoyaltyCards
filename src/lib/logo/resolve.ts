import type { Card } from '../types';

export interface ResolveDeps {
  getImage: (key: string) => Promise<Blob | undefined>;
  makeObjectUrl: (blob: Blob) => string;
  generateTile: (name: string, color: string) => string;
}

/** Resolve a card to a displayable logo URL.
 *  uploaded/fetched/catalog → stored blob; otherwise → generated tile. */
export async function resolveLogoUrl(card: Card, deps: ResolveDeps): Promise<string> {
  if (card.logo.blobRef) {
    const blob = await deps.getImage(card.logo.blobRef);
    if (blob) return deps.makeObjectUrl(blob);
  }
  return deps.generateTile(card.storeName, card.brandColor);
}
