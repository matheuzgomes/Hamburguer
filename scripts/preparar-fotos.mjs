// Recorta as fotos de referência (fora do git) e grava os originais limpos em
// src/assets/fotos/<nome>.webp, que o astro:assets otimiza no build.
//
//   npm run fotos                      → gera todas
//   npm run fotos -- --folha saida.jpg → também monta uma folha de contato para conferência
//   npm run fotos -- --so a,b          → só os recortes indicados
//
// As coordenadas ficam em src/data/recortes.json.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const config = JSON.parse(readFileSync(join(RAIZ, 'src/data/recortes.json'), 'utf8'));
const ORIGEM = join(RAIZ, config.origem);
const DESTINO = join(RAIZ, 'src/assets/fotos');

if (!existsSync(ORIGEM)) {
  console.error(`Pasta de referências não encontrada: ${ORIGEM}`);
  process.exit(1);
}
mkdirSync(DESTINO, { recursive: true });

const iFolha = process.argv.indexOf('--folha');
const folha = iFolha > -1 ? process.argv[iFolha + 1] : null;
const tiles = [];
const LADO = 240;

let n = 0;
const iSo = process.argv.indexOf('--so');
const so = iSo > -1 ? new Set(process.argv[iSo + 1].split(',')) : null;

for (const [nome, r] of Object.entries(config.recortes)) {
  if (so && !so.has(nome)) continue;
  const arquivo = join(DESTINO, `${nome}.webp`);
  const recorte = sharp(join(ORIGEM, r.de)).extract({ left: r.l, top: r.t, width: r.w, height: r.h });
  await recorte.clone().webp({ quality: 92, effort: 6 }).toFile(arquivo);
  if (folha) {
    const img = await recorte.clone().resize(LADO, LADO, { fit: 'contain', background: '#222' }).toBuffer();
    const rotulo = Buffer.from(
      `<svg width="${LADO}" height="22"><rect width="${LADO}" height="22" fill="#000"/><text x="4" y="15" font-size="12" fill="#ff0" font-family="sans-serif">${nome} ${r.w}×${r.h}</text></svg>`,
    );
    const x = (n % 6) * (LADO + 6);
    const y = Math.floor(n / 6) * (LADO + 28);
    tiles.push({ input: rotulo, left: x, top: y }, { input: img, left: x, top: y + 22 });
  }
  n++;
}

if (folha) {
  const linhas = Math.ceil(n / 6);
  await sharp({ create: { width: 6 * (LADO + 6), height: linhas * (LADO + 28), channels: 3, background: '#444' } })
    .composite(tiles)
    .jpeg({ quality: 80 })
    .toFile(folha);
  console.log(`Folha de contato: ${folha}`);
}
console.log(`${n} fotos em src/assets/fotos/`);
