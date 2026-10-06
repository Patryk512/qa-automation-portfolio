import { test, expect } from '@playwright/test';

test.describe('Rules - apply', () => {
  test('[FE] Rules - apply single rule to transaction history', async ({ page }) => {
    const ruleValue = `E2E_APPLY_RULE_${Date.now()}`;
    let ruleCreated = false;

    await page.goto('/');
    await page.getByRole('link', { name: /reguły/i }).click();

    const ruleRow = page
      .getByRole('row')
      .filter({ hasText: ruleValue });

    try {
      // SETUP - tworzymy własną regułę
      await page.locator('#r-val').fill(ruleValue);

      await page.locator('#r-cat').selectOption({
        label: '🛒 Zakupy spożywcze',
      });

      await page
        .getByRole('button', { name: '+ Dodaj regułę' })
        .click();

      ruleCreated = true;

      await expect(ruleRow).toBeVisible();
      await expect(ruleRow).toContainText(ruleValue);
      await expect(ruleRow).toContainText('🛒 Zakupy spożywcze');

      // ACTION - zastosowanie tylko tej reguły
      await ruleRow
        .getByRole('button', {
          name: 'Zastosuj do historii',
          exact: true,
        })
        .click();

      const applyDialog = page.locator('dialog[open]');

      await expect(applyDialog).toBeVisible();

      await expect(
        applyDialog.getByRole('heading', {
          name: 'Zastosować regułę do historii?',
        })
      ).toBeVisible();

      await expect(applyDialog).toContainText(ruleValue);
      await expect(applyDialog).toContainText('Zakupy spożywcze');

      // Checkbox powinien być domyślnie wyłączony
      const overwriteManualCheckbox = applyDialog.locator(
        'input[name="overwrite_manual"]'
      );

      await expect(overwriteManualCheckbox).not.toBeChecked();

      // Potwierdzamy zastosowanie reguły
      const applyResponsePromise = page.waitForResponse(
        response =>
          /\/categories\/rules\/\d+\/apply/.test(response.url()) &&
          response.request().method() === 'POST'
      );

      await applyDialog
        .getByRole('button', {
          name: 'Zastosuj',
          exact: true,
        })
        .click();

      const applyResponse = await applyResponsePromise;

      expect(applyResponse.status()).toBeLessThan(400);

      // Reguła nadal powinna istnieć po jej zastosowaniu
      await expect(ruleRow).toBeVisible();

    } finally {
      // CLEANUP
      if (ruleCreated && await ruleRow.count() > 0) {
        try {
          await ruleRow
            .getByRole('button', {
              name: 'Usuń',
              exact: true,
            })
            .click();

          const deleteDialog = page.locator('dialog[open]');

          await expect(deleteDialog).toBeVisible();

          const clearTransactionsCheckbox = deleteDialog.locator(
            'input[name="clear_transactions"]'
          );

          if (await clearTransactionsCheckbox.isChecked()) {
            await clearTransactionsCheckbox.uncheck();
          }

          await deleteDialog
            .getByRole('button', {
              name: 'Usuń',
              exact: true,
            })
            .click();

          await expect(ruleRow).toHaveCount(0);

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