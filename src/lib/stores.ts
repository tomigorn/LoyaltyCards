import { writable, derived } from 'svelte/store';
import { getAllCards } from './db';
import type { Card, SortMode } from './types';
import { sortCards } from './sort';
import { getSortMode, setSortMode } from './settings';

export const cards = writable<Card[]>([]);
export const query = writable('');
export const sortMode = writable<SortMode>(getSortMode());

export async function loadCards() { cards.set(await getAllCards()); }

// Notified when the user changes the sort mode, so sync can push it to the account.
let sortHook: ((m: SortMode) => void) | null = null;
export function setSortHook(fn: ((m: SortMode) => void) | null) { sortHook = fn; }

/** User-initiated sort change: persist locally + notify sync to push it. */
export function setSort(m: SortMode) { setSortMode(m); sortMode.set(m); sortHook?.(m); }

/** Apply a sort mode that came FROM sync — persist locally without pushing it back. */
export function applySortMode(m: SortMode) { setSortMode(m); sortMode.set(m); }

export const filtered = derived([cards, query, sortMode], ([$cards, $q, $mode]) => {
  const q = $q.trim().toLowerCase();
  const list = q ? $cards.filter(c => c.storeName.toLowerCase().includes(q)) : $cards;
  return sortCards(list, $mode);
});
