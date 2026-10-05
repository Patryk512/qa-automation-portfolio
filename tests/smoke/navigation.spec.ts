import { test, expect } from '@playwright/test';

test.describe('Home Budget - Smoke', () => {
  test('użytkownik może otworzyć aplikację i przejść z Pulpitu do Importu', async ({ page }) => {

    await test.step('Otwarcie aplikacji Home Budget', async () => {
      await page.goto('/');
    });

    await test.step('Weryfikacja załadowania Pulpitu', async () => {
      await expect(
        page.getByText('Pulpit', { exact: true }).first()
      ).toBeVisible();
    });

    await test.step('Przejście do sekcji Import', async () => {
      await page.getByRole('link', { name: 'Import' }).click();
    });

    await test.step('Weryfikacja widoku Import', async () => {
      await expect(
        page.getByRole('heading', { name: /import/i }).first()
      ).toBeVisible();
    });

  });
});