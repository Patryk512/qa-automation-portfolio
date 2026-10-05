import { test, expect } from '@playwright/test';

test.describe('Home Budget - navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens dashboard', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Pulpit', exact: true })
    ).toBeVisible();
  });

  test('opens import page', async ({ page }) => {
    await page.getByRole('link', { name: 'Import', exact: true }).click();

    await expect(
      page.getByRole('heading', { name: /Import wyciągu/i }).first()
    ).toBeVisible();
  });

  test('opens import history', async ({ page }) => {
    await page.locator('summary').filter({ hasText: 'Historia' }).click();

    await page.getByRole('link', {
      name: 'Historia importów',
      exact: true,
    }).click();

    await expect(
      page.getByRole('heading', {
        name: 'Historia importów',
        exact: true,
      })
    ).toBeVisible();
  });

  test('opens monthly history', async ({ page }) => {
    await page.locator('summary').filter({ hasText: 'Historia' }).click();

    await page.getByRole('link', {
      name: 'Historia miesięczna',
      exact: true,
    }).click();

    await expect(
      page.getByRole('heading', {
        name: 'Historia miesięczna',
        exact: true,
      })
    ).toBeVisible();
  });

  test('opens transactions', async ({ page }) => {
    await page.getByRole('link', {
      name: 'Transakcje',
      exact: true,
    }).click();

    await expect(
      page.getByRole('heading', {
        name: 'Transakcje',
        exact: true,
      })
    ).toBeVisible();
  });

  test('opens categories', async ({ page }) => {
    await page.getByRole('link', {
      name: 'Kategorie',
      exact: true,
    }).click();

    await expect(
      page.getByRole('heading', {
        name: 'Kategorie',
        exact: true,
      })
    ).toBeVisible();
  });

  test('opens category rules', async ({ page }) => {
    await page.getByRole('link', {
      name: 'Reguły',
      exact: true,
    }).click();

    await expect(
      page.getByRole('heading', {
        name: 'Reguły kategoryzacji',
        exact: true,
      }).first()
    ).toBeVisible();
  });
});