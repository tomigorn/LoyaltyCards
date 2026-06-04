import { describe, it, expect, beforeEach } from 'vitest';
import { getAutoFetch, setAutoFetch } from '../src/lib/settings';

describe('settings', () => {
  beforeEach(() => localStorage.clear());
  it('defaults auto-fetch to true', () => { expect(getAutoFetch()).toBe(true); });
  it('persists a false value', () => { setAutoFetch(false); expect(getAutoFetch()).toBe(false); });
});
