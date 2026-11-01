// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// Domínio definitivo ainda não existe ([PREENCHER] na Etapa 3). SITE_URL no build tem prioridade.
const site = process.env.SITE_URL || 'https://nossahamburgueria.example';
// Sub-path the site is served from. On a GitHub Pages project site it is "/Hamburguer"
// (the workflow passes BASE_PATH); locally, in tests and on Cloudflare it stays at the root.
const base = process.env.BASE_PATH || '/';

/** Caminho de uma fonte local (subconjunto latin, que cobre o português). */
/** @param {string} nome */
const arquivo = (nome) => `./src/assets/fonts/${nome}`;

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // CSS crítico embutido em cada página (o CSS de cada layout é pequeno).
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // Nada de scripts/imagens como data URI: mantém o CSP com script-src 'self'.
      assetsInlineLimit: 0,
      modulePreload: false,
    },
  },
  fonts: [
    // 1. Noite de chapa
    {
      provider: fontProviders.local(),
      name: 'Big Shoulders Display',
      cssVariable: '--font-ombros',
      fallbacks: ['Arial Narrow', 'sans-serif'],
      display: 'swap',
      options: { variants: [{ src: [arquivo('big-shoulders-display-latin-wght-normal.woff2')], weight: '100 900', style: 'normal' }] },
    },
    // 2. Lambe-lambe
    {
      provider: fontProviders.local(),
      name: 'Ultra',
      cssVariable: '--font-ultra',
      fallbacks: ['Rockwell', 'Georgia', 'serif'],
      display: 'swap',
      options: { variants: [{ src: [arquivo('ultra-latin-400-normal.woff2')], weight: 400, style: 'normal' }] },
    },
    // 3. Comanda
    {
      provider: fontProviders.local(),
      name: 'Schibsted Grotesk',
      cssVariable: '--font-schibsted',
      fallbacks: ['Arial', 'sans-serif'],
      display: 'swap',
      options: { variants: [{ src: [arquivo('schibsted-grotesk-latin-wght-normal.woff2')], weight: '400 900', style: 'normal' }] },
    },
    {
      provider: fontProviders.local(),
      name: 'Fragment Mono',
      cssVariable: '--font-fragment',
      fallbacks: ['Courier New', 'monospace'],
      display: 'swap',
      options: { variants: [{ src: [arquivo('fragment-mono-latin-400-normal.woff2')], weight: 400, style: 'normal' }] },
    },
    // 4. Mostarda
    {
      provider: fontProviders.local(),
      name: 'Bagel Fat One',
      cssVariable: '--font-bagel',
      fallbacks: ['Arial Rounded MT Bold', 'Arial Black', 'sans-serif'],
      display: 'swap',
      options: { variants: [{ src: [arquivo('bagel-fat-one-latin-400-normal.woff2')], weight: 400, style: 'normal' }] },
    },
  ],
});
