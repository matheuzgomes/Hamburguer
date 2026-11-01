// Meio-tom de risografia em 2 tintas (layout 2, Lambe-lambe): a foto vira pontos
// de brasa e de preto, sobre fundo transparente (o papel é a cor do cartaz, no CSS).
// Os pontos escondem a resolução baixa das fotos originais (~600 px).
//
//   node scripts/meio-tom.mjs                 (todas as fotos do cardápio + abertura)
//   node scripts/meio-tom.mjs --so ig-supremo
//
// Grava src/assets/meio-tom/<foto>.png (paleta de 3 cores, comprime bem).

import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { cardapio } from '../src/data/cardapio.ts';

const ORIGEM = 'src/assets/fotos';
const DESTINO = 'src/assets/meio-tom';

/** OKLCH → sRGB 0–255 (as mesmas tintas do CSS do layout 2). */
function oklch(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  });
}

const BRASA = oklch(0.64, 0.2, 38);
const PRETO = oklch(0.2, 0.02, 50);

/**
 * Cobertura (0–1) de uma retícula girada: cada célula tem um ponto cujo raio cresce com
 * o escuro amostrado no centro dela. Olha as células vizinhas porque pontos grandes vazam.
 */
function reticula(escuro, w, h, { angulo, celula, dx = 0, dy = 0 }) {
  const cos = Math.cos((angulo * Math.PI) / 180);
  const sin = Math.sin((angulo * Math.PI) / 180);
  const saida = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x - dx;
      const py = y - dy;
      const u = px * cos + py * sin;
      const v = -px * sin + py * cos;
      const iu = Math.floor(u / celula);
      const iv = Math.floor(v / celula);
      let cobertura = 0;
      for (let ou = -1; ou <= 1; ou++) {
        for (let ov = -1; ov <= 1; ov++) {
          const cu = (iu + ou + 0.5) * celula;
          const cv = (iv + ov + 0.5) * celula;
          const cx = Math.round(cu * cos - cv * sin + dx);
          const cy = Math.round(cu * sin + cv * cos + dy);
          const amostra = escuro[Math.min(h - 1, Math.max(0, cy)) * w + Math.min(w - 1, Math.max(0, cx))];
          const raio = (celula / 2) * Math.sqrt(amostra) * 1.42;
          const d = Math.hypot(u - cu, v - cv);
          cobertura = Math.max(cobertura, Math.min(1, Math.max(0, raio - d + 0.5)));
        }
      }
      saida[y * w + x] = cobertura;
    }
  }
  return saida;
}

const curva = (x, ini, fim, gama = 1) => Math.min(1, Math.max(0, (x - ini) / (fim - ini))) ** gama;

async function meioTom(nome, largura, celula, saida) {
  const { data, info } = await sharp(`${ORIGEM}/${nome}.webp`)
    .resize({ width: largura })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const escuroPreto = new Float32Array(w * h);
  const escuroBrasa = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    // As fotos têm fundo quase preto: clareia antes, para o papel aparecer.
    const luz = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) ** 0.55;
    // Preto só nas sombras fundas; brasa nos meios-tons (é a cor da comida).
    escuroPreto[i] = curva(1 - luz, 0.44, 1, 1.4);
    escuroBrasa[i] = curva(1 - luz, 0.06, 0.62, 1) * 0.8;
  }
  const brasa = reticula(escuroBrasa, w, h, { angulo: 15, celula, dx: 1.5, dy: 1 });
  const preto = reticula(escuroPreto, w, h, { angulo: 45, celula });
  // Só 3 cores exatas (papel transparente, brasa, preto): sem serrilhado suavizado,
  // a imagem vira PNG de paleta e fica pequena. Na tela os pontos têm ~3 px, não se nota.
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const tinta = preto[i] >= 0.5 ? PRETO : brasa[i] >= 0.5 ? BRASA : null;
    if (!tinta) continue;
    rgba.set(tinta, i * 4);
    rgba[i * 4 + 3] = 255;
  }
  const arquivo = `${DESTINO}/${saida ?? nome}.png`;
  const { size } = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png({ palette: true, colors: 4, dither: 0, compressionLevel: 9, effort: 10 })
    .toFile(arquivo);
  return { arquivo, size, w, h };
}

const so = process.argv.includes('--so') ? process.argv[process.argv.indexOf('--so') + 1].split(',') : null;
const pedidos = [
  { nome: 'ig-supremo', saida: 'abertura', largura: 720, celula: 7 },
  { nome: 'ig-moedor', largura: 560, celula: 6 },
  // Cada foto do cardápio em dois tamanhos: o grande (destaques) e o pequeno (linhas da tabela de preços).
  ...[...new Set(cardapio.map((i) => i.foto))].flatMap((nome) => [
    { nome, largura: 560, celula: 5 },
    { nome, saida: `${nome}-p`, largura: 300, celula: 5 },
  ]),
].filter((p) => !so || so.includes(p.nome) || so.includes(p.saida));

mkdirSync(DESTINO, { recursive: true });
let total = 0;
for (const p of pedidos) {
  const r = await meioTom(p.nome, p.largura, p.celula, p.saida);
  total += r.size;
  console.log(`${r.arquivo.padEnd(48)} ${r.w}×${r.h}  ${(r.size / 1024).toFixed(1)} KB`);
}
console.log(`${pedidos.length} imagens, ${(total / 1024).toFixed(0)} KB`);
