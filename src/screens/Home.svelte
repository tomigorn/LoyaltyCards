<script lang="ts">
  import { filtered, query, loadCards } from '../lib/stores';
  import CardTile from '../components/CardTile.svelte';
  import type { Card } from '../lib/types';
  let { onopen, onadd, onsettings }:
    { onopen: (c: Card) => void; onadd: () => void; onsettings: () => void } = $props();
  loadCards();
</script>
<header>
  <h1>Cards</h1>
  <button class="icon" onclick={onsettings} aria-label="Settings">⚙️</button>
</header>
<input class="search" placeholder="🔍 Search…" bind:value={$query} />
<div class="grid">
  {#each $filtered as card (card.id)}<CardTile {card} {onopen} />{/each}
  <button class="add" onclick={onadd} aria-label="Add card">＋</button>
</div>
<style>
  header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}
  h1{font-size:20px;margin:0}
  .icon{background:none;border:none;font-size:18px;cursor:pointer}
  .search{margin:0 16px 12px;width:calc(100% - 32px);padding:10px 12px;border-radius:10px;
    border:1px solid #2a2a30;background:#161618;color:#eee}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 24px}
  .add{aspect-ratio:1.4;border-radius:14px;border:1px dashed #3a3a42;background:#161618;
    color:#9a9aa4;font-size:28px;cursor:pointer}
</style>
