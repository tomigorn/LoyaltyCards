import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the client module so no real network/localStorage is touched.
// Use vi.hoisted so authStore is available inside the vi.mock factory.
const { authStore, authRefresh, authWithPassword, authWithOAuth2, create, send } = vi.hoisted(() => {
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
  const create = vi.fn().mockResolvedValue({ id: 'u1' });
  const send = vi.fn();
  return { authStore, authRefresh, authWithPassword, authWithOAuth2, create, send };
});

vi.mock('./client', () => ({
  USERS: 'users',
  pb: {
    authStore,
    collection: () => ({ authRefresh, authWithPassword, authWithOAuth2, create }),
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
  beforeEach(() => { authStore.clear(); send.mockReset(); authWithPassword.mockClear(); authWithOAuth2.mockClear(); create.mockClear(); });

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

  it('loginGoogle calls authWithOAuth2 google', async () => {
    await loginGoogle();
    expect(authWithOAuth2).toHaveBeenCalledWith({ provider: 'google' });
  });

  it('signup creates the user then logs in', async () => {
    await signup('a@b.c', 'pw');
    expect(create).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw', passwordConfirm: 'pw' });
    expect(authWithPassword).toHaveBeenCalledWith('a@b.c', 'pw');
  });
});
