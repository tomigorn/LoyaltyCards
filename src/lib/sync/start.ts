import { get } from 'svelte/store';
import { isLoggedIn } from '../auth/store';
import { setMutationHook } from '../db';
import { loadCards } from '../stores';
import { enqueue } from './queue';
import { push, pull, adoptLocalCards, subscribeRealtime, unsubscribeRealtime, isApplyingRemote } from './engine';

let started = false;
let syncing = false;

async function fullSync() {
  if (syncing || !get(isLoggedIn)) return;
  syncing = true;
  try { await push(); await pull(); await loadCards(); } finally { syncing = false; }
}

/** Call once at app startup. Idempotent. */
export function startSync() {
  if (started) return; started = true;

  // Local mutations enqueue (unless they are us applying a remote change).
  setMutationHook((m) => {
    if (isApplyingRemote() || !get(isLoggedIn)) return;
    enqueue({ cardId: m.kind === 'put' ? m.card.id : m.id, kind: m.kind === 'put' ? 'put' : 'delete' })
      .then(() => { if (navigator.onLine) push(); });
  });

  // React to login/logout.
  isLoggedIn.subscribe(async (in_) => {
    if (in_) { await adoptLocalCards(); await fullSync(); await subscribeRealtime(); }
    else { unsubscribeRealtime(); }
  });

  // Flush + pull when connectivity returns or the app regains focus.
  window.addEventListener('online', fullSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fullSync(); });
}
