/**
 * "Pede igual ao meu": a sacola vira um link (?pedido=slug:2,slug:1) que monta a
 * mesma sacola para quem recebe. O link é texto de terceiros: só passa slug do
 * cardápio e quantidade inteira de 1 a 20; o resto é descartado.
 */
import { QTD_MAX, type Linhas } from './sacola';

export const PARAMETRO = 'pedido';
const MAX_ITENS = 30;

export function codificar(sacola: Linhas): string {
  return Object.entries(sacola)
    .filter(([, qtd]) => qtd > 0)
    .map(([slug, qtd]) => (qtd === 1 ? slug : `${slug}:${qtd}`))
    .join(',');
}

export function decodificar(texto: string | null | undefined, slugsValidos: ReadonlySet<string>): Linhas {
  const sacola: Record<string, number> = {};
  if (!texto) return sacola;
  for (const parte of texto.slice(0, 2000).split(',').slice(0, MAX_ITENS)) {
    const [slug = '', qtdTexto] = parte.trim().split(':');
    if (!slugsValidos.has(slug)) continue;
    const qtd = qtdTexto === undefined ? 1 : Number(qtdTexto);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > QTD_MAX) continue;
    sacola[slug] = Math.min(QTD_MAX, (sacola[slug] ?? 0) + qtd);
  }
  return sacola;
}

/** URL para compartilhar. Slugs só têm [a-z0-9-], então o texto fica legível. */
export function urlPedidoIgual(base: string, sacola: Linhas): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  const codigo = codificar(sacola);
  return codigo ? `${url.toString()}?${PARAMETRO}=${codigo}` : url.toString();
}
