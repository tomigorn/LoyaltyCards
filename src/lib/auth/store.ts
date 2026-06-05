import { writable, derived, type Readable } from 'svelte/store';
import { pb, USERS } from './client';

export interface Account { id: string; email: string; username?: string; }

function currentRecord(): Account | null {
  const r = pb.authStore.record as any;
  return r ? { id: r.id, email: r.email, username: r.username } : null;
}

export const account = writable<Account | null>(currentRecord());
pb.authStore.onChange(() => account.set(currentRecord()));

export const isLoggedIn: Readable<boolean> = derived(account, (a) => a !== null);

/** Validate/extend a persisted token at startup. Offline-tolerant: only a hard auth
 *  failure clears the session; a network error leaves the user logged in to retry later. */
export async function refreshSession(): Promise<void> {
  if (!pb.authStore.isValid) return;
  try {
    await pb.collection(USERS).authRefresh();
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 403) pb.authStore.clear();
    // otherwise (network/5xx): keep the session and retry on next launch
  }
}

export function logout(): void {
  pb.authStore.clear();
}
