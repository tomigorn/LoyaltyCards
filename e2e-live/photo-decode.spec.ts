import { test, expect } from '@playwright/test';

// Throwaway: verifies "Photo of card" decodes a QR/barcode from a picked image into the form.
// Uses the real IKEA Family QR screenshot the user reported failing.
const IKEA = '/home/pi/.claude/uploads/edbb3512-16f8-4af9-9eed-803df5250a2a/ad02a4e1-1000007163.jpg';

test('Photo of card decodes the QR into the number field', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Photo of card').click(),
  ]);
  await chooser.setFiles(IKEA);
  // The decoded QR value should land in the Number field.
  await expect(page.locator('input[inputmode="numeric"]')).toHaveValue('6275980261148014230', { timeout: 30000 });
});
