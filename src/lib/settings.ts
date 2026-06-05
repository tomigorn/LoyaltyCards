import type { SortMode } from './types';

const KEY = 'autoFetchLogos';
export function getAutoFetch(): boolean { return localStorage.getItem(KEY) !== '0'; }
export function setAutoFetch(on: boolean): void { localStorage.setItem(KEY, on ? '1' : '0'); }

const SORT_KEY = 'sortMode';
export function getSortMode(): SortMode {
  const v = localStorage.getItem(SORT_KEY);
  return (v === 'alpha' || v === 'added' || v === 'custom' || v === 'lastUsed') ? v : 'lastUsed';
}
export function setSortMode(m: SortMode): void { localStorage.setItem(SORT_KEY, m); }
