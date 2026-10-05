import { test, expect } from '@playwright/test';
import { categoryName } from '../../helpers/data-generator';

test.describe('Categories', () => {
  test('creates and removes a category', async ({ page }) => {
    const name = categoryName();

    await page.goto('/categories');

    await page.getByLabel('Nazwa *').fill(name);
    await page.getByLabel('Ikona (emoji)').fill('🎮');

    await page.locator('#new-color').evaluate((input) => {
      (input as HTMLInputElement).value = '#3F51B5';
    });

    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();

    const row = page.getByRole('row').filter({ hasText: name });

    await expect(row).toBeVisible();
    await expect(row).toContainText('🎮');

    try {
      await row.getByRole('button', { name: 'Usuń', exact: true }).click();

      const dialog = page.locator('dialog[open]');

      await expect(dialog).toContainText(name);

      await dialog
        .getByRole('button', { name: /^Usuń/ })
        .click();

      await expect(
        page.getByRole('row').filter({ hasText: name })
      ).toHaveCount(0);
    } finally {
      const leftover = page.getByRole('row').filter({ hasText: name });

      if (await leftover.count()) {
        try {
          await leftover
            .getByRole('button', { name: 'Usuń', exact: true })
            .click();

          await page
            .locator('dialog[open]')
            .getByRole('button', { name: /^Usuń/ })
            .click();
        } catch (error) {
          console.warn(`Cleanup failed for category: ${name}`);
        }
      }
    }
  });
});