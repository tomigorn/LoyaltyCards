import PocketBase from 'pocketbase';

// The sync backend origin. Overridable at build time with VITE_SYNC_URL; defaults to the
// live deployment so the app works without extra config.
const SYNC_URL =
  (import.meta.env.VITE_SYNC_URL as string | undefined) || 'https://loyalty-sync.holy-grail.ch';

// PocketBase's default authStore (LocalAuthStore) persists the token to localStorage under
// "pocketbase_auth", so a logged-in session survives reloads until explicitly cleared.
export const pb = new PocketBase(SYNC_URL);

export const USERS = 'users';
