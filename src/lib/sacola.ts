/**
 * Sacola: estado imutável (slug → quantidade) e a mensagem do WhatsApp.
 * Funções puras; a interface (src/scripts/sacola-ui.ts) guarda o estado no aparelho.
 */
import { preco } from './dinheiro';

export type Linhas = Readonly<Record<string, number>>;

/** O mínimo que a sacola precisa saber de cada item (o navegador recebe só isso). */
export interface ItemSacola {
  slug: string;
  nome: string;
  preco: number;
  upgrade?: string;
}

export type Catalogo = ReadonlyMap<string, ItemSacola>;

export const QTD_MAX = 20;

const limitar = (qtd: number) => Math.max(0, Math.min(QTD_MAX, Math.trunc(qtd)));

export function definir(sacola: Linhas, slug: string, qtd: number): Linhas {
  const nova = { ...sacola };
  const q = limitar(qtd);
  if (q > 0) nova[slug] = q;
  else delete nova[slug];
  return nova;
}

export function adicionar(sacola: Linhas, slug: string, qtd = 1): Linhas {
  return definir(sacola, slug, (sacola[slug] ?? 0) + qtd);
}

export function remover(sacola: Linhas, slug: string): Linhas {
  return definir(sacola, slug, 0);
}

export interface Linha {
  item: ItemSacola;
  qtd: number;
  subtotal: number;
}

/** Linhas válidas, na ordem em que foram adicionadas. Slugs fora do catálogo são ignorados. */
export function linhas(sacola: Linhas, catalogo: Catalogo): Linha[] {
  return Object.entries(sacola).flatMap(([slug, qtd]) => {
    const item = catalogo.get(slug);
    return item && qtd > 0 ? [{ item, qtd, subtotal: item.preco * qtd }] : [];
  });
}

export function total(sacola: Linhas, catalogo: Catalogo): number {
  return linhas(sacola, catalogo).reduce((soma, l) => soma + l.subtotal, 0);
}

export function contagem(sacola: Linhas, catalogo: Catalogo): number {
  return linhas(sacola, catalogo).reduce((soma, l) => soma + l.qtd, 0);
}

/** Quanto falta para o pedido mínimo (0 se já passou ou se a sacola está vazia). */
export function faltaParaMinimo(totalAtual: number, minimo: number): number {
  return totalAtual > 0 && totalAtual < minimo ? minimo - totalAtual : 0;
}

export interface Upgrade {
  de: ItemSacola;
  para: ItemSacola;
  /** Diferença por unidade, em centavos. */
  diferenca: number;
}

/** O primeiro item da sacola com um degrau acima que ainda não está na sacola. */
export function sugestaoUpgrade(sacola: Linhas, catalogo: Catalogo): Upgrade | null {
  for (const { item } of linhas(sacola, catalogo)) {
    const para = item.upgrade ? catalogo.get(item.upgrade) : undefined;
    if (para && !sacola[para.slug] && para.preco > item.preco) {
      return { de: item, para, diferenca: para.preco - item.preco };
    }
  }
  return null;
}

/** Troca todas as unidades de `de` por `para`, mantendo a quantidade. */
export function aceitarUpgrade(sacola: Linhas, de: string, para: string): Linhas {
  const qtd = sacola[de] ?? 0;
  if (!qtd) return sacola;
  return adicionar(remover(sacola, de), para, qtd);
}

export interface DadosPedido {
  bairro?: string;
  pagamento?: string;
  observacao?: string;
  /** "(origem: instagram · bio)" ou "". */
  origem?: string;
}

/** Remove quebras e caracteres de controle e limita o tamanho de um texto livre. */
export function limparTexto(texto: string | undefined, maximo = 200): string {
  return (texto ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);
}

export function montarMensagem(sacola: Linhas, catalogo: Catalogo, dados: DadosPedido = {}): string {
  const itens = linhas(sacola, catalogo);
  const partes = ['Oi, Nossa! Quero fazer um pedido:', ''];
  for (const { item, qtd, subtotal } of itens) partes.push(`${qtd}x ${item.nome} — ${preco(subtotal, ' ')}`);
  partes.push('', `Total dos itens: ${preco(total(sacola, catalogo), ' ')}`);
  const bairro = limparTexto(dados.bairro, 40);
  const pagamento = limparTexto(dados.pagamento, 30);
  const observacao = limparTexto(dados.observacao);
  if (bairro) partes.push(`Entrega em: ${bairro}`);
  if (pagamento) partes.push(`Pagamento: ${pagamento}`);
  if (observacao) partes.push(`Obs.: ${observacao}`);
  partes.push('Endereço: ');
  const origem = limparTexto(dados.origem, 80);
  if (origem) partes.push('', origem);
  return partes.join('\n');
}
