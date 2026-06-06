import { test, expect } from '@playwright/test';

// Regression: matrix codes (QR/Aztec/Data Matrix) must render. bwip-js rejects `height: undefined`,
// which silently broke all 2D codes until a QR card was added.
test('a QR card renders at checkout (no "could not render")', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('TestQR');
  await page.locator('input').nth(1).fill('6275980261148014230');
  await page.locator('select').last().selectOption('qr');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.getByText('TestQR').first().click();      // → checkout
  await expect(page.getByText(/Couldn't render/i)).toHaveCount(0);
  const w = await page.locator('canvas').evaluate((c) => (c as HTMLCanvasElement).width);
  expect(w).toBeGreaterThan(0);
});
