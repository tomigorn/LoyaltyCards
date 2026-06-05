import { test, expect } from '@playwright/test';

// F5: brand auto-detect is self-learning. After saving a card with a known shop, a later
// card whose barcode shares the same leading digits should auto-fill that shop.
test('a learned barcode prefix auto-detects the brand on the next card', async ({ page }) => {
  await page.goto('/');

  // Card 1: teach the app that 76132690… is Migros.
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('Migros');
  await page.getByRole('button', { name: /Migros/i }).first().click();
  await page.locator('input').nth(1).fill('7613269001234');
  await page.locator('select').last().selectOption({ label: 'Code 128' });  // skip EAN check-digit guard
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByLabel('Add card')).toBeVisible();                  // back on Home → card 1 saved

  // Card 2: type a number sharing the first 8 digits, leaving the name blank.
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.locator('input').nth(1).fill('7613269099999');

  // The store name should have been filled in for us.
  await expect(page.getByPlaceholder('e.g. Migros')).toHaveValue(/Migros/i);
});
