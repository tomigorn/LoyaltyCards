import { test, expect } from '@playwright/test';

test('autocomplete suggests and links a catalog shop', async ({ page }) => {
  await page.route('https://img.logo.dev/**', r => r.abort());   // offline-deterministic
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('mig');
  await expect(page.getByText('Migros')).toBeVisible();          // suggestion
  await page.getByText('Migros').first().click();                // pick
  await page.locator('input').nth(1).fill('7613269001234');
  await page.locator('select').selectOption({ label: 'Code 128' });
  await page.getByText('Save').click();
  await expect(page.getByText('Migros')).toBeVisible();          // tile on home
});
