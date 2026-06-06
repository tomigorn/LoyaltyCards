import { get } from 'svelte/store';
import { isLoggedIn } from '../auth/store';
import { pb } from '../auth/client';
import { setMutationHook } from '../db';
import { loadCards, sortMode, setSortHook, applySortMode } from '../stores';
import type { SortMode } from '../types';
import { enqueue } from './queue';
import { push, pull, adoptLocalCards, subscribeRealtime, unsubscribeRealtime, isApplyingRemote } from './engine';

let started = false;
let syncing = false;
let userUnsub: (() => void) | null = null;

function isValidSort(v: unknown): v is SortMode {
  return v === 'lastUsed' || v === 'alpha' || v === 'added' || v === 'custom';
}
function authRecord() {
  return pb.authStore.record as ({ id: string; sortMode?: string } | null);
}

// Push the global sort preference to the account record (skip if unchanged).
function pushSortMode(m: SortMode) {
  const rec = authRecord();
  if (!rec || rec.sortMode === m) return;
  pb.collection('users').update(rec.id, { sortMode: m }).then(() => { rec.sortMode = m; }).catch(() => {});
}
// Apply the account's sort mode locally (without pushing it back).
function applyServerSort(value?: unknown) {
  const m = value ?? authRecord()?.sortMode;
  if (isValidSort(m) && get(sortMode) !== m) applySortMode(m);
}

async function fullSync() {
  if (syncing || !get(isLoggedIn)) return;
  syncing = true;
  try {
    try { await pb.collection('users').authRefresh(); applyServerSort(); } catch { /* offline — retry later */ }
    await push();
    await pull();
    await loadCards();
  } finally {
    syncing = false;
  }
}

/** Call once at app startup. Idempotent. */
export function startSync() {
  if (started) return; started = true;

  // Local card mutations enqueue (unless they are us applying a remote change).
  setMutationHook((m) => {
    if (isApplyingRemote() || !get(isLoggedIn)) return;
    enqueue({ cardId: m.kind === 'put' ? m.card.id : m.id, kind: m.kind === 'put' ? 'put' : 'delete' })
      .then(() => { if (navigator.onLine) push(); });
  });

  // Push the global sort preference when the user changes it.
  setSortHook((m) => { if (get(isLoggedIn)) pushSortMode(m); });

  // React to login/logout.
  isLoggedIn.subscribe(async (in_) => {
    if (in_) {
      try { await pb.collection('users').authRefresh(); } catch { /* offline */ }
      const rec = authRecord();
      if (isValidSort(rec?.sortMode)) applyServerSort();   // the account's preference wins
      else if (rec) pushSortMode(get(sortMode));           // first login: seed the account
      await adoptLocalCards();
      await fullSync();
      await subscribeRealtime();
      // Live sort-mode updates from this account's other devices.
      if (rec && !userUnsub) {
        userUnsub = await pb.collection('users').subscribe(rec.id, (e: { record?: { sortMode?: string } }) => {
          const m = e.record?.sortMode;
          if (isValidSort(m)) { const r = authRecord(); if (r) r.sortMode = m; applyServerSort(m); }
        });
      }
    } else {
      unsubscribeRealtime();
      if (userUnsub) { userUnsub(); userUnsub = null; }
    }
  });

  // Flush + pull when connectivity returns or the app regains focus.
  window.addEventListener('online', fullSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fullSync(); });
}
