<script lang="ts">
  import PhotoField from '../components/PhotoField.svelte';
  import { putCard, deleteCard, putImage, deleteImage } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import { logoDevFetcher } from '../lib/logo/fetch';
  import { findCatalogById } from '../lib/catalog/catalog';
  import type { Card } from '../lib/types';
  let { card, ondone, ondeleted }:
    { card: Card; ondone: () => void; ondeleted: () => void } = $props();
  let draft = $state<Card>({ ...card });
  async function save() {
    draft.updatedAt = Date.now();
    // $state proxies aren't structured-cloneable for IndexedDB — snapshot to a plain object.
    await putCard($state.snapshot(draft) as Card);
    await loadCards();
    ondone();
  }
  async function remove() {
    if (card.logo.blobRef) await deleteImage(card.logo.blobRef);
    if (card.frontPhotoRef) await deleteImage(card.frontPhotoRef);
    if (card.backPhotoRef) await deleteImage(card.backPhotoRef);
    await deleteCard(card.id); await loadCards(); ondeleted();
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
    if (!domain) { alert('No domain to fetch from.'); return; }
    const blob = await logoDevFetcher.fetchLogo(domain);
    if (!blob) { alert('No logo found online.'); return; }
    if (draft.logo.blobRef) await deleteImage(draft.logo.blobRef);
    const key = crypto.randomUUID(); await putImage(key, blob);
    draft.logo = { source: 'fetched', blobRef: key };
  }
</script>
<header><button onclick={ondone}>← Back</button><h2>Edit</h2></header>
<label>Name<input bind:value={draft.storeName} /></label>
<label>Brand color<input type="color" bind:value={draft.brandColor} /></label>
<div class="logo">
  <input type="file" accept="image/*" onchange={uploadLogo} />
  <button onclick={fetchLogo}>🌐 Fetch logo online</button>
</div>
<label>Notes<textarea bind:value={draft.notes}></textarea></label>
<PhotoField label="Front photo" bind:value={draft.frontPhotoRef} />
<PhotoField label="Back photo" bind:value={draft.backPhotoRef} />
<label class="row"><input type="checkbox" bind:checked={draft.favorite} /> Favorite</label>
<button class="save" onclick={save}>Save</button>
<button class="del" onclick={remove}>Delete card</button>
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  label{display:block;margin:10px 16px}.row{display:flex;gap:8px;align-items:center}
  input:not([type]),input[type=text],textarea{width:100%;padding:10px;border-radius:10px;
    border:1px solid #2a2a30;background:#161618;color:#eee}
  .logo{display:flex;gap:8px;margin:10px 16px}
  .save{display:block;width:calc(100% - 32px);margin:10px 16px;padding:14px;border:none;
    border-radius:12px;background:#2a6df4;color:#fff}
  .del{display:block;margin:6px 16px;background:none;border:none;color:#f66}
</style>
