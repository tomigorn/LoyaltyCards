import { writable, derived } from 'svelte/store';
import { getAllCards } from './db';
import type { Card, SortMode } from './types';
import { sortCards } from './sort';
import { getSortMode, setSortMode } from './settings';

export const cards = writable<Card[]>([]);
export const query = writable('');
export const sortMode = writable<SortMode>(getSortMode());

export async function loadCards() { cards.set(await getAllCards()); }

export function setSort(m: SortMode) { setSortMode(m); sortMode.set(m); }

export const filtered = derived([cards, query, sortMode], ([$cards, $q, $mode]) => {
  const q = $q.trim().toLowerCase();
  const list = q ? $cards.filter(c => c.storeName.toLowerCase().includes(q)) : $cards;
  return sortCards(list, $mode);
});
