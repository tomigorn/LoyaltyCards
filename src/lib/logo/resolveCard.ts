import { resolveLogoUrl } from './resolve';
import { getImage, getLogo, putLogo, putLogoColor, getLogoColor } from '../db';
import { generateTile } from './tile';
import { logoDevFetcher } from './fetch';
import { extractDominantColor } from './color';
import { getAutoFetch } from '../settings';
import { findCatalogById } from '../catalog/catalog';
import type { Card, CatalogEntry } from '../types';

// Logos come from the store domain only — loyalty-program domains proved unreliable
// (e.g. cumulus.ch is an unrelated company), so we use the clean, correct store logo.
function domainsFor(id: string): string[] {
  const e = findCatalogById(id);
  return e ? [e.domain] : [];
}

export function resolveCardLogo(card: Card): Promise<string> {
  return resolveLogoUrl(card, {
    getImage, getLogo, putLogo, putLogoColor,
    makeObjectUrl: URL.createObjectURL,
    generateTile,
    fetchLogo: (d) => logoDevFetcher.fetchLogo(d),
    extractColor: extractDominantColor,
    autoFetchEnabled: getAutoFetch,
    domainsFor,
  });
}

const NEUTRAL = '#2a2a30';
const COLOR_FALLBACK = '#444444';   // value extractDominantColor returns when it finds nothing

/** Tile background colour. Priority:
 *  1) the user's own front card photo (the real card — most accurate),
 *  2) the curated store brand colour,
 *  3) the colour extracted from the store logo,
 *  4) the card's own colour / neutral. */
export async function resolveCardColor(card: Card): Promise<string> {
  // 1) front card photo
  if (card.frontPhotoRef) {
    const blob = await getImage(card.frontPhotoRef);
    if (blob) {
      try {
        const c = await extractDominantColor(blob);
        if (c && c !== COLOR_FALLBACK) return c;
      } catch { /* ignore */ }
    }
  }
  // 1b) a hand-picked logo blob — match the tile to it
  if (card.logo.blobRef) {
    const blob = await getImage(card.logo.blobRef);
    if (blob) {
      try {
        const c = await extractDominantColor(blob);
        if (c && c !== COLOR_FALLBACK) return c;
      } catch { /* ignore */ }
    }
  }
  // 2-3) curated store branding
  const e: CatalogEntry | undefined = card.catalogId ? findCatalogById(card.catalogId) : undefined;
  if (e) {
    if (e.brandColor) return e.brandColor;
    const c = await getLogoColor(e.domain);
    if (c) return c;
    return NEUTRAL;
  }
  // 4) non-catalog card
  return card.brandColor || NEUTRAL;
}
