import { test, expect } from '@playwright/test';

test('sort selector changes card order (A–Z vs Date added)', async ({ page }) => {
  await page.goto('/');

  // Add two cards: Zebra first, Apple second
  for (const [name, value] of [['Zebra Store', '1234567890128'], ['Apple Shop', '9876543210987']]) {
    await page.getByLabel('Add card').click();
    await page.getByText('Enter manually').click();
    await page.getByPlaceholder('e.g. Migros').fill(name);
    await page.locator('input').nth(1).fill(value);
    await page.locator('select').selectOption({ label: 'Code 128' });
    await page.getByText('Save').click();
    await expect(page.getByText(name)).toBeVisible();
  }

  // Default is lastUsed — both tiles visible
  await expect(page.getByText('Apple Shop')).toBeVisible();
  await expect(page.getByText('Zebra Store')).toBeVisible();

  // Switch to A–Z
  await page.getByLabel('Sort order').selectOption('alpha');

  // Apple Shop should appear before Zebra Store in the grid
  const tileTexts = await page.locator('button.tile').allTextContents();
  expect(tileTexts[0]).toContain('Apple Shop');
  expect(tileTexts[1]).toContain('Zebra Store');

  // Switch to Date added — Apple Shop was added last so appears first (newest first)
  await page.getByLabel('Sort order').selectOption('added');
  const tileTextsAdded = await page.locator('button.tile').allTextContents();
  expect(tileTextsAdded[0]).toContain('Apple Shop');
  expect(tileTextsAdded[1]).toContain('Zebra Store');
});
