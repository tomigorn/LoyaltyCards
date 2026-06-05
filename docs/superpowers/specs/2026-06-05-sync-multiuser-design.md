# LoyaltyCards — Sync & Multi-User Design

**Date:** 2026-06-05
**Status:** Approved (standing auto-approval); judgment calls flagged below
**Goal:** Add optional accounts and cross-device backup/sync to the local-first PWA, without compromising the no-account, offline-first default.

---

## 1. Guiding principles

- **Local-first stays the default.** IndexedDB remains the source of truth. The app works fully offline with no account, exactly as today. Login is purely additive: it enables backup + cross-device sync.
- **No nag.** No login wall, no popups, no repeated prompts. One subtle, dismissible "not backed up" notice when logged out, plus a permanent entry in Settings.
- **Persistent session.** Once logged in, the session never expires on its own. It survives app restarts and is cleared only by an explicit Log out.
- **Privacy / self-hosted.** All data lives on the user's own Pi homelab. No third-party SaaS.
- **Separate wallets.** Each account has its own private set of cards. No sharing between accounts in v1.

## 2. Decisions (locked) & judgment calls (flagged)

Locked via brainstorming:
- **Backend stack:** Pocketbase, self-hosted (one container).
- **Sync scope v1:** card *data* only (no photos/logos yet).
- **Multi-user:** separate private wallets, no card sharing.

Judgment calls (overridable):
1. **2FA = authenticator-app TOTP** (RFC 6238), optional per account, for the password login path only (Google path relies on Google's own 2FA). Highest implementation risk on Pocketbase. *Fallback option: built-in email one-time-code 2FA, much simpler.*
2. **Conflict resolution = last-write-wins by `updatedAt`**, with merge-on-first-login. No CRDT.
3. **Backend subdomain = `loyalty-sync.holy-grail.ch`** (Cloudflare Tunnel → Traefik → Pocketbase).

## 3. Architecture

```
 PWA (Svelte 5, IndexedDB)                       Pi homelab
 ┌─────────────────────────┐      HTTPS     ┌───────────────────────────┐
 │ cards (local SoT)        │  ───────────▶  │ Cloudflare Tunnel         │
 │ auth store (localStorage)│                │   → Traefik (file CSP)    │
 │ sync engine + queue      │  ◀───────────  │     → Pocketbase          │
 └─────────────────────────┘   realtime/REST │       (SQLite, pb_data)   │
                                              └───────────────────────────┘
```

- **Frontend** gains three units: an **auth store**, an **account UI** (Settings section + login/signup), and a **sync engine** (queue + push/pull/merge).
- **Backend** is a single Pocketbase instance. SQLite + uploaded-file storage live in a persisted `pb_data` volume.

### 3.1 Backend — Pocketbase collections

**`users`** (Pocketbase `auth` collection)
- Built-in: `username`, `email`, `password` (bcrypt), `emailVisibility`, `verified`, OAuth2 identities (Google).
- Added fields: `totpSecret` (text, hidden from API — system/admin only), `totpEnabled` (bool, default false), `totpPending` (text, hidden — secret awaiting confirmation).

**`cards`** (base collection) — mirrors the local `Card` minus photo blobs:
- `owner` (relation → users, required, cascade delete)
- `cardId` (text, required) — the client-generated UUID; unique per owner
- `storeName`, `barcodeValue`, `barcodeFormat`, `brandColor`, `tileColor` (text)
- `logoSource`, `logoUrl`, `catalogId`, `notes` (text)
- `favorite` (bool), `order` (number)
- `lastUsedAt`, `createdAt`, `updatedAt` (number, epoch ms — client clocks)
- `deleted` (bool, default false) — tombstone so deletions propagate
- Unique index on `(owner, cardId)`.
- **API rules** (all of listRule/viewRule/createRule/updateRule/deleteRule): `@request.auth.id != "" && owner = @request.auth.id`. A user can only ever touch their own rows.

Photos/logos are intentionally NOT modelled here (v1 out of scope). A card synced to a second device shows its logo/colour tile; the physical-card photo stays device-local until photo sync ships.

### 3.2 Backend — TOTP (custom routes via `pb_hooks`)

Pocketbase has no built-in authenticator TOTP, so add JS hook routes (with a small vendored TOTP/HMAC-SHA1 helper) under `pb_hooks/`:
- `POST /api/loyalty/totp/setup` (auth required) → generates a secret, stores it in `totpPending`, returns the secret + `otpauth://` URI for QR display.
- `POST /api/loyalty/totp/enable` (auth) → body `{code}`; if it matches `totpPending`, move it to `totpSecret`, set `totpEnabled=true`, clear pending.
- `POST /api/loyalty/totp/disable` (auth) → body `{code}`; on valid code, clear `totpSecret`/`totpEnabled`.
- `POST /api/loyalty/totp/login` → body `{identity, password, code}`; verify password (Pocketbase auth), verify TOTP against `totpSecret`, then issue a normal auth token. Used instead of `authWithPassword` when `totpEnabled`.

The standard `authWithPassword` is used when `totpEnabled=false`. The client first checks whether 2FA is required (a tiny `POST /api/loyalty/totp/required {identity}` → bool, or inferred from a failed login challenge) and routes accordingly.

*If the email-OTP fallback is chosen instead, these hooks are replaced by Pocketbase's built-in MFA+OTP flow and the TOTP work disappears.*

### 3.3 Frontend — auth store (`src/lib/auth/*`)

- Wraps the Pocketbase JS SDK. `pb.authStore` is persisted to `localStorage` under a stable key.
- On app start: load persisted auth, attempt a silent token refresh; on failure keep the user "logged in" optimistically and retry later (offline-tolerant) — only an explicit logout or a hard 401 on refresh clears it.
- Exposes Svelte stores: `account` (null | {id, email/username}), `isLoggedIn`, `syncState` ('idle'|'syncing'|'offline'|'error'), `lastSyncedAt`.
- Methods: `loginGoogle()`, `loginPassword(identity, password, code?)`, `signup(...)`, `logout()`, `enableTotp()/confirmTotp(code)/disableTotp(code)`.

### 3.4 Frontend — sync engine (`src/lib/sync/*`)

- **Local writes unchanged.** Every existing mutation (add/edit/delete/reorder/favourite/use) keeps writing IndexedDB first.
- **Outbound queue:** a new IndexedDB store `syncQueue` records pending upserts/deletes by `cardId`. After each local mutation, if logged in, enqueue.
- **Flush (push):** when online + authed, upsert each queued card into Pocketbase by `(owner, cardId)`; a local delete writes `deleted=true` (tombstone) rather than removing the row. Clear queue entries on success; keep on failure.
- **Pull:** on login, on app foreground (online), and via a realtime subscription to the user's `cards`. Fetch rows with `updatedAt >` the stored cursor; for each, **last-write-wins**: apply remote to local only if `remote.updatedAt >= local.updatedAt`; a remote tombstone deletes the local card. Advance the `lastSyncedAt` cursor (per account, in localStorage).
- **Merge on first login:** push all existing local cards into the account; if the account already has cards (prior login elsewhere), the normal LWW union reconciles both sides.
- **Logout:** clears auth + cursor + queue, but **keeps local cards on the device** so the user never "loses" their wallet by logging out.

### 3.5 Frontend — account UI

- **Settings → Account section:**
  - Logged out: "Back up & sync your cards" with **Continue with Google** and **Log in / Create account** (username/email + password; optional 2FA code field shown when required). Signup inline.
  - Logged in: account identity, **Sync now**, "Last synced …", **Two-factor authentication** toggle (TOTP enroll shows QR + secret + confirm-code; disable asks for a code), **Log out**.
- **Home banner:** when logged out, a single dismissible strip: "⚠️ Your cards are only on this device — log in to back them up." Dismiss persists (localStorage); still discoverable in Settings.

## 4. Infrastructure

- **New Docker project** `/home/pi/Projects/Docker/LoyaltyCards-Sync` following the sample structure (`docker-compose.yaml`, `.env`, `.env.example`, `.gitignore`). `COMPOSE_PROJECT_NAME=loyaltycards-sync`.
- Pinned Pocketbase image; `pb_data` and `pb_hooks` mounted as volumes. Admin UI reachable only with strong admin creds from `.env` (not publicly linked; optionally Traefik-restricted).
- **Traefik** file-provider router for `loyalty-sync.holy-grail.ch` → Pocketbase, with secure-headers and a login rate-limit middleware. **Cloudflare Tunnel** hostname added.
- **PWA CSP** (`loyalty-cards.yml`) `connect-src` extended to allow the sync origin (and Google's OAuth endpoints as needed).

## 5. Security

- HTTPS end-to-end (Cloudflare/Traefik). Owner-scoped API rules enforce per-account isolation. Passwords hashed by Pocketbase (bcrypt). TOTP secrets stored in hidden fields, never returned by the API. Login rate-limited at Traefik. Admin console gated.

## 6. Testing

- **Unit:** the merge/last-write-wins reducer (remote-newer, local-newer, tombstone, first-sight) and the queue. TOTP helper (known RFC 6238 test vectors).
- **Backend integration:** owner isolation (user A cannot read/write user B's cards); TOTP setup→enable→login→disable happy + wrong-code paths. Run against an ephemeral Pocketbase container.
- **Frontend e2e (Playwright):** logged-out app still fully works + shows the banner; signup→login; a card added under account in context A appears after login in context B (two browser contexts, one backend); logout keeps local cards; offline change flushes on reconnect.

## 7. Delivery phases (one cohesive build, shipped in order)

- **Phase A — Backend + infra:** Pocketbase project, `cards` collection + rules, TOTP hooks, Docker/Traefik/Cloudflare wiring, backend tests. Deploy the backend (no user-facing change yet).
- **Phase B — Frontend auth + account UI:** auth store, Settings account section, login/signup, session persistence, Home backup banner. (Login works; sync not wired.)
- **Phase C — Sync engine:** queue, push/pull/merge, realtime, offline flush, first-login adoption, e2e. Wire mutations to the queue. Ship end-to-end.

Each phase gets its own implementation plan and is independently deployable/testable.

## 8. Non-goals (v1)

Photo/logo blob sync; card sharing / family wallets; account self-service recovery beyond Pocketbase's email reset; push notifications; admin of other users; native wallet passes.
