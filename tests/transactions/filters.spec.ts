import { test, expect } from '@playwright/test';

test.describe('Transactions filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('filters transactions by account', async ({ page }) => {
    await page.getByLabel('Konto').selectOption({ label: 'Konto Wspólne' });
    await page.getByRole('button', { name: 'Filtruj' }).click();

    const rows = page.locator('tbody tr');

    await expect(rows.first()).toBeVisible();

    for (let i = 0; i < await rows.count(); i++) {
      await expect(rows.nth(i).locator('td').first()).toHaveText('Konto Wspólne');
    }
  });

  test('shows only expenses', async ({ page }) => {
    await page.getByLabel('Kierunek').selectOption('expense');
    await page.getByRole('button', { name: 'Filtruj' }).click();

    const rows = page.locator('tbody tr');

    await expect(rows.first()).toBeVisible();

    for (let i = 0; i < await rows.count(); i++) {
      const amountText = await rows.nth(i).locator('td').nth(6).innerText();

      const amount = Number(
        amountText
          .replace(/\s/g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '')
      );

      expect(amount).toBeLessThan(0);
    }
  });

  test('searches transactions by description', async ({ page }) => {
    await page.getByLabel('Szukaj w opisie').fill('SUPERMARKET');
    await page.getByRole('button', { name: 'Filtruj' }).click();

    const rows = page.locator('tbody tr');

    await expect(rows.first()).toBeVisible();

    for (let i = 0; i < await rows.count(); i++) {
      await expect(rows.nth(i)).toContainText(/SUPERMARKET/i);
    }
  });

  test('clears filters', async ({ page }) => {
    await page.getByLabel('Konto').selectOption({ label: 'Konto Wspólne' });
    await page.getByLabel('Kierunek').selectOption('expense');
    await page.getByLabel('Szukaj w opisie').fill('SUPERMARKET');

    await page.getByRole('button', { name: 'Filtruj' }).click();
    await page.getByRole('link', { name: 'Wyczyść' }).click();

    await expect(page.getByLabel('Konto')).toHaveValue('');
    await expect(page.getByLabel('Kierunek')).toHaveValue('');
    await expect(page.getByLabel('Szukaj w opisie')).toHaveValue('');
  });
});