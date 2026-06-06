import { resolveLogoUrl } from './resolve';
import { getImage, getLogo, putLogo, putLogoColor, getLogoColor, getCard, putCard } from '../db';
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

// Cache the colour we extract from a local blob onto the card's synced `bgColor` field, so
// other devices (which don't have the photo/logo blob) render the same colour. Guarded so we
// persist at most once per card per session, and never clobber a concurrent edit.
const persistedBg = new Set<string>();
async function persistBg(card: Card, color: string): Promise<void> {
  if (card.bgColor === color || persistedBg.has(card.id)) return;
  persistedBg.add(card.id);
  try {
    const fresh = await getCard(card.id);
    if (fresh && fresh.bgColor !== color) await putCard({ ...fresh, bgColor: color, updatedAt: Date.now() });
  } catch { /* ignore */ }
}

/** Tile background colour. Priority:
 *  0) explicit user override (`tileColor`),
 *  1) the user's own front card photo (the real card — most accurate); cached to `bgColor`,
 *  1b) a hand-picked logo blob; cached to `bgColor`,
 *  2) a colour previously resolved & synced from another device (`bgColor`),
 *  3) the curated store brand colour / extracted store-logo colour,
 *  4) the card's own colour / neutral. */
export async function resolveCardColor(card: Card): Promise<string> {
  if (card.tileColor) return card.tileColor;
  // 1) front card photo (only present on the device that holds the blob)
  if (card.frontPhotoRef) {
    const blob = await getImage(card.frontPhotoRef);
    if (blob) {
      try {
        const c = await extractDominantColor(blob);
        if (c && c !== COLOR_FALLBACK) { await persistBg(card, c); return c; }
      } catch { /* ignore */ }
    }
  }
  // 1b) a hand-picked logo blob — match the tile to it
  if (card.logo.blobRef) {
    const blob = await getImage(card.logo.blobRef);
    if (blob) {
      try {
        const c = await extractDominantColor(blob);
        if (c && c !== COLOR_FALLBACK) { await persistBg(card, c); return c; }
      } catch { /* ignore */ }
    }
  }
  // 2) a previously-resolved colour synced from a device that had the blob
  if (card.bgColor) return card.bgColor;
  // 3) curated store branding (deterministic across devices)
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
