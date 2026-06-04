<script lang="ts">
  import ScannerView from '../components/ScannerView.svelte';
  import { FORMATS, FORMAT_LABELS, validateBarcode } from '../lib/barcode/formats';
  import { findCatalogEntry } from '../lib/catalog/catalog';
  import { putCard } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import type { BarcodeFormat, Card } from '../lib/types';
  let { ondone, oncancel }: { ondone: () => void; oncancel: () => void } = $props();

  let mode = $state<'choose'|'scan'|'manual'>('choose');
  let value = $state(''); let format = $state<BarcodeFormat>('ean13'); let storeName = $state('');
  let err = $state('');

  function onScan(r: { value: string; format: BarcodeFormat }) {
    value = r.value; format = r.format; mode = 'manual';
  }
  async function save() {
    const v = validateBarcode(format, value);
    if (!v.ok) { err = v.error ?? 'Invalid barcode'; return; }
    if (!storeName.trim()) { err = 'Enter a store name'; return; }
    const cat = findCatalogEntry(storeName);
    const now = Date.now();
    const card: Card = {
      id: crypto.randomUUID(), storeName: storeName.trim(), barcodeValue: value,
      barcodeFormat: format, brandColor: cat?.brandColor ?? '#444',
      logo: { source: cat ? 'catalog' : 'generated' }, notes: '',
      favorite: false, order: now, createdAt: now, updatedAt: now,
    };
    await putCard(card); await loadCards(); ondone();
  }
</script>
<header><button onclick={oncancel}>← Cancel</button><h2>Add card</h2></header>
{#if mode === 'choose'}
  <button class="big" onclick={() => mode = 'scan'}>📷 Scan barcode</button>
  <button class="big" onclick={() => mode = 'manual'}>⌨️ Enter manually</button>
{:else if mode === 'scan'}
  <ScannerView onresult={onScan} />
  <button onclick={() => mode = 'manual'}>Enter manually instead</button>
{:else}
  <label>Store name<input bind:value={storeName} placeholder="e.g. Migros" /></label>
  <label>Number<input bind:value /></label>
  <label>Format
    <select bind:value={format}>
      {#each FORMATS as f}<option value={f}>{FORMAT_LABELS[f]}</option>{/each}
    </select>
  </label>
  {#if err}<p class="err">{err}</p>{/if}
  <button class="big" onclick={save}>Save</button>
{/if}
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  button{cursor:pointer}
  .big{display:block;width:calc(100% - 32px);margin:10px 16px;padding:14px;border-radius:12px;
    border:none;background:#2a6df4;color:#fff;font-size:16px}
  label{display:block;margin:10px 16px;color:#cdd}
  input,select{width:100%;padding:10px;margin-top:4px;border-radius:10px;border:1px solid #2a2a30;
    background:#161618;color:#eee}
  .err{color:#f88;margin:6px 16px}
</style>
