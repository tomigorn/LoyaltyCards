<script lang="ts">
  import ScannerView from '../components/ScannerView.svelte';
  import ShopSuggest from '../components/ShopSuggest.svelte';
  import { FORMATS, FORMAT_LABELS, validateBarcode } from '../lib/barcode/formats';
  import { findCatalogEntry, findCatalogById } from '../lib/catalog/catalog';
  import { putCard, getAllCards } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import type { BarcodeFormat, Card, CatalogEntry } from '../lib/types';
  let { ondone, oncancel }: { ondone: () => void; oncancel: () => void } = $props();

  let mode = $state<'choose'|'scan'|'manual'>('choose');
  let value = $state(''); let format = $state<BarcodeFormat>('ean13'); let storeName = $state('');
  let err = $state('');
  let formatTouched = $state(false);
  let catalogId = $state<string | undefined>(undefined);
  let brandColor = $state<string | undefined>(undefined);
  let picked = $state(false);

  function pick(e: CatalogEntry) {
    storeName = e.name; catalogId = e.id; brandColor = e.brandColor;
    if (!formatTouched && e.defaultFormat) format = e.defaultFormat;
    picked = true;
  }

  $effect(() => {
    if (!formatTouched && !picked) {
      const entry = findCatalogEntry(storeName);
      if (entry?.defaultFormat) format = entry.defaultFormat;
    }
  });

  function onScan(r: { value: string; format: BarcodeFormat }) {
    value = r.value; format = r.format; formatTouched = true; mode = 'manual';
  }
  async function save() {
    const v = validateBarcode(format, value);
    if (!v.ok) { err = v.error ?? 'Invalid barcode'; return; }
    if (!storeName.trim()) { err = 'Enter a store name'; return; }
    const cat = catalogId ? findCatalogById(catalogId) : findCatalogEntry(storeName);
    const now = Date.now();
    const all = await getAllCards();
    const order = all.reduce((m, c) => Math.max(m, c.order), 0) + 1;
    const card: Card = {
      id: crypto.randomUUID(), storeName: storeName.trim(), barcodeValue: value,
      barcodeFormat: format, brandColor: cat?.brandColor ?? '#444',
      logo: { source: cat ? 'catalog' : 'generated' }, catalogId: cat?.id, notes: '',
      favorite: false, order, createdAt: now, updatedAt: now,
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
  <ShopSuggest query={storeName} onpick={pick} />
  <label>Number<input bind:value /></label>
  <label>Format
    <select bind:value={format} onchange={() => formatTouched = true}>
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
