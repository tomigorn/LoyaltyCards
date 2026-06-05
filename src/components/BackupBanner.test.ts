import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

const { mockIsLoggedIn } = vi.hoisted(() => {
  // Minimal writable-compatible store (no svelte import needed in hoisted context)
  function makeStore<T>(init: T) {
    let val = init;
    const subs: Array<(v: T) => void> = [];
    return {
      subscribe(fn: (v: T) => void) { fn(val); subs.push(fn); return () => { subs.splice(subs.indexOf(fn), 1); }; },
      set(v: T) { val = v; subs.forEach(fn => fn(v)); },
      update(fn: (v: T) => T) { val = fn(val); subs.forEach(s => s(val)); },
    };
  }
  return { mockIsLoggedIn: makeStore<boolean>(false) };
});

vi.mock('../lib/auth/store', () => ({ isLoggedIn: mockIsLoggedIn }));

import BackupBanner from './BackupBanner.svelte';

beforeEach(() => { mockIsLoggedIn.set(false); localStorage.clear(); });

describe('BackupBanner', () => {
  it('shows when logged out and not dismissed', () => {
    render(BackupBanner, { props: { onsettings: () => {} } });
    expect(screen.getByText(/aren't backed up|not backed up|back them up/i)).toBeTruthy();
  });

  it('hides when logged in', () => {
    mockIsLoggedIn.set(true);
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
