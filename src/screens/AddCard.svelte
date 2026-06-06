<script lang="ts">
  import ScannerView from '../components/ScannerView.svelte';
  import ShopSuggest from '../components/ShopSuggest.svelte';
  import { FORMATS, FORMAT_LABELS, validateBarcode } from '../lib/barcode/formats';
  import { findCatalogEntry, findCatalogById, displayName } from '../lib/catalog/catalog';
  import { detectBrand } from '../lib/barcode/detect';
  import { loadLearnedPrefixes, rememberPrefix } from '../lib/barcode/learned';
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

  // Load the user's self-learned barcode→brand prefixes so detect() can suggest a shop.
  loadLearnedPrefixes();

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

  // Manual entry: if the user types a number we recognise (from a learned/curated prefix)
  // and hasn't named a shop yet, suggest the brand. Non-destructive — never overrides a
  // shop the user already chose or typed.
  $effect(() => {
    if (mode === 'manual' && !picked && !storeName.trim() && value.replace(/\D/g, '').length >= 7) {
      const detected = detectBrand(value);
      if (detected) { storeName = displayName(detected); catalogId = detected.id; brandColor = detected.brandColor; }
    }
  });

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
    await putCard(card);
    // Learn this barcode's prefix → brand so a future card from the same retailer auto-detects.
    if (cat?.id) await rememberPrefix(value, cat.id);
    await loadCards(); ondone();
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
      const { detectFromImage } = await import('../lib/barcode/scan');
      const { recognizeText, suggestShopsFromText } = await import('../lib/ocr/ocr');

      const fillShop = (text: string) => {
        if (storeName) return;
        const s = suggestShopsFromText(text);
        if (s.length > 0) { pick(s[0]); return; }
        const l = text.split(/\r?\n/).map((x) => x.trim()).find((x) => /[a-zA-Z]{3,}/.test(x));
        if (l) storeName = l.replace(/[^a-zA-Z0-9 &'-]/g, '').trim().slice(0, 50);
      };

      // 1) Decode the barcode/QR straight from the image (the card number + format).
      const scanned = await detectFromImage(file).catch(() => null);
      if (scanned) {
        // Got the code — show the form immediately; read the shop name in the background.
        value = scanned.value; format = scanned.format; formatTouched = true;
        mode = 'manual';
        recognizeText(file).then(fillShop).catch(() => {});
        return;
      }

      // 2) No code — fall back to OCR for the shop name.
      const text = await recognizeText(file).catch(() => '');
      const suggestions = suggestShopsFromText(text);
      if (suggestions.length > 0) { ocrSuggestions = suggestions; ocrReading = false; }
      else { fillShop(text); mode = 'manual'; }
    } catch {
      mode = 'manual';
    }
  }

  function pickOcrSuggestion(e: CatalogEntry) {
    pick(e);
    mode = 'manual';
  }
</script>
<header>
  <button class="back" onclick={oncancel} aria-label="Cancel">‹</button>
  <h2>Add card</h2>
</header>

<div class="body">
{#if mode === 'choose'}
  <!-- hidden file input (inside choose so it's absent in manual mode). No `capture` so it
       opens the normal picker — pick an existing photo (or take one); live scanning is the
       "Scan barcode" option. -->
  <input type="file" accept="image/*" style="display:none"
    bind:this={photoInput} onchange={onPhotoSelected} />
  <button class="opt" onclick={() => mode = 'scan'}>
    <span class="ic">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M4 12h16"/></svg>
    </span><span class="t"><b>Scan barcode</b><small>Point the camera at the card</small></span><span class="ch">›</span>
  </button>
  <button class="opt" onclick={triggerPhotoInput}>
    <span class="ic">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>
    </span><span class="t"><b>Photo of card</b><small>Pick a photo — reads its barcode/QR and shop</small></span><span class="ch">›</span>
  </button>
  <button class="opt" onclick={() => mode = 'manual'}>
    <span class="ic">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9.5 14h5"/></svg>
    </span><span class="t"><b>Enter manually</b><small>Type the name &amp; number</small></span><span class="ch">›</span>
  </button>
{:else if mode === 'scan'}
  <ScannerView onresult={onScan} />
  <button class="btn" onclick={() => mode = 'manual'}>Enter manually instead</button>
{:else if mode === 'ocr'}
  {#if ocrReading}
    <p class="ocr-status">Reading card…</p>
  {:else}
    <span class="lbl">Found possible matches — tap one</span>
    <div class="list">
      {#each ocrSuggestions as e (e.id)}
        <button class="row" onclick={() => pickOcrSuggestion(e)}>
          <span class="nm">{displayName(e)}</span><span class="cc">{e.country}</span>
        </button>
      {/each}
    </div>
    <button class="btn" onclick={() => mode = 'manual'}>None of these — enter manually</button>
  {/if}
{:else}
  <label class="field">
    <span class="lbl">Store name</span>
    <input class="text" bind:value={storeName} placeholder="e.g. Migros" />
  </label>
  <ShopSuggest query={storeName} onpick={pick} />
  <label class="field">
    <span class="lbl">Number</span>
    <input class="text" bind:value inputmode="numeric" />
  </label>
  <label class="field">
    <span class="lbl">Format</span>
    <select class="text" bind:value={format} onchange={() => formatTouched = true}>
      {#each FORMATS as f}<option value={f}>{FORMAT_LABELS[f]}</option>{/each}
    </select>
  </label>
  {#if err}<p class="err">{err}</p>{/if}
  {#if warn}<p class="warn">{warn}</p>{/if}
  <button class="btn primary" onclick={save}>{warn ? 'Save anyway' : 'Save'}</button>
{/if}
</div>

<style>
  header{display:flex;align-items:center;gap:6px;padding:12px 12px 6px}
  .back{background:none;border:none;color:#e6e6ec;font-size:30px;line-height:1;cursor:pointer;
    width:40px;height:40px;border-radius:10px}
  .back:active{background:#1a1a20}
  h2{font-size:19px;margin:0}
  .body{display:flex;flex-direction:column;gap:12px;padding:8px 16px 40px}
  .field{display:block}
  .lbl{display:block;color:#9a9aa6;font-size:13px;margin:0 2px 6px}
  .text{width:100%;padding:12px;border-radius:12px;border:1px solid #2a2a30;background:#161618;
    color:#eee;font-size:15px;font-family:inherit}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:12px;
    border:1px solid #33333a;background:#1a1a20;color:#e6e6ec;font-size:15px;cursor:pointer;
    -webkit-tap-highlight-color:transparent}
  .btn:active{background:#23232b}
  .btn.primary{background:#2a6df4;border:none;font-weight:600;font-size:16px;margin-top:6px}
  /* choose-mode option cards */
  .opt{display:flex;align-items:center;gap:14px;padding:16px;border-radius:14px;border:1px solid #2a2a30;
    background:#161618;color:#e6e6ec;cursor:pointer;text-align:left;-webkit-tap-highlight-color:transparent}
  .opt:active{background:#1e1e24}
  .opt .ic{width:28px;display:flex;align-items:center;justify-content:center;color:#b9b9c4}
  .opt .t{flex:1;display:flex;flex-direction:column;gap:2px}
  .opt .t b{font-size:16px}
  .opt .t small{color:#8a8a94;font-size:13px}
  .opt .ch{color:#666;font-size:22px}
  .err{color:#f88;margin:2px 2px;font-size:14px}
  .warn{color:#ffcf66;margin:2px 2px;font-size:14px}
  .ocr-status{color:#aac;margin:28px 0;font-size:16px;text-align:center}
  .list{background:#161618;border:1px solid #2a2a30;border-radius:12px;overflow:hidden}
  .row{display:flex;align-items:center;gap:10px;width:100%;padding:14px;background:none;border:none;
    border-bottom:1px solid #23232b;color:#eee;cursor:pointer;text-align:left;font-size:15px}
  .row:last-child{border-bottom:none}
  .nm{font-size:15px}
  .cc{margin-left:auto;color:#8a8a94;font-size:11px;border:1px solid #3a3a42;border-radius:5px;padding:1px 6px}
</style>
