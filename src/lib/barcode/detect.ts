import { BARCODE_PREFIXES, type BarcodePrefix } from './prefixes';
import { findCatalogById } from '../catalog/catalog';
import type { CatalogEntry } from '../types';

/** Returns the catalogId of the longest matching prefix, or undefined. */
export function detectBrandId(value: string, table: BarcodePrefix[] = BARCODE_PREFIXES): string | undefined {
  const digits = value.replace(/\D/g, '');
  let best: BarcodePrefix | undefined;
  for (const p of table) {
    if (digits.startsWith(p.prefix) && (!best || p.prefix.length > best.prefix.length)) best = p;
  }
  return best?.catalogId;
}

/** Resolve a barcode value to a catalog entry, if a known prefix matches. */
export function detectBrand(value: string): CatalogEntry | undefined {
  const id = detectBrandId(value);
  return id ? findCatalogById(id) : undefined;
}
