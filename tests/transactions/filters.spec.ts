import { test, expect } from '@playwright/test';

import {
  createTestTransaction,
  deleteTestTransaction,
  TestTransaction,
} from '../../helpers/database';

function uniqueValue(prefix: string): string {
  const random = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}_${Date.now()}_${random}`;
}

test.describe('Transactions filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('filters transactions by account', async ({
    page,
  }) => {
    const description =
      uniqueValue('E2E_ACCOUNT_FILTER');

    const transaction =
      createTestTransaction({
        description,
        accountName: 'Konto Wspólne',
      });

    try {
      await page.reload();

      await page
        .getByLabel('Konto')
        .selectOption({
          label: 'Konto Wspólne',
        });

      await page
        .getByRole('button', {
          name: 'Filtruj',
          exact: true,
        })
        .click();

      const rows = page.locator('tbody tr');

      await expect(rows.first()).toBeVisible();

      const testRow = rows.filter({
        hasText: description,
      });

      await expect(testRow).toBeVisible();

      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        await expect(
          rows
            .nth(i)
            .locator('td')
            .first()
        ).toHaveText('Konto Wspólne');
      }
    } finally {
      deleteTestTransaction(transaction);
    }
  });

  test('shows only expenses', async ({
    page,
  }) => {
    const marker =
      uniqueValue('E2E_DIRECTION');

    const expenseDescription =
      `${marker}_EXPENSE`;

    const incomeDescription =
      `${marker}_INCOME`;

    const transactions: TestTransaction[] = [];

    try {
      transactions.push(
        createTestTransaction({
          description: expenseDescription,
          amount: -50,
        })
      );

      transactions.push(
        createTestTransaction({
          description: incomeDescription,
          amount: 50,
        })
      );

      await page.reload();

      await page
        .getByLabel('Kierunek')
        .selectOption('expense');

      await page
        .getByLabel('Szukaj w opisie')
        .fill(marker);

      await page
        .getByRole('button', {
          name: 'Filtruj',
          exact: true,
        })
        .click();

      const rows = page.locator('tbody tr');

      await expect(rows).toHaveCount(1);

      const expenseRow = rows.filter({
        hasText: expenseDescription,
      });

      await expect(expenseRow).toBeVisible();
      await expect(expenseRow).toContainText(
        expenseDescription
      );

      await expect(
        page.getByRole('row').filter({
          hasText: incomeDescription,
        })
      ).toHaveCount(0);

      const amountText = await expenseRow
        .locator('td')
        .nth(6)
        .innerText();

      const amount = Number(
        amountText
          .replace(/\s/g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '')
      );

      expect(amount).toBeLessThan(0);
    } finally {
      for (const transaction of transactions) {
        try {
          deleteTestTransaction(transaction);
        } catch (cleanupError) {
          console.warn(
            'Cleanup failed for transaction',
            cleanupError
          );
        }
      }
    }
  });

  test('searches transactions by description', async ({
    page,
  }) => {
    const description =
      uniqueValue('SUPERMARKET_E2E');

    const transaction =
      createTestTransaction({
        description,
      });

    try {
      await page.reload();

      await page
        .getByLabel('Szukaj w opisie')
        .fill(description);

      await page
        .getByRole('button', {
          name: 'Filtruj',
          exact: true,
        })
        .click();

      const transactionRow = page
        .getByRole('row')
        .filter({
          hasText: description,
        });

      await expect(
        transactionRow
      ).toBeVisible();

      await expect(
        transactionRow
      ).toContainText(description);
    } finally {
      deleteTestTransaction(transaction);
    }
  });

  test('clears filters', async ({
    page,
  }) => {
    await page
      .getByLabel('Konto')
      .selectOption({
        label: 'Konto Wspólne',
      });

    await page
      .getByLabel('Kierunek')
      .selectOption('expense');

    await page
      .getByLabel('Szukaj w opisie')
      .fill('E2E_CLEAR_FILTERS');

    await page
      .getByRole('button', {
        name: 'Filtruj',
        exact: true,
      })
      .click();

    await page
      .getByRole('link', {
        name: 'Wyczyść',
        exact: true,
      })
      .click();

    await expect(
      page.getByLabel('Konto')
    ).toHaveValue('');

    await expect(
      page.getByLabel('Kierunek')
    ).toHaveValue('');

    await expect(
      page.getByLabel('Szukaj w opisie')
    ).toHaveValue('');
  });
});