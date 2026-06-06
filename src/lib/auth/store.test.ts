import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the client module so no real network/localStorage is touched.
// Use vi.hoisted so authStore is available inside the vi.mock factory.
const { authStore, authRefresh, authWithPassword, authWithOAuth2, authWithOAuth2Code, listAuthMethods, create, send } = vi.hoisted(() => {
  const authStore = {
    record: null as any,
    token: '',
    isValid: false,
    _cbs: [] as Array<() => void>,
    onChange(cb: () => void) { this._cbs.push(cb); return () => {}; },
    clear() { this.record = null; this.token = ''; this.isValid = false; this._cbs.forEach((c) => c()); },
    save(token: string, record: any) { this.token = token; this.record = record; this.isValid = true; this._cbs.forEach((c) => c()); },
  };
  const authRefresh = vi.fn().mockResolvedValue({});
  const authWithPassword = vi.fn().mockResolvedValue({});
  const authWithOAuth2 = vi.fn().mockResolvedValue({});
  const authWithOAuth2Code = vi.fn().mockResolvedValue({});
  const listAuthMethods = vi.fn().mockResolvedValue({ oauth2: { providers: [] } });
  const create = vi.fn().mockResolvedValue({ id: 'u1' });
  const send = vi.fn();
  return { authStore, authRefresh, authWithPassword, authWithOAuth2, authWithOAuth2Code, listAuthMethods, create, send };
});

vi.mock('./client', () => ({
  USERS: 'users',
  pb: {
    authStore,
    collection: () => ({ authRefresh, authWithPassword, authWithOAuth2, authWithOAuth2Code, listAuthMethods, create }),
    send,
  },
}));

import { account, isLoggedIn, logout, refreshSession } from './store';

beforeEach(() => { authStore.clear(); authRefresh.mockClear(); });

describe('auth store', () => {
  it('account is null and isLoggedIn false when no session', () => {
    expect(get(account)).toBeNull();
    expect(get(isLoggedIn)).toBe(false);
  });

  it('reflects a saved session', () => {
    authStore.save('tok', { id: 'u1', email: 'a@b.c' });
    expect(get(account)?.email).toBe('a@b.c');
    expect(get(isLoggedIn)).toBe(true);
  });

  it('logout clears the session', () => {
    authStore.save('tok', { id: 'u1', email: 'a@b.c' });
    logout();
    expect(get(account)).toBeNull();
    expect(get(isLoggedIn)).toBe(false);
  });

  it('refreshSession does nothing when not logged in', async () => {
    await refreshSession();
    expect(authRefresh).not.toHaveBeenCalled();
  });

  it('refreshSession calls authRefresh when a session exists', async () => {
    authStore.save('tok', { id: 'u1', email: 'a@b.c' });
    await refreshSession();
    expect(authRefresh).toHaveBeenCalledOnce();
  });
});

import { loginGoogle, loginPassword, signup, totpRequired } from './store';

describe('auth store — login', () => {
  beforeEach(() => { authStore.clear(); send.mockReset(); authWithPassword.mockClear(); authWithOAuth2.mockClear(); authWithOAuth2Code.mockClear(); listAuthMethods.mockReset(); create.mockClear(); localStorage.clear(); });

  it('totpRequired posts the identity and returns the flag', async () => {
    send.mockResolvedValueOnce({ required: true });
    expect(await totpRequired('a@b.c')).toBe(true);
    expect(send).toHaveBeenCalledWith('/api/loyalty/totp/required', expect.objectContaining({ method: 'POST' }));
  });

  it('loginPassword uses the standard endpoint when 2FA is not required', async () => {
    send.mockResolvedValueOnce({ required: false });
    await loginPassword('a@b.c', 'pw');
    expect(authWithPassword).toHaveBeenCalledWith('a@b.c', 'pw');
  });

  it('loginPassword uses the TOTP endpoint and saves the token when 2FA is required', async () => {
    send.mockResolvedValueOnce({ required: true }) // totpRequired
        .mockResolvedValueOnce({ token: 'tok', record: { id: 'u1', email: 'a@b.c' } }); // totp/login
    await loginPassword('a@b.c', 'pw', '123456');
    expect(send).toHaveBeenLastCalledWith('/api/loyalty/totp/login', expect.objectContaining({
      method: 'POST', body: { identity: 'a@b.c', password: 'pw', code: '123456' },
    }));
    expect(authStore.isValid).toBe(true);
  });

  it('loginGoogle stores PKCE state when google is configured (redirect flow)', async () => {
    listAuthMethods.mockResolvedValueOnce({ oauth2: { providers: [
      { name: 'google', state: 'st', authURL: 'https://accounts.google/auth?redirect_uri=', codeVerifier: 'ver' },
    ] } });
    await loginGoogle();
    const pending = JSON.parse(localStorage.getItem('pb_oauth_pending')!);
    expect(pending).toMatchObject({ provider: 'google', codeVerifier: 'ver', state: 'st' });
  });

  it('loginGoogle throws when google is not configured', async () => {
    listAuthMethods.mockResolvedValueOnce({ oauth2: { providers: [] } });
    await expect(loginGoogle()).rejects.toThrow(/not configured/i);
  });

  it('signup creates the user then logs in', async () => {
    await signup('a@b.c', 'pw');
    expect(create).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw', passwordConfirm: 'pw' });
    expect(authWithPassword).toHaveBeenCalledWith('a@b.c', 'pw');
  });
});

import { startTotp, confirmTotp, disableTotp } from './store';

describe('auth store — TOTP management', () => {
  beforeEach(() => { send.mockReset(); });

  it('startTotp returns the secret + otpauth url', async () => {
    send.mockResolvedValueOnce({ secret: 'S', otpauthUrl: 'otpauth://x' });
    const r = await startTotp();
    expect(send).toHaveBeenCalledWith('/api/loyalty/totp/setup', expect.objectContaining({ method: 'POST' }));
    expect(r).toEqual({ secret: 'S', otpauthUrl: 'otpauth://x' });
  });

  it('confirmTotp posts the code to enable', async () => {
    send.mockResolvedValueOnce({ enabled: true });
    await confirmTotp('123456');
    expect(send).toHaveBeenCalledWith('/api/loyalty/totp/enable', expect.objectContaining({ method: 'POST', body: { code: '123456' } }));
  });

  it('disableTotp posts the code to disable', async () => {
    send.mockResolvedValueOnce({ enabled: false });
    await disableTotp('123456');
    expect(send).toHaveBeenCalledWith('/api/loyalty/totp/disable', expect.objectContaining({ method: 'POST', body: { code: '123456' } }));
  });
});

import { completeGoogleLogin, googleEnabled } from './store';

describe('auth store — Google redirect completion', () => {
  beforeEach(() => {
    authStore.clear(); localStorage.clear(); authWithOAuth2Code.mockClear(); listAuthMethods.mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('returns false when the URL carries no code', async () => {
    expect(await completeGoogleLogin()).toBe(false);
    expect(authWithOAuth2Code).not.toHaveBeenCalled();
  });

  it('exchanges the code via authWithOAuth2Code when state matches', async () => {
    localStorage.setItem('pb_oauth_pending', JSON.stringify({ provider: 'google', codeVerifier: 'ver', state: 'st', redirectUrl: 'http://localhost/' }));
    window.history.replaceState({}, '', '/?code=abc&state=st');
    expect(await completeGoogleLogin()).toBe(true);
    expect(authWithOAuth2Code).toHaveBeenCalledWith('google', 'abc', 'ver', 'http://localhost/');
  });

  it('throws on state mismatch', async () => {
    localStorage.setItem('pb_oauth_pending', JSON.stringify({ provider: 'google', codeVerifier: 'ver', state: 'st', redirectUrl: 'http://localhost/' }));
    window.history.replaceState({}, '', '/?code=abc&state=WRONG');
    await expect(completeGoogleLogin()).rejects.toThrow(/state mismatch/i);
  });

  it('googleEnabled reflects whether the provider is configured', async () => {
    listAuthMethods.mockResolvedValueOnce({ oauth2: { providers: [{ name: 'google' }] } });
    expect(await googleEnabled()).toBe(true);
    listAuthMethods.mockResolvedValueOnce({ oauth2: { providers: [] } });
    expect(await googleEnabled()).toBe(false);
  });
});
