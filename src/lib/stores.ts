import { writable, derived } from 'svelte/store';
import { getAllCards } from './db';
import type { Card } from './types';

export const cards = writable<Card[]>([]);
export const query = writable('');

export async function loadCards() { cards.set(await getAllCards()); }

export const filtered = derived([cards, query], ([$cards, $q]) => {
  const q = $q.trim().toLowerCase();
  const list = q ? $cards.filter(c => c.storeName.toLowerCase().includes(q)) : $cards;
  return [...list].sort((a, b) =>
    Number(b.favorite) - Number(a.favorite) || a.order - b.order);
});
