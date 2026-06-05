<script lang="ts">
  import { matchShop } from '../lib/catalog/match';
  import { displayName } from '../lib/catalog/catalog';
  import type { CatalogEntry } from '../lib/types';
  let { query, onpick }: { query: string; onpick: (e: CatalogEntry) => void } = $props();
  const results = $derived(matchShop(query, 5));
</script>
{#if query.trim() && results.length}
  <div class="menu">
    {#each results as e (e.id)}
      <button class="opt" onclick={() => onpick(e)}>
        <span class="nm">{displayName(e)}</span><span class="cc">{e.country}</span>
      </button>
    {/each}
  </div>
{/if}
<style>
  .menu{background:#1b1b20;border:1px solid #33333a;border-radius:10px;overflow:hidden;margin:4px 16px 0}
  .opt{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;background:none;border:none;
    border-bottom:1px solid #26262c;color:#eee;cursor:pointer;text-align:left}
  .opt:last-child{border-bottom:none}
  .nm{font-size:14px}.cc{margin-left:auto;color:#8a8a94;font-size:11px;border:1px solid #3a3a42;border-radius:5px;padding:1px 5px}
</style>
