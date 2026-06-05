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

export async function totpRequired(identity: string): Promise<boolean> {
  const res = await pb.send('/api/loyalty/totp/required', { method: 'POST', body: { identity } });
  return !!(res as { required?: boolean }).required;
}

/** Log in with username/email + password. If the account has 2FA, a `code` is required and
 *  the request goes through the custom TOTP login route (which the backend's guard enforces). */
export async function loginPassword(identity: string, password: string, code?: string): Promise<void> {
  if (await totpRequired(identity)) {
    const res = await pb.send('/api/loyalty/totp/login', {
      method: 'POST',
      body: { identity, password, code: code ?? '' },
    });
    const r = res as { token: string; record: any };
    pb.authStore.save(r.token, r.record);
  } else {
    await pb.collection(USERS).authWithPassword(identity, password);
  }
}

export async function loginGoogle(): Promise<void> {
  await pb.collection(USERS).authWithOAuth2({ provider: 'google' });
}

export async function signup(email: string, password: string): Promise<void> {
  await pb.collection(USERS).create({ email, password, passwordConfirm: password });
  await pb.collection(USERS).authWithPassword(email, password);
}
