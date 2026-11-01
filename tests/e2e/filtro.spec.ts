/**
 * Busca e filtro por ingrediente (layouts 3 e 4) e o carimbo do cupom (layout 3).
 * Só roda nas rotas que existem no build.
 */
import { existsSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { cardapio } from '../../src/data/cardapio';

const ROTAS = ['3-comanda', '4-mostarda'].filter((r) => existsSync(`dist/teste/${r}/index.html`));
const ABERTO = new Date('2026-10-31T21:30:00-03:00');

async function abrir(page: Page, rota: string) {
  await page.clock.install({ time: ABERTO });
  await page.goto(`/teste/${rota}/`);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
}

const visiveis = (page: Page) => page.locator('[data-filtravel]:visible');

for (const rota of ROTAS) {
  test.describe(rota, () => {
    test('a busca ignora acento e maiúscula e só mostra o que bate', async ({ page }) => {
      await abrir(page, rota);
      const busca = page.locator('[data-filtro-busca]');
      test.skip(!(await busca.count()), 'layout sem campo de busca (filtra só por ingrediente)');
      await busca.fill('PORCAO');
      await expect(visiveis(page).first()).toBeVisible();
      const textos = await visiveis(page).evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.texto ?? ''));
      expect(textos.length).toBeGreaterThan(0);
      for (const t of textos) expect(t).toContain('porcao');
      await expect(page.locator('[data-filtro-contagem]').first()).toHaveText(
        `${textos.length} ${textos.length === 1 ? 'item' : 'itens'}`,
      );
      // Grupo sem nenhum item visível some inteiro.
      await expect(page.locator('[data-filtro-grupo]:visible')).toHaveCount(1);

      await busca.press('Escape');
      await expect(busca).toHaveValue('');
      await expect(visiveis(page)).toHaveCount(cardapio.length);
    });

    test('sem resultado, explica e oferece limpar', async ({ page }) => {
      await abrir(page, rota);
      const busca = page.locator('[data-filtro-busca]');
      test.skip(!(await busca.count()), 'layout sem campo de busca (filtra só por ingrediente)');
      await busca.fill('pizza');
      const vazio = page.locator('[data-filtro-vazio]');
      await expect(vazio).toBeVisible();
      await expect(vazio).toContainText('pizza');
      await expect(visiveis(page)).toHaveCount(0);
      await vazio.locator('[data-filtro-limpar]').click();
      await expect(vazio).toBeHidden();
      await expect(visiveis(page)).toHaveCount(cardapio.length);
      await expect(busca).toBeFocused();
    });

    test('o filtro por ingrediente vale um por vez e desliga no segundo toque', async ({ page }) => {
      await abrir(page, rota);
      const frango = page.locator('[data-filtro-etiqueta="frango"]');
      const bacon = page.locator('[data-filtro-etiqueta="bacon"]');
      const comFrango = cardapio.filter((i) => i.etiquetas.includes('frango')).length;
      const comBacon = cardapio.filter((i) => i.etiquetas.includes('bacon')).length;

      await frango.click();
      await expect(frango).toHaveAttribute('aria-pressed', 'true');
      await expect(visiveis(page)).toHaveCount(comFrango);
      await expect(page.locator('[data-filtro-contagem]').first()).toContainText('com frango');

      await bacon.click();
      await expect(frango).toHaveAttribute('aria-pressed', 'false');
      await expect(bacon).toHaveAttribute('aria-pressed', 'true');
      await expect(visiveis(page)).toHaveCount(comBacon);

      await bacon.click();
      await expect(bacon).toHaveAttribute('aria-pressed', 'false');
      await expect(visiveis(page)).toHaveCount(cardapio.length);
    });
  });
}

test.describe('3-comanda', () => {
  test.skip(!existsSync('dist/teste/3-comanda/index.html'), 'layout 3 fora do build');

  test('o cupom é carimbado ao enviar e o carimbo sai quando o pedido muda', async ({ page }) => {
    await abrir(page, '3-comanda');
    // Não abre o WhatsApp de verdade: o clique ainda chega ao cupom.
    await page.evaluate(() =>
      document.addEventListener(
        'click',
        (e) => (e.target as Element).closest('a[data-enviar]') && e.preventDefault(),
        true,
      ),
    );
    await page.locator('[data-adicionar="combo-nosso-smash"]').click();
    await page.locator('[data-abrir="sacola"]:visible').first().click();
    const sacola = page.locator('#sacola');
    await expect(sacola).toBeVisible();
    await expect(sacola).not.toHaveAttribute('data-carimbado');

    await sacola.locator('a[data-enviar]').click();
    await expect(sacola).toHaveAttribute('data-carimbado', '');
    await expect(sacola.locator('.carimbo')).toHaveCSS('opacity', '1');

    await sacola.locator('[data-mais="combo-nosso-smash"]').click();
    await expect(sacola).not.toHaveAttribute('data-carimbado');
  });
});

test.describe('4-mostarda', () => {
  test.skip(!existsSync('dist/teste/4-mostarda/index.html'), 'layout 4 fora do build');

  /** A mesma regra do quiz.ts: mais ingredientes em comum; empata o destaque, depois o menor preço. */
  function esperado(marcadas: string[]) {
    const peso = { campeao: 0, 'mais-pedido': 1, novo: 2 } as const;
    return cardapio
      .filter((i) => i.grupo === 'so-eu')
      .map((i) => ({ i, p: marcadas.filter((m) => (i.etiquetas as string[]).includes(m)).length }))
      .sort((a, b) => b.p - a.p || (a.i.destaque ? peso[a.i.destaque] : 3) - (b.i.destaque ? peso[b.i.destaque] : 3) || a.i.preco - b.i.preco)[0]!.i;
  }

  test('"Qual é o seu?" acha o lanche, troca o ingrediente mais antigo e deixa adicionar', async ({ page }) => {
    await abrir(page, '4-mostarda');
    const quiz = page.locator('#qual-e-o-seu');
    const resultado = quiz.locator('[data-quiz-resultado]:visible');
    await expect(quiz.locator('[data-quiz-vazio]')).toBeVisible();
    await expect(resultado).toHaveCount(0);

    const marcar = (e: string) => quiz.locator(`[data-quiz-opcao][value="${e}"]`).check({ force: true });
    await marcar('frango');
    await expect(resultado).toHaveCount(1);
    await expect(resultado).toHaveAttribute('data-item', esperado(['frango']).slug);

    await marcar('catupiry');
    await marcar('bacon');
    await expect(resultado).toHaveAttribute('data-item', esperado(['frango', 'catupiry', 'bacon']).slug);

    // O quarto desmarca o primeiro (frango).
    await marcar('salada');
    await expect(quiz.locator('[data-quiz-opcao]:checked')).toHaveCount(3);
    await expect(quiz.locator('[data-quiz-opcao][value="frango"]')).not.toBeChecked();
    const slug = esperado(['catupiry', 'bacon', 'salada']).slug;
    await expect(resultado).toHaveAttribute('data-item', slug);
    await expect(quiz.locator('[data-quiz-status]')).toContainText('Deu ');

    await resultado.locator(`[data-adicionar="${slug}"]`).click();
    await expect(page.locator('[data-sacola-contagem]').first()).toHaveText('1');
    await expect(resultado.locator(`[data-compartilhar="quiz:${slug}"]`)).toBeVisible();
  });
});
