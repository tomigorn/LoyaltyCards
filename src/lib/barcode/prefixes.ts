import type { CatalogEntry } from '../types';

/** Maps a known loyalty-card barcode PREFIX (leading digits) to a catalog entry id.
 *  Extensible + curated: starts small and grows. We do NOT invent prefixes — only add
 *  ones with reasonable confidence. A no-match is the safe default. */
export interface BarcodePrefix { prefix: string; catalogId: string; }
export const BARCODE_PREFIXES: BarcodePrefix[] = [
  // (Seed conservatively. If you are not confident about a real prefix, leave this small or empty.)
];
