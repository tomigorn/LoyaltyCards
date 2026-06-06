# LoyaltyCards — Backlog

Deferred items, not yet scheduled. Newest first.

## Done (for reference)
- Google sign-in (redirect flow, v0.9.x) ✓
- Photo / logo blob sync (v0.10.0) ✓
- Colour & sort sync (v0.9.2) ✓
- Mandatory 2FA for email accounts; none for Google (v0.10.2) ✓
- Emoji-free UI (v0.10.1) ✓

## UI
- **Keep the "not backed up" banner visible during tile reorder.** The banner sits only in the
  non-reorder branch of `src/screens/Home.svelte`, so entering reorder removes it and every tile
  jumps up. Fix: render it (or reserve its space) in reorder mode too.

## Accounts / sync
- **Backend enforcement of mandatory 2FA.** Today it's frontend-only: the PocketBase API still
  lets a client create an email account and log in with just a password (the auth guard only
  blocks accounts that already HAVE 2FA). A determined caller could bypass the UI. Robust fix: a
  backend hook that rejects password login for email accounts without `totpEnabled` (after a
  short grace window), or only "finalise" the account once 2FA is enrolled.
- **Password reset / email verification need SMTP.** No mail sender is configured on the backend,
  so "forgot password" and email verification don't work for email/password accounts. Configure
  SMTP (or accept no self-service recovery).
- **Card sharing / family wallets** — share a specific card with another account. Larger feature.
- **Concurrent-edit-during-pull edge case** — a card edit landing during an active pull won't
  enqueue (the mutation hook is nulled to prevent echo loops). Robust fix: a pull-only
  `putCardRaw` that bypasses the hook so user edits during a sync still queue.

## Backend security (see `Docker/LoyaltyCards-Sync/deploy/SECURITY-FOLLOWUPS.md`)
- **Decide open signup** (currently ON — anyone can register on the public backend).
- **Fence the admin console `/_/`** (Traefik IP-allowlist / basic-auth).
- I2 `/required` user-enumeration; I5 long-lived (~3yr) tokens are by-design; M4 add length/charset
  checks on submitted TOTP codes.

## Data quality
- **Catalogue spot-check** — the +143 auto-added shops (v0.7.0) had domains checked by a subagent
  but weren't individually eyeballed; fix any wrong logo/colour as noticed.

## Maybe / later
- Apple / Google Wallet passes (emit `.pkpass` / Google Wallet links).
