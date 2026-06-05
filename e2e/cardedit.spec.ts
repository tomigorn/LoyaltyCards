import { test, expect } from '@playwright/test';

// Regression: editing a card must persist. It was silently failing because
// CardDetail put a Svelte $state proxy into IndexedDB ("could not be cloned").
test('editing a card persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('Migros');
  await page.getByRole('button', { name: /Migros/i }).first().click();
  await page.locator('input').nth(1).fill('7613269001234');
  await page.locator('select').last().selectOption({ label: 'Code 128' });
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.getByText('Migros').first().click();       // → checkout
  await page.getByText('Edit').click();                  // → detail
  await page.locator('input').first().fill('Renamed Shop');  // Name field
  await page.getByRole('button', { name: 'Save' }).click();
  // save() returns to the checkout screen — wait for that so the IndexedDB write has landed
  await expect(page.getByText('Edit')).toBeVisible();

  await page.goto('/');                                  // fresh load from IndexedDB
  await expect(page.getByText('Renamed Shop')).toBeVisible();
});
