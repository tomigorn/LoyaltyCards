import { test, expect } from '@playwright/test';

// Regression: the OS/browser back gesture must return to the previous screen,
// not close the PWA. Driven by history pushState/popstate in App.svelte.
test('back gesture returns to the previous screen, not out of the app', async ({ page }) => {
  await page.goto('/');

  // home → settings → back → home
  await page.getByLabel('Settings').click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.evaluate(() => history.back());
  await expect(page.getByRole('heading', { name: 'Cards' })).toBeVisible();

  // add a card, open its checkout → back → home (still in app)
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('TestShop');
  await page.locator('input').nth(1).fill('123456');
  await page.locator('select').selectOption({ label: 'Code 128' });
  await page.getByText('Save').click();
  await page.getByText('TestShop').first().click();
  await expect(page.locator('canvas')).toBeVisible();          // checkout
  await page.evaluate(() => history.back());
  await expect(page.getByRole('heading', { name: 'Cards' })).toBeVisible();  // home, not closed
});
