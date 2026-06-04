import { test, expect } from '@playwright/test';
test('add a card manually and view its barcode', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('Migros');
  await page.locator('input').nth(1).fill('7612345678900');
  await page.getByText('Save').click();
  await expect(page.getByText('Migros')).toBeVisible();
  await page.getByText('Migros').first().click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('7612345678900')).toBeVisible();
});
