# Sort modes & long-press reorder — Design

**Date:** 2026-06-05 · **Status:** Approved (pre-authorised) → implementation

Replace the Settings drag-reorder with: a **sort control on the home screen** (4 modes) and
**long-press-on-a-card to rearrange**, with manual reordering allowed only in the Custom mode.

## Sort modes
`SortMode = 'lastUsed' | 'alpha' | 'added' | 'custom'`, persisted in localStorage. **Default: `lastUsed`.**
- **lastUsed** — most recently shown at the till first (desc by `lastUsedAt`, fallback `createdAt`).
- **alpha** — A→Z by `storeName` (`localeCompare`).
- **added** — newest first (desc `createdAt`).
- **custom** — the user's hand-arranged order (asc `order`).

### Favorites rule (decided)
In the three auto modes, **favorites sort to the top first**, then the mode applies. In
**custom**, the hand order is exact — favorites get **no** special pinning.

### Pure sort (testable)
`sortCards(cards: Card[], mode: SortMode): Card[]` — pure, unit-tested. Search filtering stays
separate (filter then sort). `stores.filtered` derives from `[cards, query, sortMode]`.

## Data
- `Card` gains `lastUsedAt?: number`. Set to `Date.now()` when a card's barcode is opened
  (Checkout). Additive/optional — existing cards fall back to `createdAt` for the lastUsed sort.

## Home UI
- A **sort selector** near the top (e.g. a small `Sort: Last used ▾` control / `<select>`),
  bound to the persisted `sortMode`.
- **Long-press a card (~500 ms)** → enter **reorder mode**:
  - If not already in `custom`, switch to `custom` first, seeding `order` from the current
    visual order (so nothing jumps), then allow rearranging. (This honours "reorder only in
    user-preference" — you end up in Custom.)
  - In reorder mode the grid is a touch drag-zone (`svelte-dnd-action`); tap-to-open is
    disabled; a **Done ✓** button (and tapping empty space) exits. The `+` add-tile is hidden.
  - On finalize: `order = index` for each card, persist via `putCard`, stay in `custom`.
- A short `longpress` Svelte action (pointerdown + ~500 ms timer, cancelled on move/up) drives it.

## Settings
- Remove the old "Reorder cards" drag list (superseded by home long-press). Keep export/import,
  auto-fetch toggle, clear-cache.

## Testing
- Unit: `sortCards` for all four modes incl. the favorites rule and the `lastUsedAt`→`createdAt`
  fallback. Existing e2e stays green; drag/long-press verified manually + a lightweight e2e if
  feasible (sort selector changing order is easy to assert; long-press drag is not — keep it manual).

## Rollout
Branch `sort-and-reorder`, ship as `0.4.0`. Chunks: (S1) data+sort+lastUsed, (S2) home UI+reorder,
remove Settings reorder.
