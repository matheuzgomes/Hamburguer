// Confere o build (dist/) contra o orçamento do plano, rota por rota:
//   - JS do carregamento inicial ≤ 8 KB gzip (segue os imports entre os arquivos do bundle)
//   - no máximo 2 arquivos de fonte por rota
//   - imagem prioritária (fetchpriority="high", a candidata a LCP) ≤ 120 KB no maior arquivo
//   - nenhum <script> inline executável (o CSP é script-src 'self')
// E lista as marcas [CONFIRMAR] dos dados (o que falta a loja confirmar).
//
//   npm run check:dist             (marcas só avisam)
//   npm run check:dist -- --strict (marca [CONFIRMAR] também reprova: use antes de publicar)
//   npm run check:dist -- --json   (só os números, para o comparativo)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'dist');
const LIMITE_JS = 8 * 1024;
const LIMITE_FONTES = 2;
const LIMITE_LCP = 120 * 1024;
const estrito = process.argv.includes('--strict');
const soJson = process.argv.includes('--json');

function paginas(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return paginas(caminho);
    return nome.endsWith('.html') ? [caminho] : [];
  });
}

const gz = (caminho) => gzipSync(readFileSync(caminho), { level: 9 }).length;
// URLs carry the site base (e.g. "/Hamburguer/_astro/x.js" on GitHub Pages); dist/ does not.
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const arquivoDe = (url) => {
  const urlPath = decodeURIComponent(url.split(/[?#]/)[0]);
  return join(DIST, urlPath.startsWith(BASE) ? urlPath.slice(BASE.length - 1) : urlPath);
};

/** Soma o gzip de um módulo e de tudo o que ele importa estaticamente (sem contar duas vezes). */
function grafoJs(entradas) {
  const vistos = new Set();
  const fila = [...entradas];
  let total = 0;
  while (fila.length) {
    const arquivo = fila.pop();
    if (vistos.has(arquivo)) continue;
    vistos.add(arquivo);
    total += gz(arquivo);
    const codigo = readFileSync(arquivo, 'utf8');
    for (const m of codigo.matchAll(/(?:import|export)\s*(?:[\w*{}\s,$]+from\s*)?["']([^"']+\.js)["']/g)) {
      fila.push(m[1].startsWith('/') ? arquivoDe(m[1]) : join(dirname(arquivo), m[1]));
    }
  }
  return { total, arquivos: vistos.size };
}

function maiorAvifPrioritario(html) {
  const imagens = [...html.matchAll(/<picture>(.*?)<\/picture>/gs)].filter((m) => /fetchpriority="high"/.test(m[1]));
  let maior = 0;
  for (const [, picture] of imagens) {
    const fonte = [...picture.matchAll(/<source\b[^>]*>/g)].map((m) => m[0]).find((t) => t.includes('type="image/avif"'));
    const srcset = fonte?.match(/srcset="([^"]+)"/)?.[1] ?? '';
    for (const candidato of srcset.split(',')) {
      const url = candidato.trim().split(/\s+/)[0];
      if (url) maior = Math.max(maior, statSync(arquivoDe(url)).size);
    }
  }
  // <img> prioritária fora de <picture> (ex.: o meio-tom do layout 2).
  const soltas = html.replace(/<picture>.*?<\/picture>/gs, '').matchAll(/<img\b[^>]*fetchpriority="high"[^>]*>/g);
  for (const [tag] of soltas) {
    const urls = [tag.match(/\bsrc="([^"]+)"/)?.[1], ...(tag.match(/srcset="([^"]+)"/)?.[1] ?? '').split(',').map((c) => c.trim().split(/\s+/)[0])];
    for (const url of urls.filter(Boolean)) maior = Math.max(maior, statSync(arquivoDe(url)).size);
  }
  return maior;
}

const rotas = paginas(DIST)
  .filter((p) => !p.endsWith('404.html'))
  .map((pagina) => {
    const html = readFileSync(pagina, 'utf8');
    const rota = '/' + relative(DIST, pagina).replace(/index\.html$/, '').replaceAll('\\', '/');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    const externos = scripts.map((m) => m[1].match(/\bsrc="([^"]+)"/)?.[1]).filter(Boolean).map(arquivoDe);
    const inline = scripts.filter(
      (m) => !/\bsrc=/.test(m[1]) && !/type="application\/(?:ld\+)?json"/.test(m[1]) && m[2].trim(),
    ).length;
    const js = grafoJs(externos);
    const fontes = new Set([...html.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)].map((m) => m[1])).size;
    const lcp = maiorAvifPrioritario(html);
    const problemas = [
      js.total > LIMITE_JS && `JS ${(js.total / 1024).toFixed(1)} KB gzip (máx. ${LIMITE_JS / 1024} KB)`,
      fontes > LIMITE_FONTES && `${fontes} fontes (máx. ${LIMITE_FONTES})`,
      lcp > LIMITE_LCP && `imagem prioritária ${(lcp / 1024).toFixed(0)} KB (máx. ${LIMITE_LCP / 1024} KB)`,
      inline && `${inline} script(s) inline (o CSP bloqueia)`,
    ].filter(Boolean);
    return { rota, js: js.total, modulos: js.arquivos, fontes, lcp, html: gz(pagina), problemas };
  })
  .sort((a, b) => a.rota.localeCompare(b.rota));

// Marcas [CONFIRMAR] nos dados.
const marcas = [];
const dados = readdirSync(join(RAIZ, 'src/data'))
  .filter((n) => n.endsWith('.ts'))
  .map((n) => join(RAIZ, 'src/data', n));
for (const arquivo of dados) {
  readFileSync(arquivo, 'utf8')
    .split('\n')
    .forEach((linha, i) => {
      // Só a marca no começo do comentário (os comentários que explicam a marca não contam)
      // e o campo confirmar: de cada item do cardápio.
      const marca = /^\s*(?:\/\/|\/\*+|\*)\s*\[CONFIRMAR\]/.test(linha) || /^\s*confirmar:\s*['"`]/.test(linha);
      if (marca) marcas.push(`${relative(RAIZ, arquivo)}:${i + 1}  ${linha.trim().replace(/^\/\*+\s*|\s*\*\/$/g, '')}`);
    });
}

if (soJson) {
  console.log(JSON.stringify({ rotas, marcas: marcas.length }, null, 2));
  process.exit(0);
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
for (const r of rotas) {
  const linha = `${r.rota.padEnd(26)} JS ${kb(r.js).padStart(8)} gzip (${r.modulos} arq.) · fontes ${r.fontes} · LCP ${r.lcp ? kb(r.lcp) : '—'} · HTML ${kb(r.html)} gzip`;
  console.log(`${r.problemas.length ? '✗' : '✓'} ${linha}`);
  for (const p of r.problemas) console.log(`    ! ${p}`);
}
console.log(`\n${marcas.length} marca(s) [CONFIRMAR]:`);
for (const m of marcas) console.log(`  ${m}`);

const reprovadas = rotas.filter((r) => r.problemas.length).length;
if (reprovadas || (estrito && marcas.length)) {
  console.error(`\nReprovado: ${reprovadas} rota(s) fora do orçamento${estrito && marcas.length ? ` e ${marcas.length} marca(s) [CONFIRMAR]` : ''}.`);
  process.exit(1);
}
