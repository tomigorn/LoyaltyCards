import { test, expect } from '@playwright/test';

// Regression: reordering via long-press + Done must PERSIST (was failing because
// svelte-dnd-action's item objects aren't structured-cloneable for IndexedDB).
const SHOPS = [['Migros', '7613269001234'], ['Coop', '7610800012345'], ['IKEA', '026123456789']];
const names = (page: any): Promise<string[]> => page.locator('.grid .nm').allInnerTexts();

test('long-press reorder persists after Done and reload', async ({ page }) => {
  await page.goto('/');
  for (const [name, num] of SHOPS) {
    await page.getByLabel('Add card').click();
    await page.getByText('Enter manually').click();
    await page.getByPlaceholder('e.g. Migros').fill(name);
    await page.getByRole('button', { name: new RegExp(name, 'i') }).first().click();
    await page.locator('input').nth(1).fill(num);
    await page.locator('select').last().selectOption({ label: 'Code 128' });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
  }
  // enter reorder via the longpress action (bubbles from the visible tile button)
  const tile = page.locator('.tile').first();
  const tb = await tile.boundingBox();
  await tile.dispatchEvent('pointerdown', { clientX: tb!.x + 20, clientY: tb!.y + 20, bubbles: true });
  await page.waitForTimeout(900);
  await tile.dispatchEvent('pointerup', { bubbles: true });
  const before = await names(page);

  // keyboard reorder (deterministic): lift first item, move right, drop
  await page.locator('.drag-wrap').first().focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  const afterDrag = await names(page);
  expect(afterDrag).not.toEqual(before);                 // the reorder moved a card

  await page.getByRole('button', { name: 'Done ✓' }).click();
  await page.reload();
  await expect.poll(() => names(page)).toEqual(afterDrag); // survived the reload
});
