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

const OAUTH_PENDING = 'pb_oauth_pending';

// The callback Google returns the user to. MUST exactly match an "Authorized redirect URI"
// registered on the Google OAuth client, and the value passed to authWithOAuth2Code below.
function oauthRedirectUrl(): string {
  return window.location.origin + '/';
}

/** Start Google sign-in via a full-page redirect (reliable in installed PWAs, unlike popups).
 *  We stash the PKCE verifier + state in localStorage (shared between the PWA and the browser
 *  on Android) so whichever context Google returns to can complete the exchange. */
export async function loginGoogle(): Promise<void> {
  const methods = await pb.collection(USERS).listAuthMethods();
  const providers = (methods as { oauth2?: { providers?: Array<{ name: string; state: string; authURL: string; codeVerifier: string }> } }).oauth2?.providers ?? [];
  const google = providers.find((p) => p.name === 'google');
  if (!google) throw new Error('Google sign-in is not configured');
  const redirectUrl = oauthRedirectUrl();
  localStorage.setItem(OAUTH_PENDING, JSON.stringify({
    provider: google.name, codeVerifier: google.codeVerifier, state: google.state, redirectUrl,
  }));
  // PB's authURL ends with `redirect_uri=`; append our callback.
  window.location.href = google.authURL + redirectUrl;
}

/** If the current URL carries an OAuth `code` from a Google redirect, complete the login.
 *  Returns true if it handled a callback. Call once at app startup. */
export async function completeGoogleLogin(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const raw = localStorage.getItem(OAUTH_PENDING);
  if (!code || !raw) return false;
  localStorage.removeItem(OAUTH_PENDING);
  const saved = JSON.parse(raw) as { provider: string; codeVerifier: string; state: string; redirectUrl: string };
  if (state !== saved.state) throw new Error('OAuth state mismatch');
  try {
    await pb.collection(USERS).authWithOAuth2Code(saved.provider, code, saved.codeVerifier, saved.redirectUrl);
  } finally {
    // strip the OAuth params so a refresh doesn't retry a now-consumed code
    window.history.replaceState({}, '', window.location.pathname);
  }
  return true;
}

/** Whether a Google OAuth2 provider is actually configured on the backend. The UI only shows
 *  the Google button when this is true, so we never present a button that can't work. */
export async function googleEnabled(): Promise<boolean> {
  try {
    const m = await pb.collection(USERS).listAuthMethods();
    const providers = ((m as { oauth2?: { providers?: Array<{ name?: string }> } }).oauth2?.providers) ?? [];
    return providers.some((p) => p?.name === 'google');
  } catch {
    return false;
  }
}

export async function signup(email: string, password: string): Promise<void> {
  await pb.collection(USERS).create({ email, password, passwordConfirm: password });
  await pb.collection(USERS).authWithPassword(email, password);
}

export interface TotpSetup { secret: string; otpauthUrl: string; }

export async function startTotp(): Promise<TotpSetup> {
  return (await pb.send('/api/loyalty/totp/setup', { method: 'POST', body: {} })) as TotpSetup;
}

export async function confirmTotp(code: string): Promise<void> {
  await pb.send('/api/loyalty/totp/enable', { method: 'POST', body: { code } });
}

export async function disableTotp(code: string): Promise<void> {
  await pb.send('/api/loyalty/totp/disable', { method: 'POST', body: { code } });
}
