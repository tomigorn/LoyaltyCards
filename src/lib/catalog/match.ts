import { CATALOG } from './data';
import type { CatalogEntry } from '../types';

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase().replace(/[^a-z0-9]/g, '');               // drop punctuation/space
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

// Sørensen–Dice coefficient on bigrams (0..1)
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a), B = bigrams(b);
  const bMap = new Map<string, number>();
  for (const g of B) bMap.set(g, (bMap.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of A) { const c = bMap.get(g) ?? 0; if (c > 0) { inter++; bMap.set(g, c - 1); } }
  return (2 * inter) / (A.length + B.length);
}

function score(qn: string, e: CatalogEntry): number {
  const names = [e.name, ...e.aliases].map(normalize);
  let best = 0;
  for (const n of names) {
    if (n === qn) return 1;                  // exact
    if (n.startsWith(qn)) best = Math.max(best, 0.9);
    else if (n.includes(qn)) best = Math.max(best, 0.75);
    best = Math.max(best, dice(qn, n) * 0.8); // fuzzy, capped below substring
  }
  return best;
}

export function matchShop(query: string, limit = 5): CatalogEntry[] {
  const qn = normalize(query);
  if (!qn) return [];
  return CATALOG
    .map(e => ({ e, s: score(qn, e) }))
    .filter(x => x.s >= 0.3)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.e);
}
