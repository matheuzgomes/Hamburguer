/**
 * Contrato comum dos 4 layouts de teste: a sacola, o link do WhatsApp, o "Pede igual",
 * o horário, o teclado, a acessibilidade (axe) e o movimento reduzido.
 * Só roda nas rotas que existem no build.
 */
import { existsSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROTAS = ['1-noite-de-chapa', '2-lambe-lambe', '3-comanda', '4-mostarda'].filter((r) =>
  existsSync(`dist/teste/${r}/index.html`),
);

const ABERTO = new Date('2026-10-31T21:30:00-03:00');
const FECHADO = new Date('2026-10-31T15:00:00-03:00');

async function abrir(page: Page, rota: string, { hora = ABERTO, busca = '' } = {}) {
  await page.clock.install({ time: hora });
  await page.goto(`/teste/${rota}/${busca}`);
  // Sem rolagem suave: o Playwright clica onde o alvo já está.
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
}

const botaoAdicionar = (page: Page, slug: string) => page.locator(`[data-adicionar="${slug}"]:visible`).first();
const contagem = (page: Page) => page.locator('[data-sacola-contagem]').first();

async function abrirSacola(page: Page) {
  await page.locator('[data-abrir="sacola"]:visible').first().click();
  await expect(page.locator('#sacola')).toBeVisible();
}

for (const rota of ROTAS) {
  test.describe(rota, () => {
    test('carrega sem erro e sem rolagem lateral', async ({ page }) => {
      const erros: string[] = [];
      page.on('pageerror', (e) => erros.push(e.message));
      page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
      await abrir(page, rota);
      await expect(page.locator('h1')).toBeVisible();
      const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(larguras[0]).toBeLessThanOrEqual(larguras[1]);
      expect(erros).toEqual([]);
    });

    test('mostra o status da loja e muda o botão quando está fechada', async ({ page }) => {
      await abrir(page, rota);
      await expect(page.locator('html')).toHaveAttribute('data-loja', 'aberta');
      await expect(page.locator('[data-status-loja]').first()).toContainText('Aberto');

      await page.clock.setSystemTime(FECHADO);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-loja', 'fechada');
      await expect(page.locator('[data-status-loja]').first()).toContainText('19h');
      await expect(page.locator('[data-rotulo-enviar]').first()).toContainText('abrimos às 19h');
    });

    test('monta a sacola, guarda no aparelho e leva tudo pro WhatsApp', async ({ page }) => {
      await abrir(page, rota);
      await botaoAdicionar(page, 'combo-nosso-smash').click();
      await botaoAdicionar(page, 'porcao-nuggets').click();
      await page.locator('[data-mais="combo-nosso-smash"]:visible').first().click();
      await expect(contagem(page)).toHaveText('3');

      await page.reload();
      await expect(contagem(page)).toHaveText('3');
      await expect(page.locator('html')).toHaveAttribute('data-sacola', 'cheia');

      await abrirSacola(page);
      const sacola = page.locator('#sacola');
      await expect(sacola.locator('[data-linha-slug]')).toHaveCount(2);
      await expect(sacola.locator('[data-sacola-total]')).toHaveText('R$ 67,70');

      const href = await sacola.locator('a[data-enviar]').getAttribute('href');
      expect(href).toContain('https://wa.me/5521966050013?text=');
      const texto = decodeURIComponent(href!.split('text=')[1]);
      expect(texto).toContain('2x Combo Nosso Smash');
      expect(texto).toContain('1x Porção de Nuggets');
      expect(texto).toContain('Total dos itens: R$ 67,70');
    });

    test('sugere o upgrade e troca o item', async ({ page }) => {
      await abrir(page, rota);
      await botaoAdicionar(page, 'combo-nosso-smash').click();
      await abrirSacola(page);
      const upgrade = page.locator('#sacola [data-upgrade]');
      await expect(upgrade).toBeVisible();
      await expect(upgrade).toContainText('+R$ 5,00');
      await upgrade.locator('[data-upgrade-aceitar]').click();
      await expect(page.locator('#sacola [data-linha="nome"]')).toHaveText(['Combo Smash Bacon']);
    });

    test('o link "Pede igual" monta a mesma sacola e some da barra de endereço', async ({ page }) => {
      await abrir(page, rota, { busca: '?pedido=combo-duplo-smash-bacon:2,nao-existe:3' });
      await expect(contagem(page)).toHaveText('2');
      expect(new URL(page.url()).search).toBe('');
      await expect(page.locator('[data-aviso]')).toContainText('igual à do link');
    });

    test('pelo teclado, o foco segue o item quando o botão vira seletor', async ({ page, isMobile }) => {
      test.skip(isMobile, 'teclado só no computador');
      await abrir(page, rota);
      const botao = botaoAdicionar(page, 'combo-smash-bacon');
      await botao.focus();
      await page.keyboard.press('Enter');
      await expect(contagem(page)).toHaveText('1');
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.dataset.mais ?? el?.dataset.adicionar ?? el?.tagName;
      });
      expect(foco).toBe('combo-smash-bacon');

      // Esc fecha a sacola e o foco volta pro botão que abriu.
      const abrirBotao = page.locator('[data-abrir="sacola"]:visible').first();
      await abrirBotao.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#sacola')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#sacola')).toBeHidden();
      await expect(abrirBotao).toBeFocused();
    });

    test('axe: sem violações, com a sacola fechada e aberta', async ({ page }) => {
      await abrir(page, rota);
      const regras = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
      const fechada = await new AxeBuilder({ page }).withTags(regras).analyze();
      expect(fechada.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

      await botaoAdicionar(page, 'combo-nosso-smash').click();
      await abrirSacola(page);
      await page.waitForTimeout(500);
      const aberta = await new AxeBuilder({ page }).include('#sacola').withTags(regras).analyze();
      expect(aberta.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });

    test('as animações presas à rolagem estão valendo', async ({ page }) => {
      test.skip(!['2-lambe-lambe', '4-mostarda'].includes(rota), 'layout sem animação de rolagem');
      await abrir(page, rota);
      // Pega o caso em que o CSS minificado vira uma regra inválida e a animação some calada.
      const presas = await page.evaluate(
        () => document.getAnimations().filter((a) => a.timeline && !(a.timeline instanceof DocumentTimeline)).length,
      );
      expect(presas).toBeGreaterThan(0);
    });

    test('com movimento reduzido, nada fica animando sem parar', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await abrir(page, rota);
      await page.waitForTimeout(300);
      const infinitas = await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length,
      );
      expect(infinitas).toBe(0);
    });
  });
}
