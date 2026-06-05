<script lang="ts">
  import { exportBackup, importBackup } from '../lib/backup';
  import { clearLogoCache } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import { getAutoFetch, setAutoFetch } from '../lib/settings';
  import { clearFailedDomains } from '../lib/logo/fetch';

  let { onback }: { onback: () => void } = $props();
  let msg = $state('');
  let autoFetch = $state(getAutoFetch());
  function toggleAuto() { autoFetch = !autoFetch; setAutoFetch(autoFetch); }
  async function clearLogos() { await clearLogoCache(); clearFailedDomains(); msg = 'Logo cache cleared ✓'; }

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
</script>
<header><button onclick={onback}>← Back</button><h2>Settings</h2></header>
<section>
  <button onclick={doExport}>⬇️ Export backup</button>
  <label class="imp">⬆️ Import backup<input type="file" accept="application/json" onchange={doImport} /></label>
  {#if msg}<p>{msg}</p>{/if}
</section>
<section>
  <h3>Logos</h3>
  <label class="row"><input type="checkbox" checked={autoFetch} onchange={toggleAuto} /> Auto-fetch logos</label>
  <button onclick={clearLogos}>Clear logo cache</button>
</section>
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  section{margin:12px 16px}button{cursor:pointer;margin-right:8px}
  .imp input{display:none}.imp{cursor:pointer;color:#6ea8fe}
  .row{display:flex;align-items:center;gap:12px;padding:8px}
</style>
