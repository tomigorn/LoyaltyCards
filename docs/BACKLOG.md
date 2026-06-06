# LoyaltyCards — Backlog

Deferred items, not yet scheduled. Newest first.

## UI
- **Keep the "not backed up" banner visible during tile reorder.** On Home the `BackupBanner`
  is rendered only inside the non-reorder `{:else}` branch, so long-pressing to enter reorder
  mode removes it and every tile jumps up by the banner's height (jarring right as you start
  editing). Fix: render the banner — or at least reserve its vertical space — in reorder mode
  too, so the layout doesn't shift. File: `src/screens/Home.svelte` (the banner sits in the
  `{:else}` block; the reorder branch has no banner).

## Accounts / sync
- **Enable Google sign-in.** Needs a Google Cloud OAuth 2.0 Client ID + Secret (redirect URI
  `https://loyalty-sync.holy-grail.ch/api/oauth2-redirect`) configured in PocketBase admin. The
  PWA already has the button — it auto-appears once `googleEnabled()` sees the provider. May need
  switching from the popup OAuth flow to the redirect flow for installed-PWA reliability.
- Phase-later: photo/logo blob sync; card sharing / family wallets.
- Known edge case: a card edit landing *during* an active pull won't enqueue (the mutation hook
  is nulled to prevent echo loops) — robust fix is a pull-only `putCardRaw`. See the design spec.

## Backend security (also in `Docker/LoyaltyCards-Sync/deploy/SECURITY-FOLLOWUPS.md`)
- Decide open-signup (currently ON — anyone can register on the public backend).
- Fence the admin console `/_/` (Traefik IP-allowlist / basic-auth).
