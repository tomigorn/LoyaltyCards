<script lang="ts">
  import PhotoField from '../components/PhotoField.svelte';
  import LogoPicker from '../components/LogoPicker.svelte';
  import { putCard, deleteCard, putImage, deleteImage } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import { logoDevFetcher } from '../lib/logo/fetch';
  import { resolveCardLogo, resolveCardColor } from '../lib/logo/resolveCard';
  import { findCatalogById } from '../lib/catalog/catalog';
  import type { Card } from '../lib/types';
  let { card, ondone, ondeleted }:
    { card: Card; ondone: () => void; ondeleted: () => void } = $props();
  let draft = $state<Card>({ ...card });
  let showPicker = $state(false);
  let logoUrl = $state('');
  let effColor = $state('#2a2a30');   // the effective tile colour (override or auto)
  $effect(() => {
    let made = '';
    const snap = $state.snapshot(draft) as Card;
    resolveCardLogo(snap).then(u => { logoUrl = u; made = u; });
    resolveCardColor(snap).then(c => { effColor = c; });
    return () => { if (made.startsWith('blob:')) URL.revokeObjectURL(made); };
  });
  function setTileColor(e: Event) { draft.tileColor = (e.currentTarget as HTMLInputElement).value; }
  function resetTileColor() { draft.tileColor = undefined; }

  async function pickLogo(url: string) {
    showPicker = false;
    if (draft.logo.blobRef) await deleteImage(draft.logo.blobRef);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const key = crypto.randomUUID();
        await putImage(key, await res.blob());
        draft.logo = { source: 'uploaded', blobRef: key };
        return;
      }
    } catch { /* CORS / network — fall back to the URL */ }
    draft.logo = { source: 'fetched', url };
  }
  async function uploadLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
    if (draft.logo.blobRef) await deleteImage(draft.logo.blobRef);
    const key = crypto.randomUUID(); await putImage(key, file);
    draft.logo = { source: 'uploaded', blobRef: key };
  }
  async function fetchLogo() {
    const domain = draft.catalogId ? findCatalogById(draft.catalogId)?.domain
      : draft.storeName.trim().toLowerCase().replace(/\s+/g, '') + '.com';
    if (!domain) return;
    const blob = await logoDevFetcher.fetchLogo(domain);
    if (!blob) { alert('No logo found online.'); return; }
    if (draft.logo.blobRef) await deleteImage(draft.logo.blobRef);
    const key = crypto.randomUUID(); await putImage(key, blob);
    draft.logo = { source: 'fetched', blobRef: key };
  }
  async function save() {
    draft.updatedAt = Date.now();
    await putCard($state.snapshot(draft) as Card);   // snapshot: $state isn't clone-able for IndexedDB
    await loadCards();
    ondone();
  }
  async function remove() {
    for (const ref of [card.logo.blobRef, card.frontPhotoRef, card.backPhotoRef]) if (ref) await deleteImage(ref);
    await deleteCard(card.id); await loadCards(); ondeleted();
  }
  const isTile = $derived(logoUrl.startsWith('data:'));
</script>

<header>
  <button class="back" onclick={ondone} aria-label="Back">‹</button>
  <h2>Edit card</h2>
</header>

<div class="body">
  <label class="field">
    <span class="lbl">Name</span>
    <input class="text" bind:value={draft.storeName} />
  </label>

  <div class="field">
    <span class="lbl">Logo</span>
    <div class="logo-row">
      <span class="logo-prev" style="background:{isTile ? '#2a2a30' : '#fff'}">
        {#if logoUrl && !isTile}<img src={logoUrl} alt="logo" />{:else}<span class="ph">🏷️</span>{/if}
      </span>
      <div class="logo-actions">
        <button class="btn" onclick={() => showPicker = !showPicker}>🎨 Choose</button>
        <label class="btn">⬆️ Upload<input type="file" accept="image/*" onchange={uploadLogo} hidden /></label>
        <button class="btn" onclick={fetchLogo}>🌐 Fetch</button>
      </div>
    </div>
  </div>
  {#if showPicker}
    <LogoPicker initial={draft.storeName} onpick={pickLogo} onclose={() => showPicker = false} />
  {/if}

  <div class="field swatch">
    <span class="lbl">Tile colour</span>
    <div class="swatch-right">
      {#if draft.tileColor}<button class="auto" onclick={resetTileColor}>↺ Auto</button>{/if}
      <label class="dot-btn" aria-label="Pick tile colour">
        <span class="dot" style="background:{effColor}"></span>
        <input type="color" value={draft.tileColor ?? effColor} oninput={setTileColor} hidden />
      </label>
    </div>
  </div>

  <label class="field">
    <span class="lbl">Notes</span>
    <textarea class="text" rows="2" bind:value={draft.notes}></textarea>
  </label>

  <PhotoField label="Front photo" bind:value={draft.frontPhotoRef} />
  <PhotoField label="Back photo" bind:value={draft.backPhotoRef} />

  <button class="toggle" onclick={() => draft.favorite = !draft.favorite}>
    <span>Favourite</span>
    <span class="star" class:on={draft.favorite}>{draft.favorite ? '★' : '☆'}</span>
  </button>

  <button class="btn primary" onclick={save}>Save</button>
  <button class="del" onclick={remove}>Delete card</button>
</div>

<style>
  header{display:flex;align-items:center;gap:6px;padding:12px 12px 6px}
  .back{background:none;border:none;color:#e6e6ec;font-size:30px;line-height:1;cursor:pointer;
    width:40px;height:40px;border-radius:10px}
  .back:active{background:#1a1a20}
  h2{font-size:19px;margin:0}
  .body{display:flex;flex-direction:column;gap:16px;padding:8px 16px 40px}
  .field{display:block}
  .lbl{display:block;color:#9a9aa6;font-size:13px;margin:0 2px 6px}
  .text{width:100%;padding:12px;border-radius:12px;border:1px solid #2a2a30;background:#161618;
    color:#eee;font-size:15px;font-family:inherit}
  textarea.text{resize:vertical}
  .btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:13px;border-radius:12px;
    border:1px solid #33333a;background:#1a1a20;color:#e6e6ec;font-size:15px;cursor:pointer;
    -webkit-tap-highlight-color:transparent}
  .btn:active{background:#23232b}
  .btn.primary{background:#2a6df4;border:none;font-weight:600;padding:15px;font-size:16px;margin-top:6px}
  /* logo row */
  .logo-row{display:flex;gap:12px;align-items:stretch}
  .logo-prev{flex:0 0 64px;width:64px;height:64px;border-radius:14px;display:flex;align-items:center;
    justify-content:center;overflow:hidden}
  .logo-prev img{max-width:80%;max-height:80%;object-fit:contain}
  .logo-prev .ph{font-size:24px;filter:grayscale(1);opacity:.6}
  .logo-actions{flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
  .logo-actions .btn{padding:0;height:64px;flex-direction:column;font-size:13px;gap:4px}
  /* tile-colour swatch */
  .swatch{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;
    border-radius:12px;border:1px solid #2a2a30;background:#161618}
  .swatch .lbl{margin:0;color:#e6e6ec;font-size:15px}
  .swatch-right{display:flex;align-items:center;gap:10px}
  .auto{background:#23232b;border:1px solid #33333a;color:#cdd;border-radius:999px;
    padding:5px 12px;font-size:13px;cursor:pointer}
  .dot-btn{cursor:pointer;display:flex}
  .dot{width:34px;height:34px;border-radius:50%;border:2px solid #3a3a42}
  /* favourite */
  .toggle{display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:12px;
    border:1px solid #2a2a30;background:#161618;color:#e6e6ec;font-size:15px;cursor:pointer}
  .star{font-size:22px;color:#666}
  .star.on{color:#ffcf33}
  .del{background:none;border:none;color:#f66;padding:10px;font-size:15px;cursor:pointer}
</style>
