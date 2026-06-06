import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

// Define mocks; vi.mock factory references module-level vars via closure after hoisting.
const { mockAccount, mockIsLoggedIn, mockLoginPassword, mockLoginGoogle, mockSignup, mockLogout,
        mockTotpRequired, mockGoogleEnabled, mockGoogleLinked, mockStartTotp } = vi.hoisted(() => {
  function makeStore<T>(init: T) {
    let val = init;
    const subs: Array<(v: T) => void> = [];
    return {
      subscribe(fn: (v: T) => void) { fn(val); subs.push(fn); return () => { subs.splice(subs.indexOf(fn), 1); }; },
      set(v: T) { val = v; subs.forEach(fn => fn(v)); },
      update(fn: (v: T) => T) { val = fn(val); subs.forEach(s => s(val)); },
    };
  }
  return {
    mockAccount: makeStore<any>(null),
    mockIsLoggedIn: makeStore<boolean>(false),
    mockLoginPassword: vi.fn().mockResolvedValue(undefined),
    mockLoginGoogle: vi.fn().mockResolvedValue(undefined),
    mockSignup: vi.fn().mockResolvedValue(undefined),
    mockLogout: vi.fn(),
    mockTotpRequired: vi.fn().mockResolvedValue(false),
    mockGoogleEnabled: vi.fn().mockResolvedValue(true),
    mockGoogleLinked: vi.fn().mockResolvedValue(false),
    mockStartTotp: vi.fn().mockResolvedValue({ secret: 'S', otpauthUrl: 'otpauth://x' }),
  };
});

vi.mock('../lib/auth/store', () => ({
  account: mockAccount,
  isLoggedIn: mockIsLoggedIn,
  loginPassword: mockLoginPassword,
  loginGoogle: mockLoginGoogle,
  signup: mockSignup,
  logout: mockLogout,
  totpRequired: mockTotpRequired,
  startTotp: mockStartTotp,
  confirmTotp: vi.fn().mockResolvedValue(undefined),
  googleEnabled: mockGoogleEnabled,
  googleLinked: mockGoogleLinked,
  refreshAccount: vi.fn().mockResolvedValue(undefined),
}));

import AccountSection from './AccountSection.svelte';

beforeEach(() => {
  mockAccount.set(null);
  mockIsLoggedIn.set(false);
  mockLoginPassword.mockClear();
  mockLogout.mockClear();
  mockGoogleEnabled.mockResolvedValue(true);
  mockGoogleLinked.mockResolvedValue(false);
});

describe('AccountSection', () => {
  it('shows the email/password form when logged out', () => {
    render(AccountSection);
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/password/i)).toBeTruthy();
  });

  it('shows the Google button only when the provider is configured', async () => {
    mockGoogleEnabled.mockResolvedValue(true);
    render(AccountSection);
    expect(await screen.findByText(/Continue with Google/i)).toBeTruthy();
  });

  it('hides the Google button when the provider is not configured', () => {
    mockGoogleEnabled.mockResolvedValue(false);
    render(AccountSection);
    expect(screen.queryByText(/Continue with Google/i)).toBeNull();
  });

  it('calls loginPassword on submit (login mode)', async () => {
    render(AccountSection);
    await fireEvent.input(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.c' } });
    await fireEvent.input(screen.getByPlaceholderText(/password/i), { target: { value: 'pw' } });
    await fireEvent.click(screen.getByRole('button', { name: /^Log in$/i }));
    expect(mockLoginPassword).toHaveBeenCalled();
  });

  it('shows account + logout when logged in', () => {
    mockAccount.set({ id: 'u1', email: 'a@b.c', totpEnabled: true });
    mockIsLoggedIn.set(true);
    render(AccountSection);
    expect(screen.getByText('a@b.c')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Log out/i })).toBeTruthy();
  });

  it('a Google account shows no 2FA setup', async () => {
    mockGoogleLinked.mockResolvedValue(true);
    mockAccount.set({ id: 'u1', email: 'g@b.c', totpEnabled: false });
    mockIsLoggedIn.set(true);
    render(AccountSection);
    expect(await screen.findByText(/Signed in with Google/i)).toBeTruthy();
    expect(screen.queryByText(/Set up two-factor/i)).toBeNull();
  });

  it('an email account without 2FA is forced to set it up', async () => {
    mockGoogleLinked.mockResolvedValue(false);
    mockAccount.set({ id: 'u1', email: 'e@b.c', totpEnabled: false });
    mockIsLoggedIn.set(true);
    render(AccountSection);
    expect(await screen.findByText(/Set up two-factor authentication/i)).toBeTruthy();
  });

  it('signup requires a minimum-length password', async () => {
    render(AccountSection);
    await fireEvent.click(screen.getByRole('button', { name: /Create an account/i }));
    await fireEvent.input(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.c' } });
    await fireEvent.input(screen.getByPlaceholderText(/password/i), { target: { value: 'short' } });
    const createBtn = screen.getByRole('button', { name: /Create account/i }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await fireEvent.input(screen.getByPlaceholderText(/password/i), { target: { value: 'longenough10' } });
    expect((screen.getByRole('button', { name: /Create account/i }) as HTMLButtonElement).disabled).toBe(false);
  });
});
