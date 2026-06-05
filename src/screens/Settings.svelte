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
<header>
  <button class="back" onclick={onback} aria-label="Back">‹</button>
  <h2>Settings</h2>
</header>

<div class="body">
  <section>
    <span class="lbl">Backup</span>
    <button class="btn" onclick={doExport}>⬇️ Export backup</button>
    <label class="btn">⬆️ Import backup<input type="file" accept="application/json" onchange={doImport} hidden /></label>
    {#if msg}<p class="msg">{msg}</p>{/if}
  </section>

  <section>
    <span class="lbl">Logos</span>
    <button class="toggle" onclick={toggleAuto}>
      <span>Auto-fetch logos</span>
      <span class="switch" class:on={autoFetch}><span class="knob"></span></span>
    </button>
    <button class="btn" onclick={clearLogos}>🗑️ Clear logo cache</button>
  </section>
</div>

<style>
  header{display:flex;align-items:center;gap:6px;padding:12px 12px 6px}
  .back{background:none;border:none;color:#e6e6ec;font-size:30px;line-height:1;cursor:pointer;
    width:40px;height:40px;border-radius:10px}
  .back:active{background:#1a1a20}
  h2{font-size:19px;margin:0}
  .body{display:flex;flex-direction:column;gap:22px;padding:8px 16px 40px}
  section{display:flex;flex-direction:column;gap:8px}
  .lbl{color:#9a9aa6;font-size:13px;margin:0 2px 2px}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:12px;
    border:1px solid #33333a;background:#1a1a20;color:#e6e6ec;font-size:15px;cursor:pointer;
    -webkit-tap-highlight-color:transparent}
  .btn:active{background:#23232b}
  .msg{color:#7ad17a;font-size:14px;margin:2px 2px 0;text-align:center}
  .toggle{display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:12px;
    border:1px solid #2a2a30;background:#161618;color:#e6e6ec;font-size:15px;cursor:pointer}
  .switch{width:46px;height:28px;border-radius:14px;background:#3a3a42;position:relative;transition:background .15s}
  .switch.on{background:#2a6df4}
  .knob{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .15s}
  .switch.on .knob{left:21px}
</style>
