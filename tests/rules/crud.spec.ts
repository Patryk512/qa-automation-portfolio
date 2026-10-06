import { test, expect } from '@playwright/test';

test.describe('Rules', () => {
  test('[FE] Rules - create rule and verify it on the list', async ({ page }) => {
    const ruleValue = `E2E_RULE_${Date.now()}`;
    let ruleCreated = false;

    await page.goto('/');

    await page.getByRole('link', { name: /reguły/i }).click();

    const ruleRow = page
      .getByRole('row')
      .filter({ hasText: ruleValue });

    try {
      await page.locator('#r-val').fill(ruleValue);

      await page.locator('#r-cat').selectOption({
        label: '🛒 Zakupy spożywcze',
      });

      await page
        .getByRole('button', { name: '+ Dodaj regułę' })
        .click();

      ruleCreated = true;

      // Walidujemy konkretny wiersz tabeli,
      // a nie każdy element strony zawierający ruleValue.
      await expect(ruleRow).toBeVisible();

      await expect(ruleRow).toContainText('🛒 Zakupy spożywcze');
      await expect(ruleRow).toContainText(ruleValue);

    } finally {
      if (ruleCreated) {
        try {
          if (await ruleRow.isVisible()) {
            // Klikamy przycisk usuwania należący do tej konkretnej reguły.
            await ruleRow
              .getByRole('button', {
                name: 'Usuń',
                exact: true,
              })
              .first()
              .click();

            // Tylko aktualnie otwarty dialog.
            const deleteDialog = page.locator('dialog[open]');

            await expect(deleteDialog).toBeVisible();
            await expect(
              deleteDialog.getByRole('heading', {
                name: 'Usunąć regułę?',
              })
            ).toBeVisible();

            await expect(deleteDialog).toContainText(ruleValue);

            const clearTransactionsCheckbox =
              deleteDialog.locator(
                'input[name="clear_transactions"]'
              );

            if (
              await clearTransactionsCheckbox.isChecked()
            ) {
              await clearTransactionsCheckbox.uncheck();
            }

            await deleteDialog
              .getByRole('button', {
                name: 'Usuń',
                exact: true,
              })
              .click();

            await expect(ruleRow).toHaveCount(0);
          }
        } catch (cleanupError) {
          console.warn(
            `Cleanup failed for rule "${ruleValue}"`,
            cleanupError
          );
        }
      }
    }
  });
});


test('[FE] Rules - delete existing rule', async ({ page }) => {
  const ruleValue = `E2E_DELETE_RULE_${Date.now()}`;
  let ruleExists = false;

  await page.goto('/');
  await page.getByRole('link', { name: /reguły/i }).click();

  const ruleRow = page
    .getByRole('row')
    .filter({ hasText: ruleValue });

  try {
    // SETUP - tworzymy regułę
    await page.locator('#r-val').fill(ruleValue);

    await page.locator('#r-cat').selectOption({
      label: '🛒 Zakupy spożywcze',
    });

    await page
      .getByRole('button', { name: '+ Dodaj regułę' })
      .click();

    ruleExists = true;

    // Sprawdzamy, że reguła rzeczywiście powstała
    await expect(ruleRow).toBeVisible();
    await expect(ruleRow).toContainText(ruleValue);

    // ACTION - usunięcie reguły
    await ruleRow
      .getByRole('button', {
        name: 'Usuń',
        exact: true,
      })
      .click();

    const deleteDialog = page.locator('dialog[open]');

    await expect(deleteDialog).toBeVisible();

    await expect(
      deleteDialog.getByRole('heading', {
        name: 'Usunąć regułę?',
      })
    ).toBeVisible();

    await expect(deleteDialog).toContainText(ruleValue);

    // Nie chcemy zmieniać kategorii istniejących transakcji
    // podczas tego testu.
    const clearTransactionsCheckbox =
      deleteDialog.locator(
        'input[name="clear_transactions"]'
      );

    if (await clearTransactionsCheckbox.isChecked()) {
      await clearTransactionsCheckbox.uncheck();
    }

    // Potwierdzamy usunięcie
    await deleteDialog
      .getByRole('button', {
        name: 'Usuń',
        exact: true,
      })
      .click();

    // VALIDATION - reguła zniknęła
    await expect(ruleRow).toHaveCount(0);

    ruleExists = false;

  } finally {
    // Cleanup tylko jeśli test padnie przed właściwym usunięciem
    if (ruleExists && await ruleRow.count() > 0) {
      try {
        await ruleRow
          .getByRole('button', {
            name: 'Usuń',
            exact: true,
          })
          .click();

        const cleanupDialog = page.locator('dialog[open]');

        const checkbox = cleanupDialog.locator(
          'input[name="clear_transactions"]'
        );

        if (await checkbox.isChecked()) {
          await checkbox.uncheck();
        }

        await cleanupDialog
          .getByRole('button', {
            name: 'Usuń',
            exact: true,
          })
          .click();

      } catch (cleanupError) {
        console.warn(
          `Cleanup failed for rule "${ruleValue}"`,
          cleanupError
        );
      }
    }
  }
});