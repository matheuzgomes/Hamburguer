/**
 * Busca e filtro do cardápio (layouts 3 e 4). Sem desenho: só esconde e mostra.
 *   [data-filtro-busca]            campo de texto (busca sem acento e sem maiúscula)
 *   [data-filtro-etiqueta="x"]     botões de liga/desliga (aria-pressed); vale um por vez
 *   [data-filtravel]               item, com data-texto (já normalizado) e data-etiquetas="a b c"
 *   [data-filtro-grupo]            seção que some quando nenhum item dela aparece
 *   [data-filtro-vazio]            aviso de "nada encontrado" (com [data-filtro-termo] dentro)
 *   [data-filtro-contagem]         "29 itens" / "3 itens com bacon"
 *   [data-filtro-limpar]           limpa busca e etiqueta
 * Evento em document: "filtro:mudou" { visiveis, termo, etiqueta }.
 */
import { normalizar } from '../lib/texto';
import { track } from '../lib/track';

const busca = document.querySelector<HTMLInputElement>('[data-filtro-busca]');
const botoes = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filtro-etiqueta]'));
const itens = Array.from(document.querySelectorAll<HTMLElement>('[data-filtravel]'));
const grupos = Array.from(document.querySelectorAll<HTMLElement>('[data-filtro-grupo]'));
let etiqueta = '';
let rastreado = '';
let temporizador = 0;

function aplicar(): void {
  const termos = normalizar(busca?.value ?? '')
    .split(/\s+/)
    .filter(Boolean);
  let visiveis = 0;
  for (const item of itens) {
    const texto = item.dataset.texto ?? '';
    const etiquetas = (item.dataset.etiquetas ?? '').split(' ');
    const aparece = termos.every((t) => texto.includes(t)) && (!etiqueta || etiquetas.includes(etiqueta));
    item.hidden = !aparece;
    if (aparece) visiveis++;
  }
  for (const grupo of grupos) grupo.hidden = !grupo.querySelector('[data-filtravel]:not([hidden])');

  const termo = busca?.value.trim() ?? '';
  for (const el of document.querySelectorAll<HTMLElement>('[data-filtro-vazio]')) {
    el.hidden = visiveis > 0;
    for (const t of el.querySelectorAll('[data-filtro-termo]')) t.textContent = termo || 'esse filtro';
  }
  const nomeEtiqueta = botoes.find((b) => b.dataset.filtroEtiqueta === etiqueta)?.dataset.filtroNome ?? '';
  const filtrando = Boolean(termos.length || etiqueta);
  for (const el of document.querySelectorAll<HTMLElement>('[data-filtro-contagem]')) {
    el.textContent = filtrando
      ? `${visiveis} ${visiveis === 1 ? 'item' : 'itens'}${nomeEtiqueta ? ` com ${nomeEtiqueta.toLowerCase()}` : ''}`
      : `${itens.length} itens`;
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-filtro-limpar]')) el.hidden = !filtrando;
  document.documentElement.toggleAttribute('data-filtrando', filtrando);
  document.dispatchEvent(new CustomEvent('filtro:mudou', { detail: { visiveis, termo, etiqueta } }));

  // Uma busca por termo no GA (quando a pessoa para de digitar), não uma por tecla.
  const chave = `${normalizar(termo)}|${etiqueta}`;
  if (filtrando && chave !== rastreado) {
    rastreado = chave;
    clearTimeout(temporizador);
    temporizador = window.setTimeout(() => track('search', { search_term: termo, etiqueta, resultados: visiveis }), 900);
  }
}

busca?.addEventListener('input', aplicar);
busca?.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && busca.value) {
    busca.value = '';
    aplicar();
  }
});

for (const botao of botoes) {
  botao.addEventListener('click', () => {
    etiqueta = etiqueta === botao.dataset.filtroEtiqueta ? '' : (botao.dataset.filtroEtiqueta ?? '');
    for (const b of botoes) b.setAttribute('aria-pressed', String(b.dataset.filtroEtiqueta === etiqueta));
    aplicar();
  });
}

for (const limpar of document.querySelectorAll<HTMLButtonElement>('[data-filtro-limpar]')) {
  limpar.addEventListener('click', () => {
    if (busca) busca.value = '';
    etiqueta = '';
    for (const b of botoes) b.setAttribute('aria-pressed', 'false');
    aplicar();
    busca?.focus();
  });
}

// O navegador pode restaurar o texto da busca ao voltar para a página.
if (busca?.value) aplicar();
