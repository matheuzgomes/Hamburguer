// Vetoriza a logo a partir da foto de perfil do Instagram (única fonte disponível).
// Gera em src/assets/marca/:
//   logo.svg          selo completo (oval preto + creme + mostarda)
//   logo-traco.svg    só creme e mostarda, sem o oval preto (para fundos escuros)
//   icone.svg         o hambúrguer do topo da logo, em mostarda
//
//   npm run logo
//
// Se a loja mandar o arquivo original da logo, ele substitui estes três.

import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ImageTracer from 'imagetracerjs';
import sharp from 'sharp';
import { optimize } from 'svgo';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const ORIGEM = join(RAIZ, 'nossa-hamburgueria-referencias/logo/perfil.png');
const DESTINO = join(RAIZ, 'src/assets/marca');
mkdirSync(DESTINO, { recursive: true });

// Recorte do selo dentro do print (sem os ícones do Instagram) e cores amostradas.
const SELO = { left: 80, top: 55, width: 472, height: 552 };
// Ícone: traça só o pão de cima e o queijo; o pão de baixo, que na logo fica
// cortado pelo "N", é desenhado inteiro (PAO_DE_BAIXO).
const ICONE = { left: 140, top: 30, width: 200, height: 132 }; // relativo ao SELO
const ICONE_ALTURA = 170;
const PAO_DE_BAIXO = 'M8 136h184v14q0 10-10 10H18q-10 0-10-10z';
const ESCALA = 3;
const CORES = {
  preto: { r: 0, g: 0, b: 0, a: 255 },
  creme: { r: 237, g: 227, b: 219, a: 255 },
  mostarda: { r: 212, g: 141, b: 25, a: 255 },
};
const HEX = { creme: '#ede3db', mostarda: '#d48d19', preto: '#000000' };

// O sharp não aceita dois extract seguidos antes do resize: o selo vira um PNG intermediário.
const selo = await sharp(ORIGEM).extract(SELO).png().toBuffer();

/**
 * Reduz cada pixel a uma das 3 cores antes de traçar. A borda suavizada entre o
 * creme e o preto é cinza (pouco saturada): pela cor mais próxima ela viraria
 * mostarda e deixaria um contorno amarelo nas letras. Aqui a mostarda exige
 * saturação; o resto vai para creme ou preto pela luminância.
 */
function chapar(px) {
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    const saturada = r - b > 90 && r > 110 && g < r * 0.85;
    const cor = saturada ? CORES.mostarda : (r + g + b) / 3 > 118 ? CORES.creme : CORES.preto;
    px[i] = cor.r;
    px[i + 1] = cor.g;
    px[i + 2] = cor.b;
    px[i + 3] = 255;
  }
}

async function tracar(regiao) {
  const { data, info } = await sharp(selo)
    .extract(regiao ?? { left: 0, top: 0, width: SELO.width, height: SELO.height })
    .resize({ width: (regiao?.width ?? SELO.width) * ESCALA, kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  chapar(data);
  const imagem = { width: info.width, height: info.height, data: new Uint8ClampedArray(data) };
  const svg = ImageTracer.imagedataToSVG(imagem, {
    pal: [CORES.preto, CORES.creme, CORES.mostarda],
    numberofcolors: 3,
    colorquantcycles: 1,
    ltres: 1.5,
    qtres: 1.5,
    pathomit: 24,
    rightangleenhance: false,
    blurradius: 0,
    strokewidth: 0,
    linefilter: true,
    roundcoords: 2,
    scale: 1 / ESCALA,
    viewbox: true,
    desc: false,
  });
  // Mantém só os caminhos creme e mostarda; o preto vira um oval desenhado à parte.
  const caminhos = [...svg.matchAll(/<path[^>]*\/>/g)]
    .map(([p]) => p)
    .filter((p) => !/fill="rgb\(0,0,0\)"/.test(p))
    .map((p) =>
      p
        .replace(/fill="rgb\(237,227,219\)"/, `fill="${HEX.creme}"`)
        .replace(/fill="rgb\(212,141,25\)"/, `fill="${HEX.mostarda}"`)
        .replace(/ stroke="[^"]*"/, '')
        .replace(/ stroke-width="[^"]*"/, '')
        .replace(/ opacity="1"/, '')
        .replace(/ desc="[^"]*"/, ''),
    );
  return caminhos.join('');
}

const W = SELO.width;
const H = SELO.height;
const desenho = await tracar();
const oval = `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2}" ry="${H / 2}" fill="${HEX.preto}"/>`;
const titulo = '<title>Nossa Hamburgueria Artesanal</title>';

const otimizar = (svg) =>
  optimize(svg, {
    multipass: true,
    floatPrecision: 1,
    plugins: ['preset-default'],
  }).data + '\n';

writeFileSync(
  join(DESTINO, 'logo.svg'),
  otimizar(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">${titulo}${oval}${desenho}</svg>`),
);
writeFileSync(
  join(DESTINO, 'logo-traco.svg'),
  otimizar(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">${titulo}${desenho}</svg>`),
);

const icone = await tracar(ICONE);
writeFileSync(
  join(DESTINO, 'icone.svg'),
  otimizar(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICONE.width} ${ICONE_ALTURA}" aria-hidden="true">${icone.replace(/<path fill="#ede3db"[^>]*\/>/g, '')}<path fill="${HEX.mostarda}" d="${PAO_DE_BAIXO}"/></svg>`,
  ),
);

for (const nome of ['logo.svg', 'logo-traco.svg', 'icone.svg']) {
  const { size } = statSync(join(DESTINO, nome));
  console.log(`${nome}: ${(size / 1024).toFixed(1)} KB`);
}
