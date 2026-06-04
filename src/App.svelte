<script lang="ts">
  import Home from './screens/Home.svelte';
  import Checkout from './screens/Checkout.svelte';
  import AddCard from './screens/AddCard.svelte';
  import CardDetail from './screens/CardDetail.svelte';
  import Settings from './screens/Settings.svelte';
  import type { Card } from './lib/types';
  let screen = $state<'home'|'checkout'|'add'|'detail'|'settings'>('home');
  let active = $state<Card | null>(null);
  const go = (s: typeof screen) => screen = s;
</script>
{#if screen === 'home'}
  <Home onopen={(c) => { active = c; go('checkout'); }}
        onadd={() => go('add')} onsettings={() => go('settings')} />
{:else if screen === 'checkout' && active}
  <Checkout card={active} onback={() => go('home')} onedit={() => go('detail')} />
{:else if screen === 'add'}
  <AddCard ondone={() => go('home')} oncancel={() => go('home')} />
{:else if screen === 'detail' && active}
  <CardDetail card={active} ondone={() => go('home')} />
{:else if screen === 'settings'}
  <Settings onback={() => go('home')} />
{/if}
