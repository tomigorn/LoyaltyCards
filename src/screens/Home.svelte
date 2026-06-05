<script lang="ts">
  import { get } from 'svelte/store';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { filtered, query, loadCards, sortMode, setSort } from '../lib/stores';
  import { putCard } from '../lib/db';
  import { longpress } from '../lib/actions/longpress';
  import CardTile from '../components/CardTile.svelte';
  import type { Card } from '../lib/types';

  let { onopen, onadd, onsettings }:
    { onopen: (c: Card) => void; onadd: () => void; onsettings: () => void } = $props();

  loadCards();

  let reorderMode = $state(false);
  let items = $state<Card[]>([]);

  async function enterReorder() {
    if (get(sortMode) !== 'custom') {
      // seed custom order from the current visual order so nothing jumps
      const list = get(filtered);
      for (let i = 0; i < list.length; i++) {
        if (list[i].order !== i) await putCard({ ...list[i], order: i });
      }
      await loadCards();
      setSort('custom');
    }
    items = get(filtered).map(c => ({ ...c }));   // working copy for dndzone (needs `id`)
    reorderMode = true;
  }

  function handleConsider(e: CustomEvent<DndEvent<Card>>) {
    items = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<DndEvent<Card>>) {
    items = e.detail.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].order !== i) {
        items[i] = { ...items[i], order: i };
        await putCard(items[i]);
      }
    }
    await loadCards();
  }

  function doneReorder() {
    reorderMode = false;
  }

  function handleSortChange(e: Event) {
    setSort((e.target as HTMLSelectElement).value as import('../lib/types').SortMode);
  }

  // no-op for reorder mode taps
  function noop(_c: Card) {}
</script>

{#if reorderMode}
  <header>
    <h1>Cards</h1>
    <button class="done-btn" onclick={doneReorder}>Done ✓</button>
  </header>
  <div
    class="grid"
    use:dndzone={{ items, flipDurationMs: 150 }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
  >
    {#each items as card (card.id)}
      <div class="drag-wrap">
        <CardTile {card} onopen={noop} />
      </div>
    {/each}
  </div>
{:else}
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
  <div class="grid">
    {#each $filtered as card (card.id)}
      <div
        class="tile-wrap"
        use:longpress={{ onlongpress: enterReorder }}
        role="presentation"
      >
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
  .tile-wrap{display:contents}
  .drag-wrap{display:block}              /* a real grid cell; the tile fills it (width:100%) */
  .add{aspect-ratio:1.4;border-radius:14px;border:1px dashed #3a3a42;background:#161618;
    color:#9a9aa4;font-size:28px;cursor:pointer}
  /* iOS/Android-style wiggle while reordering (on the tile, not the dnd-moved wrapper) */
  @keyframes wiggle { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }
  .drag-wrap :global(.tile){ animation: wiggle 0.26s ease-in-out infinite; transform-origin:center }
  .drag-wrap:nth-child(odd) :global(.tile){ animation-delay:-0.13s }
  .done-btn{background:#3a7bd5;color:#fff;border:none;border-radius:10px;
    padding:8px 18px;font-size:15px;font-weight:600;cursor:pointer}
</style>
