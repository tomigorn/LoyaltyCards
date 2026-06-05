<script lang="ts">
  import { account, isLoggedIn, loginPassword, loginGoogle, signup, logout,
           totpRequired, startTotp, confirmTotp, disableTotp } from '../lib/auth/store';
  import * as bwipjs from 'bwip-js/browser';

  let mode = $state<'login' | 'signup'>('login');
  let email = $state(''); let password = $state(''); let code = $state('');
  let need2fa = $state(false);
  let busy = $state(false); let err = $state('');

  async function submit() {
    busy = true; err = '';
    try {
      if (mode === 'signup') { await signup(email.trim(), password); }
      else {
        if (!need2fa) need2fa = await totpRequired(email.trim());
        if (need2fa && !code.trim()) { busy = false; return; } // reveal code field, wait
        await loginPassword(email.trim(), password, code.trim() || undefined);
      }
    } catch (e) { err = (e as Error).message || 'Sign-in failed'; }
    busy = false;
  }

  // ---- 2FA enrolment (logged-in) ----
  let enroll = $state<{ secret: string; otpauthUrl: string } | null>(null);
  let enrollCode = $state(''); let qrCanvas = $state<HTMLCanvasElement | null>(null);
  let twoFAMsg = $state('');
  async function begin2fa() {
    enroll = await startTotp(); twoFAMsg = '';
    queueMicrotask(() => { if (qrCanvas && enroll) {
      try { bwipjs.toCanvas(qrCanvas, { bcid: 'qrcode', text: enroll.otpauthUrl, scale: 4 }); } catch {}
    }});
  }
  async function finish2fa() {
    try { await confirmTotp(enrollCode.trim()); enroll = null; enrollCode = ''; twoFAMsg = 'Two-factor enabled ✓'; }
    catch (e) { twoFAMsg = (e as Error).message || 'Wrong code'; }
  }
  let disableCode = $state('');
  async function turnOff2fa() {
    try { await disableTotp(disableCode.trim()); disableCode = ''; twoFAMsg = 'Two-factor disabled'; }
    catch (e) { twoFAMsg = (e as Error).message || 'Wrong code'; }
  }
</script>

<section>
  <span class="lbl">Account</span>

  {#if $isLoggedIn}
    <div class="who">{$account?.email}</div>
    <details class="card2fa">
      <summary>Two-factor authentication</summary>
      {#if enroll}
        <p class="hint">Scan in your authenticator app, then enter a code.</p>
        <canvas bind:this={qrCanvas} class="qr"></canvas>
        <code class="secret">{enroll.secret}</code>
        <input class="text" placeholder="6-digit code" bind:value={enrollCode} inputmode="numeric" />
        <button class="btn" onclick={finish2fa}>Enable</button>
      {:else}
        <button class="btn" onclick={begin2fa}>Set up authenticator app</button>
        <div class="row">
          <input class="text" placeholder="code to disable" bind:value={disableCode} inputmode="numeric" />
          <button class="btn ghost" onclick={turnOff2fa}>Disable</button>
        </div>
      {/if}
      {#if twoFAMsg}<p class="msg">{twoFAMsg}</p>{/if}
    </details>
    <button class="btn" onclick={logout}>Log out</button>
  {:else}
    <button class="btn google" onclick={loginGoogle}>Continue with Google</button>
    <div class="or">or</div>
    <input class="text" placeholder="email" bind:value={email} autocomplete="username" />
    <input class="text" placeholder="password" type="password" bind:value={password} autocomplete="current-password" />
    {#if need2fa}<input class="text" placeholder="2FA code" bind:value={code} inputmode="numeric" />{/if}
    {#if err}<p class="err">{err}</p>{/if}
    <button class="btn primary" onclick={submit} disabled={busy}>
      {mode === 'signup' ? 'Create account' : 'Log in'}
    </button>
    <button class="link" onclick={() => { mode = mode === 'login' ? 'signup' : 'login'; need2fa = false; }}>
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
  .btn.google{background:#fff;color:#222;border-color:#fff;font-weight:600}
  .btn.ghost{background:transparent}
  .link{background:none;border:none;color:#7aa2f7;font-size:14px;cursor:pointer;padding:4px}
  .or{color:#777;text-align:center;font-size:12px}
  .who{font-size:16px;font-weight:600}
  .row{display:flex;gap:8px}
  .qr{width:160px;height:160px;align-self:center;background:#fff;border-radius:8px}
  .secret{font-family:ui-monospace,monospace;font-size:13px;color:#bbb;word-break:break-all}
  .hint{color:#9a9aa6;font-size:13px}
  .err{color:#ff6b6b;font-size:14px}
  .msg{color:#7ad17a;font-size:14px}
  details.card2fa{border:1px solid #2a2a30;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
  summary{cursor:pointer;font-size:15px}
</style>
