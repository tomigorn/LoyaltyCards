import { BARCODE_PREFIXES, type BarcodePrefix } from './prefixes';
import { learnedPrefixes } from './learned';
import { findCatalogById } from '../catalog/catalog';
import type { CatalogEntry } from '../types';

/** Returns the catalogId of the longest matching prefix, or undefined.
 *  Consults both the curated table and the user's self-learned prefixes (F5). */
export function detectBrandId(value: string, table?: BarcodePrefix[]): string | undefined {
  const candidates = table ?? [...BARCODE_PREFIXES, ...learnedPrefixes()];
  const digits = value.replace(/\D/g, '');
  let best: BarcodePrefix | undefined;
  for (const p of candidates) {
    if (digits.startsWith(p.prefix) && (!best || p.prefix.length > best.prefix.length)) best = p;
  }
  return best?.catalogId;
}

/** Resolve a barcode value to a catalog entry, if a known prefix matches. */
export function detectBrand(value: string): CatalogEntry | undefined {
  const id = detectBrandId(value);
  return id ? findCatalogById(id) : undefined;
}
