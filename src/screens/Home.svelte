<script lang="ts">
  import { get } from 'svelte/store';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { filtered, query, cards, loadCards, sortMode, setSort } from '../lib/stores';
  import { sortCards } from '../lib/sort';
  import { putCard } from '../lib/db';
  import { longpress } from '../lib/actions/longpress';
  import CardTile from '../components/CardTile.svelte';
  import type { Card, SortMode } from '../lib/types';

  let { onopen, onadd, onsettings }:
    { onopen: (c: Card) => void; onadd: () => void; onsettings: () => void } = $props();

  loadCards();

  let reorderMode = $state(false);
  let items = $state<Card[]>([]);

  async function enterReorder() {
    query.set('');                                   // reorder the full list, not a filtered subset
    if (get(sortMode) !== 'custom') {
      // seed custom order from the current visual order so nothing jumps
      const list = sortCards(get(cards), get(sortMode));
      for (let i = 0; i < list.length; i++) {
        if (list[i].order !== i) await putCard({ ...list[i], order: i });
      }
      await loadCards();
      setSort('custom');
    }
    items = sortCards(get(cards), 'custom').map(c => ({ ...c }));
    reorderMode = true;
  }

  function handleConsider(e: CustomEvent<DndEvent<Card>>) { items = e.detail.items; }
  function handleFinalize(e: CustomEvent<DndEvent<Card>>) { items = e.detail.items; }

  // The Done button is the single, explicit save point. svelte-dnd-action's item
  // objects aren't structured-cloneable (IndexedDB put throws), so we take only the new
  // id ORDER from them and persist the clean card objects from the store.
  async function save() {
    const orderedIds = items.map(c => c.id);
    reorderMode = false;
    const byId = new Map(get(cards).map(c => [c.id, c]));
    for (let i = 0; i < orderedIds.length; i++) {
      const c = byId.get(orderedIds[i]);
      if (c && c.order !== i) await putCard({ ...c, order: i });
    }
    await loadCards();
  }

  function handleSortChange(e: Event) { setSort((e.target as HTMLSelectElement).value as SortMode); }
  function noop(_c: Card) {}
</script>

<!-- Header + search stay identical in both modes so nothing shifts -->
<header>
  <h1>Cards</h1>
  <div class="header-right">
    <select class="sort-select" value={$sortMode} onchange={handleSortChange} aria-label="Sort order">
      <option value="lastUsed">Last used</option>
      <option value="alpha">A–Z</option>
      <option value="added">Date added</option>
      <option value="custom">Custom</option>
    </select>
    <button class="icon" onclick={onsettings} aria-label="Settings">⚙️</button>
  </div>
</header>
<input class="search" placeholder="🔍 Search…" bind:value={$query} />

{#if reorderMode}
  <div class="grid pad-bottom" use:dndzone={{ items, flipDurationMs: 150, dropTargetStyle: {} }}
       onconsider={handleConsider} onfinalize={handleFinalize}>
    {#each items as card (card.id)}
      <div class="drag-wrap"><CardTile {card} onopen={noop} /></div>
    {/each}
  </div>
  <div class="reorder-bar"><button class="done-btn" onclick={save}>Done ✓</button></div>
{:else}
  <div class="grid">
    {#each $filtered as card (card.id)}
      <div class="tile-wrap" use:longpress={{ onlongpress: enterReorder }} role="presentation">
        <CardTile {card} {onopen} />
      </div>
    {/each}
    <button class="add" onclick={onadd} aria-label="Add card">＋</button>
  </div>
{/if}

<style>
  header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}
  h1{font-size:20px;margin:0}
  .header-right{display:flex;align-items:center;gap:8px}
  .icon{background:none;border:none;font-size:18px;cursor:pointer}
  .sort-select{background:#1e1e24;color:#ccc;border:1px solid #3a3a42;border-radius:8px;
    padding:5px 8px;font-size:13px;cursor:pointer}
  .search{margin:0 16px 12px;width:calc(100% - 32px);padding:10px 12px;border-radius:10px;
    border:1px solid #2a2a30;background:#161618;color:#eee}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 24px}
  .pad-bottom{padding-bottom:96px}                /* clear the fixed Done bar */
  .tile-wrap{display:contents}
  /* real grid cell; the whole tile is the drag handle on touch (not just the logo) */
  .drag-wrap{display:block;touch-action:none;-webkit-user-drag:none;user-select:none}
  /* every part of the tile is a drag surface (no scroll-instead-of-drag anywhere on it) */
  .drag-wrap :global(*){touch-action:none}
  .drag-wrap :global(img){pointer-events:none;-webkit-user-drag:none;user-select:none}
  .add{aspect-ratio:1.4;border-radius:14px;border:1px dashed #3a3a42;background:#161618;
    color:#9a9aa4;font-size:28px;cursor:pointer}
  /* iOS/Android-style wiggle while reordering (on the tile, not the dnd-moved wrapper) */
  @keyframes wiggle { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }
  .drag-wrap :global(.tile){ animation: wiggle 0.26s ease-in-out infinite; transform-origin:center }
  .drag-wrap:nth-child(odd) :global(.tile){ animation-delay:-0.13s }
  .reorder-bar{position:fixed;left:0;right:0;bottom:0;padding:12px 16px;
    background:linear-gradient(transparent,#0b0b0d 45%);display:flex;justify-content:center}
  .done-btn{width:100%;max-width:360px;background:#2a6df4;color:#fff;border:none;border-radius:12px;
    padding:14px;font-size:16px;font-weight:600;cursor:pointer}
</style>
