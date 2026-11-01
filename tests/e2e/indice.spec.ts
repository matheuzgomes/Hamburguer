/** A página de escolha (/): leva aos 4 layouts, cabe na tela e passa no axe. */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('a página de escolha leva aos 4 layouts e é acessível', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Escolha o caminho do site');
  for (const rota of ['1-noite-de-chapa', '2-lambe-lambe', '3-comanda', '4-mostarda']) {
    await expect(page.locator(`a[href="/teste/${rota}/"]`).first()).toBeVisible();
    const resposta = await page.request.get(`/teste/${rota}/`);
    expect(resposta.status()).toBe(200);
  }
  const [rolagem, largura] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(rolagem).toBeLessThanOrEqual(largura);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
