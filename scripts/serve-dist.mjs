// Servidor estático da pasta dist/ que imita o Cloudflare Pages: aplica as regras
// de public/_headers (copiado para dist/_headers), comprime texto com gzip, serve a
// 404.html e resolve URLs "bonitas". Usado no preview, nos testes e2e e no Lighthouse.
//
//   node scripts/serve-dist.mjs            (porta 4183)
//   PORT=5000 node scripts/serve-dist.mjs
//
// Os testes e2e importam iniciarServidor() (tests/e2e/servidor.ts) em vez de
// esperar a porta responder: no WSL com rede "mirrored", conectar a uma porta
// fechada em 127.0.0.1 trava até o timeout do TCP (~2 min) em vez de recusar.

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';

const RAIZ = fileURLToPath(new URL('../dist', import.meta.url));
const PORTA = Number(process.env.PORT || 4183);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};
const COMPRIMIVEIS = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.xml', '.txt', '.svg']);

/** Lê dist/_headers no formato do Cloudflare Pages / Netlify. */
function lerRegras() {
  const arquivo = join(RAIZ, '_headers');
  if (!existsSync(arquivo)) return [];
  const regras = [];
  let atual = null;
  for (const linha of readFileSync(arquivo, 'utf8').split('\n')) {
    if (!linha.trim() || linha.trim().startsWith('#')) continue;
    if (!/^\s/.test(linha)) {
      const padrao = linha.trim();
      const regex = new RegExp('^' + padrao.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      atual = { regex, cabecalhos: [] };
      regras.push(atual);
    } else if (atual) {
      const i = linha.indexOf(':');
      atual.cabecalhos.push([linha.slice(0, i).trim(), linha.slice(i + 1).trim()]);
    }
  }
  return regras;
}

function resolver(caminhoUrl) {
  const limpo = normalize(decodeURIComponent(caminhoUrl)).replace(/^([/\\])+/, '');
  const candidatos = [limpo, join(limpo, 'index.html'), limpo + '.html'];
  for (const c of candidatos) {
    const completo = join(RAIZ, c);
    if (!completo.startsWith(RAIZ + sep) && completo !== RAIZ) return null;
    if (existsSync(completo) && statSync(completo).isFile()) return completo;
  }
  return null;
}

const tratar = (req, res) => {
  // Relido a cada requisição: um novo build não exige reiniciar o servidor.
  const regras = lerRegras();
  const url = new URL(req.url, 'http://localhost');
  let arquivo = resolver(url.pathname);
  let status = 200;
  if (!arquivo || url.pathname.endsWith('/_headers')) {
    arquivo = join(RAIZ, '404.html');
    status = 404;
  }
  const ext = extname(arquivo);
  const cabecalhos = { 'Content-Type': TIPOS[ext] || 'application/octet-stream' };
  for (const regra of regras) {
    if (regra.regex.test(url.pathname)) {
      for (const [nome, valor] of regra.cabecalhos) cabecalhos[nome] = valor;
    }
  }
  const gzip = COMPRIMIVEIS.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  if (gzip) {
    cabecalhos['Content-Encoding'] = 'gzip';
    cabecalhos['Vary'] = 'Accept-Encoding';
  }
  res.writeHead(status, cabecalhos);
  if (req.method === 'HEAD') return res.end();
  const fluxo = createReadStream(arquivo);
  (gzip ? fluxo.pipe(createGzip()) : fluxo).pipe(res);
};

/**
 * Sobe o servidor e resolve quando ele já está ouvindo. Porta ocupada resolve
 * com null: quem está nela (ex.: `npm run preview`) continua servindo.
 * @param {number} [porta]
 * @returns {Promise<import('node:http').Server | null>}
 */
export function iniciarServidor(porta = PORTA) {
  return new Promise((resolve, reject) => {
    const servidor = createServer(tratar);
    servidor.once('error', (erro) => (erro.code === 'EADDRINUSE' ? resolve(null) : reject(erro)));
    servidor.listen(porta, () => resolve(servidor));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  iniciarServidor().then((servidor) => {
    if (!servidor) throw new Error(`Porta ${PORTA} ocupada.`);
    console.log(`dist/ em http://localhost:${PORTA}`);
  });
}
