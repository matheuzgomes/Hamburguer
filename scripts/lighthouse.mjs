// Roda o Lighthouse (perfil mobile padrão: Moto G Power, 4G lento simulado) contra
// o build servido por scripts/serve-dist.mjs, que aplica os cabeçalhos reais.
// Rode `npm run build` antes. Relatórios HTML vão para .lighthouse/.
//
//   npm run lighthouse
//   npm run lighthouse -- /teste/3-comanda/
//   npm run lighthouse -- https://site-publicado.exemplo/   (mede o site no ar)

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const PORTA = 4174;
const caminhos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/teste/1-noite-de-chapa/', '/teste/2-lambe-lambe/', '/teste/3-comanda/', '/teste/4-mostarda/'];

const servidor = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  env: { ...process.env, PORT: String(PORTA) },
  stdio: 'ignore',
});
await new Promise((ok) => setTimeout(ok, 600));

// O Chromium é aberto pelo Playwright (e não pelo chrome-launcher, que no WSL
// converte caminhos para o formato do Windows e cria pastas estranhas no projeto).
const PORTA_DEPURACAO = 9333;
const navegador = await chromium.launch({
  channel: 'chromium',
  args: [`--remote-debugging-port=${PORTA_DEPURACAO}`],
});

let falhou = false;
try {
  await mkdir('.lighthouse', { recursive: true });
  for (const caminho of caminhos) {
    const url = /^https?:\/\//.test(caminho) ? caminho : `http://localhost:${PORTA}${caminho}`;
    const { lhr, report } = await lighthouse(url, { port: PORTA_DEPURACAO, output: 'html', logLevel: 'error' });
    const nome = new URL(url).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'inicio';
    await writeFile(`.lighthouse/${nome}.html`, report);

    const notas = Object.values(lhr.categories).map((c) => [c.title, Math.round(c.score * 100)]);
    const a = lhr.audits;
    const requisicoes = a['network-requests'].details.items;
    console.log(`\n${caminho}`);
    for (const [titulo, nota] of notas) {
      console.log(`  ${nota >= 95 ? '✓' : '✗'} ${titulo}: ${nota}`);
      if (nota < 95) falhou = true;
    }
    console.log(`  LCP ${a['largest-contentful-paint'].displayValue} · CLS ${a['cumulative-layout-shift'].displayValue} · TBT ${a['total-blocking-time'].displayValue} · FCP ${a['first-contentful-paint'].displayValue}`);
    console.log(`  ${requisicoes.length} requisições, ${Math.round(a['total-byte-weight'].numericValue / 1024)} KB transferidos`);
    for (const r of requisicoes) console.log(`    ${r.resourceType?.padEnd(10)} ${String(Math.round(r.transferSize / 102.4) / 10).padStart(6)} KB  ${r.url.replace(new URL(url).origin, '')}`);
    for (const auditoria of Object.values(a)) {
      if (auditoria.score !== null && auditoria.score < 0.9 && auditoria.scoreDisplayMode !== 'informative' && auditoria.scoreDisplayMode !== 'manual') {
        console.log(`  ! ${auditoria.id}: ${auditoria.title} (${auditoria.displayValue ?? auditoria.score})`);
      }
    }
  }
} finally {
  await navegador.close();
  servidor.kill();
}
process.exitCode = falhou ? 1 : 0;
