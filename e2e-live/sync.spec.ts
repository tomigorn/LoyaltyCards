/**
 * Live cross-device sync verification.
 *
 * Requires:
 *   - PocketBase ephemeral container on http://localhost:8091
 *   - `npm run build` with VITE_SYNC_URL=http://localhost:8091, then `npx vite preview --port 4173`
 *
 * Run with:
 *   npx playwright test e2e-live/sync.spec.ts --config e2e-live/playwright.config.ts
 *
 * NOT part of `npm run e2e` (that suite is backend-free).
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173';
const EMAIL = `sync${Date.now()}@example.com`;
const PASSWORD = 'password123456';
const STORE_NAME = 'SyncTestShop';
const BARCODE = '1234567890128';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

async function newPage(ctx: BrowserContext): Promise<Page> {
  const page = await ctx.newPage();
  // Capture console errors to help diagnose failures
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[browser error] ${msg.text()}`);
  });
  await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
  return page;
}

/** Navigate to Settings and sign up a new account. */
async function signUp(page: Page, email: string, password: string) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Open settings
  await page.getByRole('button', { name: 'Settings' }).click();
  // Switch to signup mode
  await page.getByRole('button', { name: /create an account/i }).click();
  await page.getByPlaceholder('email').fill(email);
  await page.getByPlaceholder('password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  // Wait for account email to appear (logged-in state)
  await expect(page.getByText(email)).toBeVisible({ timeout: 20_000 });
  console.log(`signUp done for ${email}`);
}

/** Log in via Settings screen in a fresh page. */
async function logIn(page: Page, email: string, password: string) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByPlaceholder('email').fill(email);
  await page.getByPlaceholder('password').fill(password);
  await page.getByRole('button', { name: /^Log in$/i }).click();
  await expect(page.getByText(email)).toBeVisible({ timeout: 20_000 });
  console.log(`logIn done for ${email}`);
}

/** Go back to home (click Back button if on Settings, else navigate directly). */
async function goHome(page: Page) {
  const back = page.getByRole('button', { name: 'Back', exact: true }).first();
  if (await back.isVisible({ timeout: 1_000 }).catch(() => false)) await back.click();
  await expect(page.getByLabel('Add card')).toBeVisible({ timeout: 5_000 });
}

/** Add a card via the manual entry flow. */
async function addCardManual(page: Page, storeName: string, barcode: string) {
  await page.getByLabel('Add card').click();
  await page.getByRole('button', { name: /enter manually/i }).click();
  // First text input is store name
  await page.locator('input.text').nth(0).fill(storeName);
  // Second text input is barcode number
  await page.locator('input.text').nth(1).fill(barcode);
  await page.getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByText(storeName)).toBeVisible({ timeout: 10_000 });
  console.log(`addCard done: ${storeName}`);
}

// ------------------------------------------------------------------
// Main test
// ------------------------------------------------------------------

test('cross-device sync: add in A → visible in B; delete in B → gone in A', async ({ browser }) => {
  // ---- Context A: sign up and add a card ----
  const ctxA = await browser.newContext({ storageState: undefined });
  const pageA = await newPage(ctxA);

  await signUp(pageA, EMAIL, PASSWORD);
  await goHome(pageA);
  await addCardManual(pageA, STORE_NAME, BARCODE);

  // Give the sync engine time to push to PocketBase
  console.log('Waiting for push...');
  await pageA.waitForTimeout(5_000);

  // Verify the card exists in PocketBase (sanity check)
  const pbCardsResp = await pageA.evaluate(async () => {
    const r = await fetch('http://localhost:8091/api/collections/cards/records', {
      headers: { 'Authorization': localStorage.getItem('pocketbase_auth')
        ? JSON.parse(localStorage.getItem('pocketbase_auth')!).token
        : '' }
    });
    return r.json();
  });
  console.log('PB cards after A push:', JSON.stringify(pbCardsResp));
  expect((pbCardsResp as any).totalItems).toBeGreaterThan(0);

  // ---- Context B: log in, card should appear via pull ----
  const ctxB = await browser.newContext({ storageState: undefined });
  const pageB = await newPage(ctxB);

  await logIn(pageB, EMAIL, PASSWORD);
  // startSync fires adoptLocalCards + fullSync (push+pull+loadCards) on login.
  // Stay on the Settings screen briefly to let the pull complete, then go home.
  await pageB.waitForTimeout(5_000);
  await goHome(pageB);
  // Wait for the card tile to appear (pull + loadCards should have run by now).
  await expect(pageB.getByText(STORE_NAME)).toBeVisible({ timeout: 20_000 });
  console.log('Context B sees the card — pull worked');

  // ---- Context B: open the card, navigate to detail, delete it ----
  // Click the card tile (role=button div) to open Checkout
  await pageB.getByRole('button', { name: STORE_NAME }).click();
  // Wait for the Checkout "Edit" button to appear before clicking it
  const editButton = pageB.getByRole('button', { name: /^Edit$/i });
  await expect(editButton).toBeVisible({ timeout: 10_000 });
  await editButton.click();

  // Wait for CardDetail (has a "Delete card" button)
  await expect(pageB.getByRole('button', { name: /delete card/i })).toBeVisible({ timeout: 10_000 });
  await pageB.getByRole('button', { name: /delete card/i }).click();

  // Verify B no longer shows the card
  await expect(pageB.getByText(STORE_NAME)).not.toBeVisible({ timeout: 10_000 });
  console.log('Context B deleted the card');

  // Give push() time to send tombstone to PocketBase
  await pageB.waitForTimeout(5_000);

  // ---- Context A: reload/refocus triggers pull, tombstone applied ----
  // Reload simulates coming back after being away
  await pageA.reload();
  await pageA.waitForLoadState('networkidle');
  // startSync re-fires on isLoggedIn → pull runs
  await pageA.waitForTimeout(8_000);

  // Card should be gone in A
  await expect(pageA.getByText(STORE_NAME)).not.toBeVisible({ timeout: 15_000 });
  console.log('Context A no longer shows the card — tombstone applied');

  await ctxA.close();
  await ctxB.close();
});
