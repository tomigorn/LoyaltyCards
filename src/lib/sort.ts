import type { Card, SortMode } from './types';

export function sortCards(cards: Card[], mode: SortMode): Card[] {
  const list = [...cards];
  if (mode === 'custom') return list.sort((a, b) => a.order - b.order);
  const favFirst = (a: Card, b: Card) => Number(b.favorite) - Number(a.favorite);
  const key = (c: Card) => mode === 'lastUsed' ? (c.lastUsedAt ?? c.createdAt) : c.createdAt;
  return list.sort((a, b) =>
    favFirst(a, b) || (
      mode === 'alpha' ? a.storeName.localeCompare(b.storeName)
      : key(b) - key(a)   // lastUsed & added: descending (newest/most-recent first)
    ));
}
