import { getAllPrefixes, putPrefix } from '../db';
import type { BarcodePrefix } from './prefixes';

// Self-learning brand detection (F5). There is no reliable public dataset of loyalty-card
// barcode prefixes, so instead of shipping guesses we learn from the user's OWN confirmed
// cards: when a card is saved with a known shop, we remember that barcode's leading digits
// → catalogId. A later scan of a card sharing those digits (a second/replacement card, a
// partner's card from the same retailer) then auto-suggests the brand. Fully local & private.

// How many leading digits identify a retailer. Long enough that two different brands almost
// never collide (a GS1 company prefix is ~7+ digits), short enough that all of one retailer's
// cards share it.
const PREFIX_LEN = 8;
// Don't learn from numbers too short to carry a meaningful company prefix.
const MIN_DIGITS = 7;

let cache: BarcodePrefix[] = [];

/** Leading-digit key for a barcode value, or '' if it's too short to be useful. */
export function prefixOf(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < MIN_DIGITS) return '';
  return digits.slice(0, PREFIX_LEN);
}

/** Load persisted learned prefixes into memory. Call once at startup. */
export async function loadLearnedPrefixes(): Promise<void> {
  cache = await getAllPrefixes();
}

/** The in-memory learned table, consulted synchronously by detect(). */
export function learnedPrefixes(): BarcodePrefix[] {
  return cache;
}

/** Remember that a barcode belongs to a catalog brand. No-op for short numbers. */
export async function rememberPrefix(value: string, catalogId: string): Promise<void> {
  const prefix = prefixOf(value);
  if (!prefix) return;
  const existing = cache.find((p) => p.prefix === prefix);
  if (existing) {
    if (existing.catalogId === catalogId) return; // already known
    existing.catalogId = catalogId;               // re-point to the latest confirmed brand
  } else {
    cache.push({ prefix, catalogId });
  }
  await putPrefix(prefix, catalogId);
}
