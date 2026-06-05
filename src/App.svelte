<script lang="ts">
  import Home from './screens/Home.svelte';
  import Checkout from './screens/Checkout.svelte';
  import AddCard from './screens/AddCard.svelte';
  import CardDetail from './screens/CardDetail.svelte';
  import Settings from './screens/Settings.svelte';
  import type { Card } from './lib/types';
  import { putCard } from './lib/db';
  import { refreshSession } from './lib/auth/store';

  refreshSession();

  type Screen = 'home' | 'checkout' | 'add' | 'detail' | 'settings';
  let screen = $state<Screen>('home');
  let active = $state<Card | null>(null);

  // Forward navigation pushes a history entry so the OS/browser back gesture
  // returns to the previous screen instead of closing the PWA.
  function navigate(s: Screen) {
    screen = s;
    history.pushState({ screen: s }, '');
  }
  // In-app back / done / cancel just walk history back → triggers popstate below.
  const back = () => history.back();

  $effect(() => {
    history.replaceState({ screen: 'home' }, '');         // home = root entry
    const onPop = (e: PopStateEvent) => {
      screen = ((e.state as { screen?: Screen } | null)?.screen) ?? 'home';
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  });
</script>

{#if screen === 'home'}
  <Home onopen={(c) => { const u = { ...c, lastUsedAt: Date.now() }; putCard(u); active = u; navigate('checkout'); }}
        onadd={() => navigate('add')} onsettings={() => navigate('settings')} />
{:else if screen === 'checkout' && active}
  <Checkout card={active} onback={back} onedit={() => navigate('detail')} />
{:else if screen === 'add'}
  <AddCard ondone={back} oncancel={back} />
{:else if screen === 'detail' && active}
  <CardDetail card={active} ondone={back} ondeleted={() => history.go(-2)} />
{:else if screen === 'settings'}
  <Settings onback={back} />
{/if}
