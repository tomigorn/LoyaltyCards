import { test, expect } from '@playwright/test';

// Covers: matrix codes render (bwip-js rejects `height: undefined`, which silently broke 2D codes);
// tapping the code toggles QR <-> barcode; tapping the code does NOT go back; the back button does.
test('QR card renders, taps toggle QR<->barcode, back is the button not a tap', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('TestQR');
  await page.locator('input').nth(1).fill('6275980261148014230');
  await page.locator('select').last().selectOption('qr');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.getByText('TestQR').first().click();      // -> checkout
  await expect(page.getByText(/Couldn't render/i)).toHaveCount(0);
  await expect(page.getByText(/Showing QR code/i)).toBeVisible();
  const w = await page.locator('canvas').evaluate((c) => (c as HTMLCanvasElement).width);
  expect(w).toBeGreaterThan(0);

  // Tapping the code switches to a linear barcode — and must NOT navigate away.
  await page.getByRole('button', { name: /Switch code format/i }).click();
  await expect(page.getByText(/Showing barcode/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();

  // The back button returns to the list.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('TestQR')).toBeVisible();
});
