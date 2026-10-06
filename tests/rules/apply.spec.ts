import { test, expect, Page } from '@playwright/test';

import {
  ruleValue,
  transactionDescription,
} from '../../helpers/data-generator';

import {
  createTestTransaction,
  deleteTestTransaction,
} from '../../helpers/database';

async function deleteRule(
  page: Page,
  matchValue: string
): Promise<void> {
  await page.goto('/categories/rules');

  const ruleRow = page
    .getByRole('row')
    .filter({ hasText: matchValue });

  if ((await ruleRow.count()) === 0) {
    return;
  }

  await ruleRow
    .getByRole('button', {
      name: /Usu/i,
      exact: true,
    })
    .click();

  const deleteDialog = page.locator('dialog[open]');

  await expect(deleteDialog).toBeVisible();

  const clearTransactionsCheckbox =
    deleteDialog.locator(
      'input[name="clear_transactions"]'
    );

  if (await clearTransactionsCheckbox.isChecked()) {
    await clearTransactionsCheckbox.uncheck();
  }

  await deleteDialog
    .getByRole('button', {
      name: /Usu/i,
      exact: true,
    })
    .click();

  await expect(ruleRow).toHaveCount(0);
}

test.describe('Rules - apply', () => {
  test('[FE] Rules - apply single rule to transaction history', async ({ page }) => {
    const matchValue = ruleValue();
    let ruleCreated = false;

    try {
      await page.goto('/categories/rules');

      await page.locator('#r-val').fill(matchValue);

      const categoryOption = page
        .locator('#r-cat option')
        .filter({ hasText: /Zakupy spo/i })
        .first();

      const categoryValue =
        await categoryOption.getAttribute('value');

      if (!categoryValue) {
        throw new Error(
          'Nie znaleziono kategorii "Zakupy spożywcze"'
        );
      }

      await page
        .locator('#r-cat')
        .selectOption(categoryValue);

      await page
        .getByRole('button', {
          name: /Dodaj regu/i,
        })
        .click();

      ruleCreated = true;

      const ruleRow = page
        .getByRole('row')
        .filter({ hasText: matchValue });

      await expect(ruleRow).toBeVisible();
      await expect(ruleRow).toContainText(matchValue);
      await expect(ruleRow).toContainText(/Zakupy spo/i);

      await ruleRow
        .getByRole('button', {
          name: 'Zastosuj do historii',
          exact: true,
        })
        .click();

      const applyDialog = page.locator('dialog[open]');

      await expect(applyDialog).toBeVisible();
      await expect(applyDialog).toContainText(matchValue);
      await expect(applyDialog).toContainText(
        /Zakupy spo/i
      );

      const overwriteManualCheckbox =
        applyDialog.locator(
          'input[name="overwrite_manual"]'
        );

      await expect(
        overwriteManualCheckbox
      ).not.toBeChecked();

      const applyResponsePromise =
        page.waitForResponse(
          response =>
            /\/categories\/rules\/\d+\/apply/.test(
              response.url()
            ) &&
            response.request().method() === 'POST'
        );

      await applyDialog
        .getByRole('button', {
          name: 'Zastosuj',
          exact: true,
        })
        .click();

      const applyResponse =
        await applyResponsePromise;

      expect(applyResponse.status()).toBeLessThan(400);

      await expect(ruleRow).toBeVisible();
    } finally {
      if (ruleCreated) {
        try {
          await deleteRule(page, matchValue);
        } catch (cleanupError) {
          console.warn(
            `Cleanup failed for rule "${matchValue}"`,
            cleanupError
          );
        }
      }
    }
  });

  test('[E2E] Rules - apply rule categorizes matching historical transaction', async ({ page }) => {
    const matchValue = ruleValue();

    const description =
      transactionDescription(matchValue);

    const testTransaction =
      createTestTransaction({
        description,
      });

    let ruleCreated = false;

    try {
      // PRECONDITION
      // Najpierw potwierdzamy, że aplikacja widzi
      // transakcję utworzoną przez DB helper.
      await page.goto('/transactions');

      await page
        .getByLabel(/Szukaj w opisie/i)
        .fill(description);

      await page
        .getByRole('button', {
          name: 'Filtruj',
          exact: true,
        })
        .click();

      const seededTransactionRow = page
        .getByRole('row')
        .filter({ hasText: description });

      await expect(
        seededTransactionRow,
        'SETUP ERROR: aplikacja nie widzi transakcji utworzonej przez DB helper'
      ).toBeVisible();

      await expect(
        seededTransactionRow
      ).toContainText(description);

      // CREATE RULE
      await page.goto('/categories/rules');

      await page
        .locator('#r-val')
        .fill(matchValue);

      const categoryOption = page
        .locator('#r-cat option')
        .filter({ hasText: /Zakupy spo/i })
        .first();

      await expect(categoryOption).toHaveCount(1);

      const categoryValue =
        await categoryOption.getAttribute('value');

      if (!categoryValue) {
        throw new Error(
          'Nie znaleziono kategorii "Zakupy spożywcze"'
        );
      }

      await page
        .locator('#r-cat')
        .selectOption(categoryValue);

      await page
        .getByRole('button', {
          name: /Dodaj regu/i,
        })
        .click();

      ruleCreated = true;

      const ruleRow = page
        .getByRole('row')
        .filter({ hasText: matchValue });

      await expect(ruleRow).toBeVisible();
      await expect(ruleRow).toContainText(matchValue);
      await expect(ruleRow).toContainText(
        /Zakupy spo/i
      );

      // APPLY RULE
      await ruleRow
        .getByRole('button', {
          name: 'Zastosuj do historii',
          exact: true,
        })
        .click();

      const applyDialog = page.locator(
        'dialog[open]'
      );

      await expect(applyDialog).toBeVisible();
      await expect(applyDialog).toContainText(
        matchValue
      );

      const overwriteManualCheckbox =
        applyDialog.locator(
          'input[name="overwrite_manual"]'
        );

      await expect(
        overwriteManualCheckbox
      ).not.toBeChecked();

      const applyResponsePromise =
        page.waitForResponse(
          response =>
            /\/categories\/rules\/\d+\/apply/.test(
              response.url()
            ) &&
            response.request().method() === 'POST'
        );

      await applyDialog
        .getByRole('button', {
          name: 'Zastosuj',
          exact: true,
        })
        .click();

      const applyResponse =
        await applyResponsePromise;

      expect(applyResponse.status()).toBeLessThan(400);

      // VERIFY BUSINESS RESULT
      await page.goto('/transactions');

      await page
        .getByLabel(/Szukaj w opisie/i)
        .fill(description);

      await page
        .getByRole('button', {
          name: 'Filtruj',
          exact: true,
        })
        .click();

      const categorizedTransactionRow = page
        .getByRole('row')
        .filter({ hasText: description });

      await expect(
        categorizedTransactionRow
      ).toBeVisible();

      await expect(
        categorizedTransactionRow
      ).toContainText(description);

      await expect(
        categorizedTransactionRow
      ).toContainText(/Zakupy spo/i);
    } finally {
      // CLEANUP RULE
      if (ruleCreated) {
        try {
          await deleteRule(page, matchValue);
        } catch (cleanupError) {
          console.warn(
            `Cleanup failed for rule "${matchValue}"`,
            cleanupError
          );
        }
      }

      // CLEANUP TRANSACTION
      try {
        deleteTestTransaction(testTransaction);
      } catch (cleanupError) {
        console.warn(
          `Cleanup failed for transaction "${description}"`,
          cleanupError
        );
      }
    }
  });
});