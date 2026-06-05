import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the client module so no real network/localStorage is touched.
// Use vi.hoisted so authStore is available inside the vi.mock factory.
const { authStore, authRefresh } = vi.hoisted(() => {
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
  return { authStore, authRefresh };
});

vi.mock('./client', () => ({
  USERS: 'users',
  pb: {
    authStore,
    collection: () => ({ authRefresh }),
    send: vi.fn(),
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
