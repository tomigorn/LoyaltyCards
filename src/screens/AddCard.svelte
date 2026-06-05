<script lang="ts">
  import ScannerView from '../components/ScannerView.svelte';
  import ShopSuggest from '../components/ShopSuggest.svelte';
  import { FORMATS, FORMAT_LABELS, validateBarcode } from '../lib/barcode/formats';
  import { findCatalogEntry, findCatalogById, displayName } from '../lib/catalog/catalog';
  import { detectBrand } from '../lib/barcode/detect';
  import { putCard, getAllCards } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import type { BarcodeFormat, Card, CatalogEntry } from '../lib/types';
  let { ondone, oncancel }: { ondone: () => void; oncancel: () => void } = $props();

  let mode = $state<'choose'|'scan'|'manual'|'ocr'>('choose');
  let value = $state(''); let format = $state<BarcodeFormat>('ean13'); let storeName = $state('');
  let err = $state('');
  let warn = $state('');
  let formatTouched = $state(false);
  let catalogId = $state<string | undefined>(undefined);
  let brandColor = $state<string | undefined>(undefined);
  let picked = $state(false);

  // OCR state
  let ocrReading = $state(false);
  let ocrSuggestions = $state<CatalogEntry[]>([]);
  let photoInput = $state<HTMLInputElement | null>(null);

  function pick(e: CatalogEntry) {
    storeName = displayName(e); catalogId = e.id; brandColor = e.brandColor;
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
    if (!picked) {
      const detected = detectBrand(r.value);
      if (detected) {
        storeName = displayName(detected); catalogId = detected.id; brandColor = detected.brandColor;
        picked = true;
        // formatTouched is already true — keep the scanned format, not the catalog defaultFormat
      }
    }
  }

  // Editing the number or format clears a pending "save anyway" warning,
  // so a changed value is re-validated from scratch.
  $effect(() => { value; format; warn = ''; });

  async function save() {
    if (!storeName.trim()) { err = 'Enter a store name'; return; }
    if (!value.trim()) { err = 'Enter a number'; return; }
    err = '';
    const v = validateBarcode(format, value);
    if (!v.ok && !warn) {
      // Soft guard: warn once, but let the user add the card anyway on the next tap.
      warn = `${v.error ?? "This doesn't look like a valid barcode"} — tap "Save anyway" to add it.`;
      return;
    }
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

  function triggerPhotoInput() {
    photoInput?.click();
  }

  async function onPhotoSelected(evt: Event) {
    const input = evt.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    mode = 'ocr';
    ocrReading = true;
    ocrSuggestions = [];

    try {
      const { recognizeText, suggestShopsFromText } = await import('../lib/ocr/ocr');
      const text = await recognizeText(file);
      const suggestions = suggestShopsFromText(text);

      if (suggestions.length > 0) {
        ocrSuggestions = suggestions;
        ocrReading = false;
      } else {
        // No useful matches — pre-fill storeName with first plausible line
        const firstLine = text.split(/\r?\n/).map(l => l.trim())
          .find(l => /[a-zA-Z]{3,}/.test(l));
        if (firstLine) storeName = firstLine.replace(/[^a-zA-Z0-9 &'-]/g, '').trim().slice(0, 50);
        mode = 'manual';
      }
    } catch {
      // OCR failed — fall through to manual
      mode = 'manual';
    }
  }

  function pickOcrSuggestion(e: CatalogEntry) {
    pick(e);
    mode = 'manual';
  }
</script>
<header><button onclick={oncancel}>← Cancel</button><h2>Add card</h2></header>

{#if mode === 'choose'}
  <!-- Hidden file input for photo capture — inside choose block so it doesn't exist in manual mode -->
  <input
    type="file"
    accept="image/*"
    capture="environment"
    style="display:none"
    bind:this={photoInput}
    onchange={onPhotoSelected}
  />
  <button class="big" onclick={() => mode = 'scan'}>📷 Scan barcode</button>
  <button class="big" onclick={triggerPhotoInput}>🖼️ Photo of card</button>
  <button class="big" onclick={() => mode = 'manual'}>⌨️ Enter manually</button>
{:else if mode === 'scan'}
  <ScannerView onresult={onScan} />
  <button onclick={() => mode = 'manual'}>Enter manually instead</button>
{:else if mode === 'ocr'}
  {#if ocrReading}
    <p class="ocr-status">Reading card…</p>
  {:else}
    <p class="ocr-hint">Found possible matches — tap one to use it:</p>
    <div class="ocr-list">
      {#each ocrSuggestions as e (e.id)}
        <button class="ocr-opt" onclick={() => pickOcrSuggestion(e)}>
          <span class="nm">{displayName(e)}</span><span class="cc">{e.country}</span>
        </button>
      {/each}
    </div>
    <button class="link-btn" onclick={() => mode = 'manual'}>None of these — enter manually</button>
  {/if}
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
  {#if warn}<p class="warn">⚠️ {warn}</p>{/if}
  <button class="big" onclick={save}>{warn ? 'Save anyway' : 'Save'}</button>
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
  .warn{color:#ffcf66;margin:6px 16px;font-size:14px}

  /* OCR styles */
  .ocr-status{color:#aac;margin:24px 16px;font-size:16px;text-align:center}
  .ocr-hint{color:#8a8a94;margin:12px 16px 4px;font-size:13px}
  .ocr-list{background:#1b1b20;border:1px solid #33333a;border-radius:10px;overflow:hidden;margin:4px 16px 0}
  .ocr-opt{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;background:none;
    border:none;border-bottom:1px solid #26262c;color:#eee;cursor:pointer;text-align:left;font-size:15px}
  .ocr-opt:last-child{border-bottom:none}
  .nm{font-size:14px}.cc{margin-left:auto;color:#8a8a94;font-size:11px;border:1px solid #3a3a42;border-radius:5px;padding:1px 5px}
  .link-btn{display:block;margin:14px 16px;background:none;border:none;color:#6a8ef0;font-size:14px;
    padding:0;text-decoration:underline}
</style>
