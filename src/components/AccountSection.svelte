<script lang="ts">
  import { account, isLoggedIn, loginPassword, loginGoogle, signup, logout,
           totpRequired, startTotp, confirmTotp, googleEnabled, googleLinked, refreshAccount } from '../lib/auth/store';
  import * as bwipjs from 'bwip-js/browser';

  const MIN_PASSWORD = 10;

  let mode = $state<'login' | 'signup'>('login');
  let email = $state(''); let password = $state(''); let code = $state('');
  let need2fa = $state(false);
  let busy = $state(false); let err = $state('');

  // Only offer Google when the backend actually has the provider configured.
  let showGoogle = $state(false);
  googleEnabled().then((v) => { showGoogle = v; });

  async function doGoogle() {
    err = '';
    try { await loginGoogle(); }
    catch (e) { err = 'Google sign-in failed: ' + ((e as Error).message || 'unavailable'); }
  }

  async function submit() {
    busy = true; err = '';
    try {
      if (mode === 'signup') {
        if (password.length < MIN_PASSWORD) { err = `Use at least ${MIN_PASSWORD} characters.`; busy = false; return; }
        await signup(email.trim(), password);   // now logged in; 2FA enrolment below is mandatory
      } else {
        if (!need2fa) need2fa = await totpRequired(email.trim());
        if (need2fa && !code.trim()) { busy = false; return; } // reveal code field, wait
        await loginPassword(email.trim(), password, code.trim() || undefined);
      }
    } catch (e) { err = (e as Error).message || 'Sign-in failed'; }
    busy = false;
  }

  // ---- account type + mandatory 2FA (logged-in) ----
  let isGoogle = $state<boolean | null>(null);   // null = still determining
  let enroll = $state<{ secret: string; otpauthUrl: string } | null>(null);
  let enrollCode = $state(''); let qrCanvas = $state<HTMLCanvasElement | null>(null);
  let enrollStarted = $state(false);
  let twoFAMsg = $state('');

  const twoFAOn = $derived($account?.totpEnabled ?? false);
  // Email/password accounts MUST have 2FA. Google accounts never show it (Google handles it).
  const needsMandatory2fa = $derived($isLoggedIn && isGoogle === false && !twoFAOn);

  $effect(() => {
    if ($isLoggedIn) {
      if (isGoogle === null) googleLinked().then((v) => { isGoogle = v; });
    } else {
      isGoogle = null; enroll = null; enrollStarted = false; enrollCode = ''; twoFAMsg = '';
    }
  });

  $effect(() => {
    if (needsMandatory2fa && !enroll && !enrollStarted) begin2fa();
  });

  async function begin2fa() {
    enrollStarted = true; twoFAMsg = '';
    try {
      enroll = await startTotp();
      queueMicrotask(() => {
        if (qrCanvas && enroll) { try { bwipjs.toCanvas(qrCanvas, { bcid: 'qrcode', text: enroll.otpauthUrl, scale: 4 }); } catch { /* ignore */ } }
      });
    } catch { enroll = null; twoFAMsg = 'Could not start setup — try again.'; }
  }
  async function finish2fa() {
    twoFAMsg = '';
    try {
      await confirmTotp(enrollCode.trim());
      enroll = null; enrollCode = '';
      await refreshAccount();   // updates $account.totpEnabled → the panel flips to "on"
    } catch (e) { twoFAMsg = (e as Error).message || 'Wrong code'; }
  }
</script>

<section>
  <span class="lbl">Account</span>

  {#if $isLoggedIn}
    <div class="who">{$account?.email}</div>

    {#if isGoogle === null}
      <p class="hint">…</p>
    {:else if isGoogle}
      <p class="hint">Signed in with Google — two-factor authentication is handled by Google.</p>
    {:else if twoFAOn}
      <p class="hint">Two-factor authentication is on.</p>
    {:else}
      <div class="card2fa">
        <strong>Set up two-factor authentication</strong>
        <p class="hint">Required for email &amp; password accounts. Scan this in your authenticator app, then enter the 6-digit code.</p>
        {#if enroll}
          <canvas bind:this={qrCanvas} class="qr"></canvas>
          <code class="secret">{enroll.secret}</code>
          <input class="text" placeholder="6-digit code" bind:value={enrollCode} inputmode="numeric" />
          <button class="btn primary" onclick={finish2fa}>Enable</button>
        {:else}
          <button class="btn" onclick={begin2fa}>Start setup</button>
        {/if}
        {#if twoFAMsg}<p class="err">{twoFAMsg}</p>{/if}
      </div>
    {/if}

    <button class="btn" onclick={logout}>Log out</button>
  {:else}
    {#if showGoogle}
      <button class="btn google" onclick={doGoogle}>Continue with Google</button>
      <div class="or">or</div>
    {/if}
    <input class="text" type="email" placeholder="email" bind:value={email} autocomplete="username" />
    <input class="text" type="password" placeholder="password" bind:value={password}
           autocomplete={mode === 'signup' ? 'new-password' : 'current-password'} />
    {#if mode === 'signup'}
      <p class="hint" class:warn={password.length > 0 && password.length < MIN_PASSWORD}>
        Use at least {MIN_PASSWORD} characters. You'll set up an authenticator app next (required).
      </p>
    {/if}
    {#if need2fa}<input class="text" placeholder="2FA code" bind:value={code} inputmode="numeric" />{/if}
    {#if err}<p class="err">{err}</p>{/if}
    <button class="btn primary" onclick={submit} disabled={busy || (mode === 'signup' && password.length < MIN_PASSWORD)}>
      {mode === 'signup' ? 'Create account' : 'Log in'}
    </button>
    <button class="link" onclick={() => { mode = mode === 'login' ? 'signup' : 'login'; need2fa = false; err = ''; }}>
      {mode === 'login' ? 'Create an account' : 'I already have an account'}
    </button>
  {/if}
</section>

<style>
  section{display:flex;flex-direction:column;gap:8px}
  .lbl{color:#9a9aa6;font-size:13px;margin:0 2px 2px}
  .text{padding:12px;border-radius:10px;border:1px solid #2a2a30;background:#161618;color:#eee;font-size:15px}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:12px;
    border:1px solid #33333a;background:#1a1a20;color:#e6e6ec;font-size:15px;cursor:pointer}
  .btn.primary{background:#2a6df4;border-color:#2a6df4;color:#fff;font-weight:600}
  .btn.primary:disabled{opacity:.5;cursor:default}
  .btn.google{background:#fff;color:#222;border-color:#fff;font-weight:600}
  .link{background:none;border:none;color:#7aa2f7;font-size:14px;cursor:pointer;padding:4px}
  .or{color:#777;text-align:center;font-size:12px}
  .who{font-size:16px;font-weight:600}
  .qr{width:160px;height:160px;align-self:center;background:#fff;border-radius:8px}
  .secret{font-family:ui-monospace,monospace;font-size:13px;color:#bbb;word-break:break-all}
  .hint{color:#9a9aa6;font-size:13px;margin:0}
  .hint.warn{color:#ffcf66}
  .err{color:#ff6b6b;font-size:14px;margin:0}
  .card2fa{border:1px solid #2a2a30;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}
  .card2fa strong{font-size:15px}
</style>
