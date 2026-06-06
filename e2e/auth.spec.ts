import { test, expect } from '@playwright/test';

test('logged-out shows the backup banner; login flow reaches the logged-in panel', async ({ page }) => {
  // Clear localStorage before navigation so a persisted token never bleeds in from a previous run.
  await page.addInitScript(() => { try { localStorage.clear(); } catch {} });

  // Mock the PocketBase endpoints the app will call.
  await page.route('**/api/collections/users/auth-with-password', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ token: 'tok', record: { id: 'u1', email: 'me@example.com' } }) }));
  await page.route('**/api/loyalty/totp/required', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ required: false }) }));
  // Logged-in panel checks account type + (for email accounts) starts mandatory 2FA setup.
  await page.route('**/api/collections/_externalAuths/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ page: 1, perPage: 200, totalItems: 0, totalPages: 1, items: [] }) }));
  await page.route('**/api/loyalty/totp/setup', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ secret: 'TESTSECRET', otpauthUrl: 'otpauth://totp/x?secret=TESTSECRET' }) }));

  await page.goto('/');
  // Banner visible when logged out
  await expect(page.getByText(/aren't backed up/i)).toBeVisible();

  // Go to Settings → Account
  await page.getByLabel('Settings').click();
  await page.getByPlaceholder('email').fill('me@example.com');
  await page.getByPlaceholder('password').fill('password123');
  await page.getByRole('button', { name: /^Log in$/ }).click();

  // Logged-in panel shows the account + logout
  await expect(page.getByText('me@example.com')).toBeVisible();
  await expect(page.getByRole('button', { name: /Log out/i })).toBeVisible();
});
