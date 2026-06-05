import { test, expect } from '@playwright/test';

// A bad EAN-13 checksum should warn but still let the user add the card.
test('bad checksum warns but allows save on a second tap', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('Migros');     // catalog → EAN-13 default
  await page.locator('input').nth(1).fill('1111111111111');       // invalid EAN-13 checksum
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save anyway' })).toBeVisible();  // warned, not saved
  await page.getByRole('button', { name: 'Save anyway' }).click();
  await expect(page.getByText('Migros')).toBeVisible();           // saved → home tile
});
