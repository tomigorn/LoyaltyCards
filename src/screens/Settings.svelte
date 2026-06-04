<script lang="ts">
  import { exportBackup, importBackup } from '../lib/backup';
  import { putCard } from '../lib/db';
  import { cards, loadCards } from '../lib/stores';
  import { get } from 'svelte/store';
  let { onback }: { onback: () => void } = $props();
  let msg = $state('');

  async function doExport() {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `loyaltycards-backup.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }
  async function doImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
    try { await importBackup(await file.text(), 'replace'); await loadCards(); msg = 'Imported ✓'; }
    catch (err) { msg = 'Import failed: ' + (err as Error).message; }
  }
  async function move(id: string, dir: -1 | 1) {
    const list = [...get(cards)];
    const i = list.findIndex(c => c.id === id); const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = { ...list[i], order: list[j].order }, b = { ...list[j], order: list[i].order };
    await putCard(a); await putCard(b); await loadCards();
  }
</script>
<header><button onclick={onback}>← Back</button><h2>Settings</h2></header>
<section>
  <button onclick={doExport}>⬇️ Export backup</button>
  <label class="imp">⬆️ Import backup<input type="file" accept="application/json" onchange={doImport} /></label>
  {#if msg}<p>{msg}</p>{/if}
</section>
<section>
  <h3>Reorder cards</h3>
  {#each $cards as c (c.id)}
    <div class="row"><span>{c.storeName}</span>
      <button onclick={() => move(c.id, -1)}>↑</button>
      <button onclick={() => move(c.id, 1)}>↓</button>
    </div>
  {/each}
</section>
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  section{margin:12px 16px}button{cursor:pointer;margin-right:8px}
  .imp input{display:none}.imp{cursor:pointer;color:#6ea8fe}
  .row{display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #222}
</style>
