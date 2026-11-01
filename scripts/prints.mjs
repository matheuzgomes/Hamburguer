// Prints de conferência dos layouts (celular 390×844 e computador 1440×900), com a
// loja "aberta" (21h30 em SP) e, no fim, a sacola com 2 itens aberta.
//
//   node scripts/prints.mjs                       (todas as rotas de teste)
//   node scripts/prints.mjs /teste/1-noite-de-chapa/ --fechado
//
// Precisa de `npm run build` antes. Grava em .prints/ (fora do git).

import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { iniciarServidor } from './serve-dist.mjs';

const args = process.argv.slice(2);
const fechado = args.includes('--fechado');
const rotas = args.filter((a) => a.startsWith('/'));
if (!rotas.length) rotas.push('/teste/1-noite-de-chapa/', '/teste/2-lambe-lambe/', '/teste/3-comanda/', '/teste/4-mostarda/');

const PORTA = 4180;
const SAIDA = '.prints';
const HORA = fechado ? '2026-10-31T15:00:00-03:00' : '2026-10-31T21:30:00-03:00';
const telas = [
  { nome: 'celular', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nome: 'computador', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

mkdirSync(SAIDA, { recursive: true });
const servidor = await iniciarServidor(PORTA);
const navegador = await chromium.launch();

try {
  for (const rota of rotas) {
    const base = rota.replace(/^\/teste\//, '').replace(/\/$/, '') || 'indice';
    for (const tela of telas) {
      const { nome, ...opcoes } = tela;
      const contexto = await navegador.newContext({ ...opcoes, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
      const pagina = await contexto.newPage();
      await pagina.clock.install({ time: new Date(HORA) });
      const erros = [];
      pagina.on('pageerror', (e) => erros.push(e.message));
      pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
      const resposta = await pagina.goto(`http://127.0.0.1:${PORTA}${rota}`, { waitUntil: 'networkidle' });
      if (!resposta?.ok()) {
        console.log(`${rota}: HTTP ${resposta?.status()}`);
        await contexto.close();
        continue;
      }
      // Rolagem suave atrapalha os cliques do Playwright (o alvo ainda está andando).
      await pagina.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      await pagina.evaluate(() => document.fonts.ready);
      await pagina.waitForTimeout(3200);
      const prefixo = `${SAIDA}/${base}-${nome}${fechado ? '-fechado' : ''}`;
      await pagina.screenshot({ path: `${prefixo}-1-tela.png` });

      // Página inteira: rola até o fim para carregar as fotos lazy, depois volta.
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await pagina.waitForTimeout(600);
      await pagina.screenshot({ path: `${prefixo}-2-inteira.png`, fullPage: true });

      // Sacola: 2 itens visíveis, depois abre.
      const adicionar = pagina.locator('[data-adicionar]:visible');
      if (await adicionar.count()) {
        await adicionar.nth(1).click();
        await adicionar.nth(2).click();
        await pagina.waitForTimeout(700);
        await pagina.screenshot({ path: `${prefixo}-3-com-itens.png` });
        const abrir = pagina.locator('[data-abrir]:visible').first();
        if (await abrir.count()) {
          await abrir.click();
          await pagina.waitForTimeout(700);
          await pagina.screenshot({ path: `${prefixo}-4-sacola.png` });
        }
      }
      console.log(`${rota} ${nome}: ok${erros.length ? ` · ERROS: ${erros.join(' | ')}` : ''}`);
      await contexto.close();
    }
  }
} finally {
  await navegador.close();
  servidor?.closeAllConnections();
  servidor?.close();
}
