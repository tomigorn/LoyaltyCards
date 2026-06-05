# Sync & Multi-User — Phase B (Frontend Auth + Account UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add optional accounts to the PWA — log in with Google or username/email+password (+TOTP 2FA), a session that persists until explicit logout, an Account section in Settings, and a dismissible "not backed up" banner on Home. No card syncing yet (that is Phase C).

**Architecture:** A thin auth layer wraps the official PocketBase JS SDK (`pocketbase`), which persists its auth token to `localStorage` by default (→ persistent session). Svelte stores expose `account`/`isLoggedIn`; functions wrap login/signup/logout and the custom `/api/loyalty/totp/*` endpoints. UI is two small components (`AccountSection`, `BackupBanner`) slotted into the existing `Settings` and `Home` screens. The backend base URL comes from `VITE_SYNC_URL` (defaulting to the live origin).

**Tech Stack:** Svelte 5 runes, PocketBase JS SDK, Vitest + @testing-library/svelte (unit/component), Playwright with network mocking (e2e). bwip-js (already a dep) renders the TOTP enrollment QR.

**Reference:** design `docs/superpowers/specs/2026-06-05-sync-multiuser-design.md` §3.3, §3.5, §2. Backend is live internally at `https://loyalty-sync.holy-grail.ch` (Phase A) exposing standard PB auth + `/api/loyalty/totp/{setup,enable,disable,required,login}`.

> **Scope guard:** Phase B establishes the account/session ONLY. Do not implement the sync queue, push/pull, or card adoption — those are Phase C. The "back up" banner copy is honest because logging in is the prerequisite for backup; actual data movement lands in C.

---

## File Structure

- `src/lib/auth/client.ts` — the single PocketBase client instance (base URL + persistent authStore).
- `src/lib/auth/store.ts` — Svelte stores (`account`, `isLoggedIn`) + auth functions (`refreshSession`, `loginGoogle`, `loginPassword`, `signup`, `logout`, `totpRequired`, `startTotp`, `confirmTotp`, `disableTotp`).
- `src/lib/auth/store.test.ts` — Vitest unit tests for the store (PocketBase SDK mocked).
- `src/components/AccountSection.svelte` — Settings account UI (logged-out forms / logged-in panel + 2FA enrolment).
- `src/components/AccountSection.test.ts` — component test (auth store mocked).
- `src/components/BackupBanner.svelte` — Home dismissible "not backed up" banner.
- `src/screens/Settings.svelte` — render `<AccountSection />` (modify).
- `src/screens/Home.svelte` — render `<BackupBanner onsettings={onsettings} />` when logged out, non-reorder mode (modify).
- `src/App.svelte` — call `refreshSession()` once on startup (modify).
- `e2e/auth.spec.ts` — Playwright flow with mocked `/api/**` responses.
- `package.json` — add `pocketbase` dependency (modify).

---

## Task 1: PocketBase client + dependency + config

**Files:**
- Modify: `package.json`
- Create: `src/lib/auth/client.ts`

- [ ] **Step 1: Add the SDK**

Run: `cd /home/pi/Documents/development/LoyaltyCards && npm install pocketbase@^0.26.2`
Expected: `pocketbase` appears under `dependencies` in `package.json`; install succeeds.

- [ ] **Step 2: Create the client** (`src/lib/auth/client.ts`)

```ts
import PocketBase from 'pocketbase';

// The sync backend origin. Overridable at build time with VITE_SYNC_URL; defaults to the
// live deployment so the app works without extra config.
const SYNC_URL =
  (import.meta.env.VITE_SYNC_URL as string | undefined) || 'https://loyalty-sync.holy-grail.ch';

// PocketBase's default authStore (LocalAuthStore) persists the token to localStorage under
// "pocketbase_auth", so a logged-in session survives reloads until explicitly cleared.
export const pb = new PocketBase(SYNC_URL);

export const USERS = 'users';
```

- [ ] **Step 3: Verify it builds**

Run: `npm run check`
Expected: 0 errors (warnings about pre-existing files are fine).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/auth/client.ts
git commit -m "LoyaltyCards: add PocketBase client for sync auth (Phase B)"
```

---

## Task 2: Auth store — session state, refresh, logout (TDD)

**Files:**
- Create: `src/lib/auth/store.ts`
- Create: `src/lib/auth/store.test.ts`

- [ ] **Step 1: Write the failing test** (`src/lib/auth/store.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the client module so no real network/localStorage is touched.
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
```

- [ ] **Step 2: Run it; expect FAIL**

Run: `npm test -- src/lib/auth/store.test.ts`
Expected: FAIL — `store.ts` does not exist / exports undefined.

- [ ] **Step 3: Implement** (`src/lib/auth/store.ts`)

```ts
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
```

- [ ] **Step 4: Run it; expect PASS**

Run: `npm test -- src/lib/auth/store.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/store.ts src/lib/auth/store.test.ts
git commit -m "LoyaltyCards: auth store with persistent session + offline-tolerant refresh"
```

---

## Task 3: Auth store — Google, password, signup, TOTP-required (TDD)

**Files:**
- Modify: `src/lib/auth/store.ts`
- Modify: `src/lib/auth/store.test.ts`

- [ ] **Step 1: Extend the mock + add failing tests** (append to `store.test.ts`)

Add to the `vi.mock('./client', ...)` `pb` object an `authWithPassword`, `authWithOAuth2`, and `create` on the collection, plus a top-level `send`. Replace the `collection` mock with:
```ts
const authWithPassword = vi.fn().mockResolvedValue({});
const authWithOAuth2 = vi.fn().mockResolvedValue({});
const create = vi.fn().mockResolvedValue({ id: 'u1' });
const send = vi.fn();
vi.mock('./client', () => ({
  USERS: 'users',
  pb: {
    authStore,
    collection: () => ({ authRefresh, authWithPassword, authWithOAuth2, create }),
    send,
  },
}));
```
Add tests:
```ts
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
```

- [ ] **Step 2: Run; expect FAIL** (functions undefined)

Run: `npm test -- src/lib/auth/store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (append to `store.ts`)

```ts
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
```

- [ ] **Step 4: Run; expect PASS**

Run: `npm test -- src/lib/auth/store.test.ts`
Expected: PASS (all tests, old + new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/store.ts src/lib/auth/store.test.ts
git commit -m "LoyaltyCards: auth store login/signup (Google, password, 2FA-aware)"
```

---

## Task 4: Auth store — TOTP enrol / confirm / disable (TDD)

**Files:**
- Modify: `src/lib/auth/store.ts`
- Modify: `src/lib/auth/store.test.ts`

- [ ] **Step 1: Add failing tests** (append to `store.test.ts`)

```ts
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
```

- [ ] **Step 2: Run; expect FAIL**

Run: `npm test -- src/lib/auth/store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (append to `store.ts`)

```ts
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
```

- [ ] **Step 4: Run; expect PASS**

Run: `npm test -- src/lib/auth/store.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/store.ts src/lib/auth/store.test.ts
git commit -m "LoyaltyCards: auth store TOTP enrol/confirm/disable"
```

---

## Task 5: AccountSection component (TDD)

**Files:**
- Create: `src/components/AccountSection.svelte`
- Create: `src/components/AccountSection.test.ts`

- [ ] **Step 1: Write the failing component test** (`src/components/AccountSection.test.ts`)

Mock the auth store so the component renders deterministically.
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';

const account = writable<any>(null);
const isLoggedIn = writable<boolean>(false);
const loginPassword = vi.fn().mockResolvedValue(undefined);
const loginGoogle = vi.fn().mockResolvedValue(undefined);
const signup = vi.fn().mockResolvedValue(undefined);
const logout = vi.fn();
const totpRequired = vi.fn().mockResolvedValue(false);
vi.mock('../lib/auth/store', () => ({
  account, isLoggedIn, loginPassword, loginGoogle, signup, logout, totpRequired,
  startTotp: vi.fn(), confirmTotp: vi.fn(), disableTotp: vi.fn(),
}));

import AccountSection from './AccountSection.svelte';

beforeEach(() => { account.set(null); isLoggedIn.set(false); loginPassword.mockClear(); logout.mockClear(); });

describe('AccountSection', () => {
  it('shows login options when logged out', () => {
    render(AccountSection);
    expect(screen.getByText(/Continue with Google/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
  });

  it('calls loginPassword on submit', async () => {
    render(AccountSection);
    await fireEvent.input(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.c' } });
    await fireEvent.input(screen.getByPlaceholderText(/password/i), { target: { value: 'pw' } });
    await fireEvent.click(screen.getByRole('button', { name: /^Log in$/i }));
    expect(loginPassword).toHaveBeenCalled();
  });

  it('shows account + logout when logged in', () => {
    account.set({ id: 'u1', email: 'a@b.c' });
    isLoggedIn.set(true);
    render(AccountSection);
    expect(screen.getByText('a@b.c')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Log out/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run; expect FAIL** (component missing)

Run: `npm test -- src/components/AccountSection.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (`src/components/AccountSection.svelte`)

```svelte
<script lang="ts">
  import { account, isLoggedIn, loginPassword, loginGoogle, signup, logout,
           totpRequired, startTotp, confirmTotp, disableTotp } from '../lib/auth/store';
  import { toCanvas } from 'bwip-js';

  let mode = $state<'login' | 'signup'>('login');
  let email = $state(''); let password = $state(''); let code = $state('');
  let need2fa = $state(false);
  let busy = $state(false); let err = $state('');

  async function submit() {
    busy = true; err = '';
    try {
      if (mode === 'signup') { await signup(email.trim(), password); }
      else {
        if (!need2fa) need2fa = await totpRequired(email.trim());
        if (need2fa && !code.trim()) { busy = false; return; } // reveal code field, wait
        await loginPassword(email.trim(), password, code.trim() || undefined);
      }
    } catch (e) { err = (e as Error).message || 'Sign-in failed'; }
    busy = false;
  }

  // ---- 2FA enrolment (logged-in) ----
  let enroll = $state<{ secret: string; otpauthUrl: string } | null>(null);
  let enrollCode = $state(''); let qrCanvas = $state<HTMLCanvasElement | null>(null);
  let twoFAMsg = $state('');
  async function begin2fa() {
    enroll = await startTotp(); twoFAMsg = '';
    queueMicrotask(() => { if (qrCanvas && enroll) {
      try { toCanvas(qrCanvas, { bcid: 'qrcode', text: enroll.otpauthUrl, scale: 4 }); } catch {}
    }});
  }
  async function finish2fa() {
    try { await confirmTotp(enrollCode.trim()); enroll = null; enrollCode = ''; twoFAMsg = 'Two-factor enabled ✓'; }
    catch (e) { twoFAMsg = (e as Error).message || 'Wrong code'; }
  }
  let disableCode = $state('');
  async function turnOff2fa() {
    try { await disableTotp(disableCode.trim()); disableCode = ''; twoFAMsg = 'Two-factor disabled'; }
    catch (e) { twoFAMsg = (e as Error).message || 'Wrong code'; }
  }
</script>

<section>
  <span class="lbl">Account</span>

  {#if $isLoggedIn}
    <div class="who">{$account?.email}</div>
    <details class="card2fa">
      <summary>Two-factor authentication</summary>
      {#if enroll}
        <p class="hint">Scan in your authenticator app, then enter a code.</p>
        <canvas bind:this={qrCanvas} class="qr"></canvas>
        <code class="secret">{enroll.secret}</code>
        <input class="text" placeholder="6-digit code" bind:value={enrollCode} inputmode="numeric" />
        <button class="btn" onclick={finish2fa}>Enable</button>
      {:else}
        <button class="btn" onclick={begin2fa}>Set up authenticator app</button>
        <div class="row">
          <input class="text" placeholder="code to disable" bind:value={disableCode} inputmode="numeric" />
          <button class="btn ghost" onclick={turnOff2fa}>Disable</button>
        </div>
      {/if}
      {#if twoFAMsg}<p class="msg">{twoFAMsg}</p>{/if}
    </details>
    <button class="btn" onclick={logout}>Log out</button>
  {:else}
    <button class="btn google" onclick={loginGoogle}>Continue with Google</button>
    <div class="or">or</div>
    <input class="text" placeholder="email" bind:value={email} autocomplete="username" />
    <input class="text" placeholder="password" type="password" bind:value={password} autocomplete="current-password" />
    {#if need2fa}<input class="text" placeholder="2FA code" bind:value={code} inputmode="numeric" />{/if}
    {#if err}<p class="err">{err}</p>{/if}
    <button class="btn primary" onclick={submit} disabled={busy}>
      {mode === 'signup' ? 'Create account' : 'Log in'}
    </button>
    <button class="link" onclick={() => { mode = mode === 'login' ? 'signup' : 'login'; need2fa = false; }}>
      {mode === 'login' ? 'Create an account' : 'I already have an account'}
    </button>
  {/if}
</section>

<style>
  section{display:flex;flex-direction:column;gap:8px}
  .lbl{color:#9a9aa6;font-size:13px;margin:0 2px 2px}
  .text{padding:12px;border-radius:10px;border:1px solid #2a2a30;background:#161618;color:#eee;font-size:15px}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:12px;
    border:1px solid #33333a;background:#1a1a20;color:#e6e6ec;font-size:15px;cursor:pointer}
  .btn.primary{background:#2a6df4;border-color:#2a6df4;color:#fff;font-weight:600}
  .btn.google{background:#fff;color:#222;border-color:#fff;font-weight:600}
  .btn.ghost{background:transparent}
  .link{background:none;border:none;color:#7aa2f7;font-size:14px;cursor:pointer;padding:4px}
  .or{color:#777;text-align:center;font-size:12px}
  .who{font-size:16px;font-weight:600}
  .row{display:flex;gap:8px}
  .qr{width:160px;height:160px;align-self:center;background:#fff;border-radius:8px}
  .secret{font-family:ui-monospace,monospace;font-size:13px;color:#bbb;word-break:break-all}
  .hint{color:#9a9aa6;font-size:13px}
  .err{color:#ff6b6b;font-size:14px}
  .msg{color:#7ad17a;font-size:14px}
  details.card2fa{border:1px solid #2a2a30;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
  summary{cursor:pointer;font-size:15px}
</style>
```

- [ ] **Step 4: Run; expect PASS**

Run: `npm test -- src/components/AccountSection.test.ts`
Expected: PASS (3 tests). If `bwip-js`'s `toCanvas` import name differs, import the module's actual canvas helper (check `node_modules/bwip-js`); the QR is non-critical to the tests (they don't enter the logged-in 2FA path), so the import must merely not break module load.

- [ ] **Step 5: Commit**

```bash
git add src/components/AccountSection.svelte src/components/AccountSection.test.ts
git commit -m "LoyaltyCards: Account section UI (login/signup, 2FA enrol)"
```

---

## Task 6: BackupBanner component (TDD)

**Files:**
- Create: `src/components/BackupBanner.svelte`
- Create: `src/components/BackupBanner.test.ts`

- [ ] **Step 1: Write the failing test** (`src/components/BackupBanner.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';

const isLoggedIn = writable<boolean>(false);
vi.mock('../lib/auth/store', () => ({ isLoggedIn }));

import BackupBanner from './BackupBanner.svelte';

beforeEach(() => { isLoggedIn.set(false); localStorage.clear(); });

describe('BackupBanner', () => {
  it('shows when logged out and not dismissed', () => {
    render(BackupBanner, { props: { onsettings: () => {} } });
    expect(screen.getByText(/aren't backed up|not backed up|back them up/i)).toBeTruthy();
  });

  it('hides when logged in', () => {
    isLoggedIn.set(true);
    render(BackupBanner, { props: { onsettings: () => {} } });
    expect(screen.queryByText(/back them up/i)).toBeNull();
  });

  it('dismiss hides it and persists', async () => {
    render(BackupBanner, { props: { onsettings: () => {} } });
    await fireEvent.click(screen.getByLabelText(/dismiss/i));
    expect(screen.queryByText(/back them up/i)).toBeNull();
    expect(localStorage.getItem('backupBannerDismissed')).toBe('1');
  });

  it('clicking the action calls onsettings', async () => {
    const onsettings = vi.fn();
    render(BackupBanner, { props: { onsettings } });
    await fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(onsettings).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run; expect FAIL**

Run: `npm test -- src/components/BackupBanner.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** (`src/components/BackupBanner.svelte`)

```svelte
<script lang="ts">
  import { isLoggedIn } from '../lib/auth/store';
  let { onsettings }: { onsettings: () => void } = $props();
  let dismissed = $state(localStorage.getItem('backupBannerDismissed') === '1');
  function dismiss() { dismissed = true; localStorage.setItem('backupBannerDismissed', '1'); }
</script>

{#if !$isLoggedIn && !dismissed}
  <div class="banner">
    <span class="txt">⚠️ Your cards aren't backed up — they're only on this device.</span>
    <button class="act" onclick={onsettings}>Log in</button>
    <button class="x" aria-label="Dismiss" onclick={dismiss}>✕</button>
  </div>
{/if}

<style>
  .banner{display:flex;align-items:center;gap:8px;margin:0 16px 12px;padding:10px 12px;border-radius:10px;
    background:#2a230f;border:1px solid #5a4a17;color:#e8d9a8;font-size:13px}
  .txt{flex:1}
  .act{background:#2a6df4;border:none;color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer}
  .x{background:none;border:none;color:#c8b888;font-size:14px;cursor:pointer;padding:2px 4px}
</style>
```

- [ ] **Step 4: Run; expect PASS**

Run: `npm test -- src/components/BackupBanner.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/BackupBanner.svelte src/components/BackupBanner.test.ts
git commit -m "LoyaltyCards: 'not backed up' banner on Home"
```

---

## Task 7: Wire components into Settings + Home + startup refresh

**Files:**
- Modify: `src/screens/Settings.svelte`
- Modify: `src/screens/Home.svelte`
- Modify: `src/App.svelte`

- [ ] **Step 1: Add AccountSection to Settings** — in `src/screens/Settings.svelte`, import it and render it as the FIRST section inside `.body`.

Add to the `<script>`:
```ts
  import AccountSection from '../components/AccountSection.svelte';
```
Immediately after `<div class="body">` add:
```svelte
  <AccountSection />
```

- [ ] **Step 2: Add the banner to Home** — in `src/screens/Home.svelte`, import it and render it just below the `<input class="search" ... />` line, only in the normal (non-reorder) branch.

Add to the `<script>`:
```ts
  import BackupBanner from '../components/BackupBanner.svelte';
```
Inside `{:else}` (the non-reorder block), immediately before `<div class="grid">`, add:
```svelte
    <BackupBanner onsettings={onsettings} />
```

- [ ] **Step 2b: Verify the `onsettings` prop is in scope** in `Home.svelte` — it already is (destructured in `$props()`). No change needed beyond Step 2.

- [ ] **Step 3: Refresh the session on startup** — in `src/App.svelte` `<script>`, import and call refresh inside the existing `$effect`/init.

Add to the `<script>` imports:
```ts
  import { refreshSession } from './lib/auth/store';
```
Add a top-level call (runs once when App initialises), right after the imports/props:
```ts
  refreshSession();
```

- [ ] **Step 4: Verify build + full unit suite**

Run: `npm run check && npm test`
Expected: 0 type errors; all vitest tests pass (auth store + both components).

- [ ] **Step 5: Commit**

```bash
git add src/screens/Settings.svelte src/screens/Home.svelte src/App.svelte
git commit -m "LoyaltyCards: wire account UI into Settings + Home, refresh session on startup"
```

---

## Task 8: e2e — auth UI flow with mocked backend (TDD)

**Files:**
- Create: `e2e/auth.spec.ts`

> We mock `/api/**` with Playwright's `page.route` so the test needs no live backend and is deterministic. It verifies the UI wiring (banner, login form posts, logged-in panel), not the real server (that is covered by Phase A backend tests + Phase C integration).

- [ ] **Step 1: Write the test** (`e2e/auth.spec.ts`)

```ts
import { test, expect } from '@playwright/test';

test('logged-out shows the backup banner; login flow reaches the logged-in panel', async ({ page }) => {
  // Mock the PocketBase endpoints the app will call.
  await page.route('**/api/collections/users/auth-with-password', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ token: 'tok', record: { id: 'u1', email: 'me@example.com' } }) }));
  await page.route('**/api/loyalty/totp/required', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ required: false }) }));

  await page.goto('/');
  // Banner visible when logged out
  await expect(page.getByText(/aren't backed up/i)).toBeVisible();

  // Go to Settings → Account
  await page.getByLabel('Settings').click();
  await page.getByPlaceholder('email').fill('me@example.com');
  await page.getByPlaceholder('password').fill('password123');
  await page.getByRole('button', { name: /^Log in$/ }).click();

  // Logged-in panel shows the account + logout
  await expect(page.getByText('me@example.com')).toBeVisible();
  await expect(page.getByRole('button', { name: /Log out/i })).toBeVisible();
});
```

- [ ] **Step 2: Run; expect PASS** (implementation already exists from Tasks 5–7)

Run: `npm run e2e -- auth.spec.ts`
Expected: PASS. If the PocketBase SDK persists the mocked token to localStorage and a later test run starts "logged in", clear storage at test start with `await page.context().clearCookies()` and `await page.addInitScript(() => localStorage.clear())` before `goto`.

- [ ] **Step 3: Run the FULL e2e suite to confirm no regressions**

Run: `npm run e2e`
Expected: all specs pass (the 8 prior + this one).

- [ ] **Step 4: Commit**

```bash
git add e2e/auth.spec.ts
git commit -m "LoyaltyCards: e2e for auth UI flow (mocked backend)"
```

---

## Self-Review

**Spec coverage (design § → task):**
- §3.3 auth store (client, persistent session, refresh, login/signup/logout, TOTP mgmt) → Tasks 1–4 ✓
- §3.5 account UI (logged-out Google + password + 2FA code; logged-in identity + 2FA toggle + logout) → Task 5 ✓
- §3.5 Home backup banner (dismissible, persists, routes to Settings) → Tasks 6–7 ✓
- §2 persistent session (localStorage authStore + startup refresh, only hard-401 clears) → Tasks 1, 2, 7 ✓
- §2 no nag (banner is single + dismissible; no wall) → Task 6 ✓
- Sync engine, queue, card adoption → correctly OUT (Phase C) ✓
- Google OAuth2 provider config is backend/admin-side (Phase A deploy) — the frontend only triggers `authWithOAuth2`; works once the provider is set ✓

**Placeholder scan:** none. The one soft spot (bwip-js `toCanvas` import name) is called out with a concrete fallback and is non-blocking for tests.

**Type/name consistency:** store exports (`account`, `isLoggedIn`, `refreshSession`, `loginGoogle`, `loginPassword`, `signup`, `logout`, `totpRequired`, `startTotp`, `confirmTotp`, `disableTotp`, `Account`, `TotpSetup`) are defined in Tasks 2–4 and consumed identically in Tasks 5–8. `pb`/`USERS` from `client.ts` used consistently. Banner localStorage key `backupBannerDismissed` matches between component and test.

---

## After Phase B

Logging in works and persists; the account is established; the banner nudges logged-out users. **Nothing syncs yet.** Phase C adds the sync engine (outbound queue, push/pull with last-write-wins + tombstones, realtime, offline flush, first-login adoption) and the two-context Playwright integration test against an ephemeral Pocketbase.
