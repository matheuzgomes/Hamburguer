/**
 * Cardápio: transcrito do catálogo do WhatsApp (28 itens em 31/10/2026) e
 * conferido contra cada arte. Os textos de composição vêm das artes e dos posts da
 * casa. Preços em centavos.
 *
 * Os slugs são estáveis: aparecem no link "Pede igual" e, depois, nas URLs.
 * A grafia do catálogo foi corrigida ("Comho Nosso Chiken" → "Combo Nosso Chicken").
 */

export type Grupo = 'so-eu' | 'a-dois' | 'familia' | 'extras';

/** Filtros por tipo e por ingrediente (layouts 3 e 4). */
export type Etiqueta =
  | 'smash'
  | 'artesanal'
  | 'frango'
  | 'salada'
  | 'bacon'
  | 'cheddar'
  | 'catupiry'
  | 'cebola-caramelizada';

export type Destaque = 'campeao' | 'mais-pedido' | 'novo';

export interface Item {
  slug: string;
  nome: string;
  grupo: Grupo;
  preco: number;
  /** Quantas pessoas o combo serve. */
  pessoas: number;
  /** O lanche e o que vai nele, como na arte. */
  lanche?: { nome: string; composicao: string };
  /** O que vem junto, em ordem. */
  acompanha: string[];
  etiquetas: Etiqueta[];
  destaque?: Destaque;
  /** Próximo degrau da escada de upgrade (só quando o preço real faz sentido). */
  upgrade?: string;
  /** Nome do arquivo em src/assets/fotos (sem extensão). */
  foto: string;
  /** Texto alternativo da foto. */
  alt: string;
  /** Marca para revisar com a loja. */
  confirmar?: string;
}

export const grupos: { id: Grupo; nome: string; pergunta: string }[] = [
  { id: 'so-eu', nome: 'Só eu', pergunta: 'Pra um' },
  { id: 'a-dois', nome: 'A dois', pergunta: 'Pra dois' },
  { id: 'familia', nome: 'Família', pergunta: 'Pra galera' },
  { id: 'extras', nome: 'Extras', pergunta: 'Pra beliscar' },
];

export const nomesEtiquetas: Record<Etiqueta, string> = {
  smash: 'Smash',
  artesanal: 'Blend 150\u00a0g',
  frango: 'Frango',
  salada: 'Com salada',
  bacon: 'Bacon',
  cheddar: 'Cheddar',
  catupiry: 'Catupiry',
  'cebola-caramelizada': 'Cebola caramelizada',
};

export const nomesDestaques: Record<Destaque, string> = {
  campeao: 'Campeão de vendas',
  'mais-pedido': 'O mais pedido',
  novo: 'Novidade',
};

const LATA = 'Coca-Cola lata 350\u00a0ml';
const LITRO_E_MEIO = 'Coca-Cola 1,5\u00a0L';

// Lanches (composição como nas artes do catálogo).
const L = {
  smash: { nome: 'Nosso Smash', composicao: 'Pão brioche, smash de 100\u00a0g, cheddar derretido, cebola caramelizada e molho da casa.' },
  smashBacon: {
    nome: 'Nosso Smash Bacon',
    composicao: 'Pão brioche, smash de 100\u00a0g, cheddar derretido, bacon crocante, cebola caramelizada e molho da casa.',
  },
  duplo: {
    nome: 'Nosso Duplo Smash Bacon',
    composicao: 'Pão brioche, dois smashs, quatro fatias de cheddar, bacon crocante, cebola caramelizada e molho da casa.',
  },
  triplo: {
    nome: 'Triplo Smash Bacon',
    composicao: 'Pão brioche, três smashs, muito cheddar derretido, bacon crocante, cebola caramelizada e molho da casa.',
  },
  classico: {
    nome: 'Nosso Clássico',
    composicao: 'Pão brioche, blend de 150\u00a0g, cheddar derretido, bacon crocante, cebola caramelizada e molho da casa.',
  },
  catupiry: {
    nome: 'Clássico Catupiry',
    composicao: 'Pão brioche, blend de 150\u00a0g, catupiry original, bacon crocante, cebola caramelizada e molho da casa.',
  },
  leve: {
    nome: 'Nosso Leve',
    composicao: 'Pão brioche, blend de 150\u00a0g, cheddar derretido, alface, tomate, cebola roxa, bacon crocante e molho da casa.',
  },
  duploSalada: {
    nome: 'Nosso Duplo Smash Salada',
    composicao: 'Pão brioche, dois smashs, cheddar derretido, bacon crocante, alface, tomate, cebola roxa e molho da casa.',
  },
  fit: { nome: 'Nosso Fit', composicao: 'Pão brioche, blend de 150\u00a0g, muçarela derretida, alface, tomate e cebola roxa.' },
  crocante: {
    nome: 'Nosso Crocante',
    composicao: 'Pão brioche, blend artesanal, catupiry empanado crocante, cheddar derretido, cebola caramelizada e molho da casa.',
  },
  supremo: {
    nome: 'Nosso Supremo',
    composicao: 'Pão brioche, dois blends de 150\u00a0g, cheddar derretido, bacon crocante, cebola caramelizada e molho da casa.',
  },
  chicken: { nome: 'Nosso Chicken', composicao: 'Pão brioche, hambúrguer de frango empanado, queijo, alface, tomate e molho.' },
} as const;

export const cardapio: Item[] = [
  // ---------- Só eu: lanche + batata frita + refrigerante em lata ----------
  {
    slug: 'combo-nosso-smash',
    nome: 'Combo Nosso Smash',
    grupo: 'so-eu',
    preco: 2990,
    pessoas: 1,
    lanche: L.smash,
    acompanha: ['batata frita', LATA],
    etiquetas: ['smash', 'cheddar', 'cebola-caramelizada'],
    upgrade: 'combo-smash-bacon',
    foto: 'combo-nosso-smash',
    alt: 'Nosso Smash no pão brioche, com cheddar escorrendo, ao lado da batata frita e da lata de Coca-Cola',
  },
  {
    slug: 'combo-smash-bacon',
    nome: 'Combo Smash Bacon',
    grupo: 'so-eu',
    preco: 3490,
    pessoas: 1,
    lanche: L.smashBacon,
    acompanha: ['batata frita', LATA],
    etiquetas: ['smash', 'bacon', 'cheddar', 'cebola-caramelizada'],
    upgrade: 'combo-duplo-smash-bacon',
    foto: 'combo-smash-bacon',
    alt: 'Smash Bacon com cheddar derretido e bacon crocante saindo do pão brioche',
  },
  {
    slug: 'combo-duplo-smash-bacon',
    nome: 'Combo Duplo Smash Bacon',
    grupo: 'so-eu',
    preco: 3990,
    pessoas: 1,
    lanche: L.duplo,
    acompanha: ['batata frita', LATA],
    etiquetas: ['smash', 'bacon', 'cheddar', 'cebola-caramelizada'],
    destaque: 'campeao',
    upgrade: 'combo-triplo-smash-bacon',
    foto: 'combo-duplo-smash-bacon',
    alt: 'Duplo Smash Bacon: dois smashs, cheddar escorrendo e bacon crocante no pão brioche',
  },
  {
    slug: 'combo-triplo-smash-bacon',
    nome: 'Combo Triplo Smash Bacon',
    grupo: 'so-eu',
    preco: 4990,
    pessoas: 1,
    lanche: L.triplo,
    acompanha: ['batata frita', LATA],
    etiquetas: ['smash', 'bacon', 'cheddar', 'cebola-caramelizada'],
    destaque: 'mais-pedido',
    foto: 'combo-triplo-smash-bacon',
    alt: 'Triplo Smash Bacon, três carnes empilhadas com cheddar e bacon entre elas',
  },
  {
    slug: 'combo-nosso-classico',
    nome: 'Combo Nosso Clássico',
    grupo: 'so-eu',
    preco: 3990,
    pessoas: 1,
    lanche: L.classico,
    acompanha: ['batata frita', LATA],
    etiquetas: ['artesanal', 'bacon', 'cheddar', 'cebola-caramelizada'],
    upgrade: 'combo-nosso-supremo',
    foto: 'combo-nosso-classico',
    alt: 'Nosso Clássico de blend 150\u00a0g com cheddar, bacon e cebola caramelizada, com a lata ao lado',
  },
  {
    slug: 'combo-classico-catupiry',
    nome: 'Combo Clássico Catupiry',
    grupo: 'so-eu',
    preco: 3990,
    pessoas: 1,
    lanche: L.catupiry,
    acompanha: ['batata frita', LATA],
    etiquetas: ['artesanal', 'catupiry', 'bacon', 'cebola-caramelizada'],
    foto: 'combo-classico-catupiry',
    alt: 'Clássico Catupiry com catupiry derretendo sobre o blend, batata frita e lata de Coca-Cola',
  },
  {
    slug: 'combo-nosso-leve',
    nome: 'Combo Nosso Leve',
    grupo: 'so-eu',
    preco: 4190,
    pessoas: 1,
    lanche: L.leve,
    acompanha: ['batata frita', LATA],
    etiquetas: ['artesanal', 'salada', 'bacon', 'cheddar'],
    foto: 'combo-nosso-leve',
    alt: 'Nosso Leve com alface, tomate, cebola roxa e bacon, servido com batata e maionese da casa',
  },
  {
    slug: 'combo-duplo-smash-salada',
    nome: 'Combo Duplo Smash Salada',
    grupo: 'so-eu',
    preco: 4190,
    pessoas: 1,
    lanche: L.duploSalada,
    acompanha: ['batata frita', LATA],
    etiquetas: ['smash', 'salada', 'bacon', 'cheddar'],
    destaque: 'novo',
    foto: 'combo-duplo-smash-salada',
    alt: 'Duplo Smash Salada com alface, tomate e cebola roxa sobre dois smashs com cheddar',
  },
  {
    slug: 'combo-nosso-fit',
    nome: 'Combo Nosso Fit',
    grupo: 'so-eu',
    preco: 3990,
    pessoas: 1,
    lanche: L.fit,
    acompanha: ['batata frita', 'Coca-Cola Zero lata 350\u00a0ml'],
    etiquetas: ['artesanal', 'salada'],
    destaque: 'novo',
    foto: 'combo-nosso-fit',
    alt: 'Nosso Fit com muçarela, alface, tomate e cebola roxa, ao lado de uma Coca-Cola Zero',
  },
  {
    slug: 'combo-nosso-crocante',
    nome: 'Combo Nosso Crocante',
    grupo: 'so-eu',
    preco: 4590,
    pessoas: 1,
    lanche: L.crocante,
    acompanha: ['batata frita', LATA],
    etiquetas: ['catupiry', 'cheddar', 'cebola-caramelizada'],
    foto: 'combo-nosso-crocante',
    alt: 'Nosso Crocante com o disco de catupiry empanado dourado sobre o blend',
    confirmar: 'Peso do blend do Crocante (o post fala em smash; a Brendi, em blend de 150\u00a0g).',
  },
  {
    slug: 'combo-nosso-supremo',
    nome: 'Combo Nosso Supremo',
    grupo: 'so-eu',
    preco: 4990,
    pessoas: 1,
    lanche: L.supremo,
    acompanha: ['batata frita', LATA],
    etiquetas: ['artesanal', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'ig-supremo',
    alt: 'Nosso Supremo: dois blends de 150\u00a0g, cheddar, bacon e cebola caramelizada transbordando do pão',
  },
  {
    slug: 'combo-nosso-chicken',
    nome: 'Combo Nosso Chicken',
    grupo: 'so-eu',
    preco: 3190,
    pessoas: 1,
    lanche: L.chicken,
    acompanha: ['batata frita', LATA],
    etiquetas: ['frango', 'salada'],
    destaque: 'novo',
    foto: 'combo-nosso-chicken',
    alt: 'Nosso Chicken: frango empanado crocante com alface e tomate no pão brioche',
    confirmar: 'Composição do Chicken (só a foto mostra; o catálogo não descreve).',
  },

  // ---------- A dois ----------
  {
    slug: 'combo-nossa',
    nome: 'Combo Nossa',
    grupo: 'a-dois',
    preco: 4990,
    pessoas: 2,
    lanche: L.smash,
    acompanha: ['2 Nosso Smash', '2 batatas fritas', 'Guaraná Antarctica 1\u00a0L'],
    etiquetas: ['smash', 'cheddar', 'cebola-caramelizada'],
    foto: 'combo-nossa',
    alt: 'Dois Nosso Smash lado a lado com duas porções de batata frita',
  },
  {
    slug: 'casal-chicken',
    nome: 'Combo Chicken pra Dois',
    grupo: 'a-dois',
    preco: 5290,
    pessoas: 2,
    lanche: L.chicken,
    acompanha: ['2 Nosso Chicken', '2 batatas fritas', 'Guaraná Antarctica 1\u00a0L'],
    etiquetas: ['frango', 'salada'],
    foto: 'casal-chicken',
    alt: 'Dois Nosso Chicken numa tábua de madeira, com batatas fritas atrás',
    confirmar: 'Nome do combo (no catálogo: "Combo Nosso Chiken"; na arte: "Combo Nossa Chicken").',
  },
  {
    slug: 'casal-smash-bacon',
    nome: 'Combo Casal Smash Bacon',
    grupo: 'a-dois',
    preco: 6890,
    pessoas: 2,
    lanche: L.smashBacon,
    acompanha: ['2 Nosso Smash Bacon', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['smash', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'casal-smash-bacon',
    alt: 'Dois Smash Bacon com batatas e uma Coca-Cola de 1,5 litro ao fundo',
  },
  {
    slug: 'combo-do-dia',
    nome: 'Combo do Dia',
    grupo: 'a-dois',
    preco: 6890,
    pessoas: 2,
    lanche: L.classico,
    acompanha: ['2 Nosso Clássico', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'combo-do-dia',
    alt: 'Nosso Clássico de perto, com bacon e cebola caramelizada sobre o cheddar',
    confirmar: 'É um combo fixo ou muda todo dia?',
  },
  {
    slug: 'casal-duplo-smash-bacon',
    nome: 'Combo Casal Duplo Smash Bacon',
    grupo: 'a-dois',
    preco: 7890,
    pessoas: 2,
    lanche: L.duplo,
    acompanha: ['2 Duplo Smash Bacon', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['smash', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'casal-duplo-smash-bacon',
    alt: 'Dois Duplo Smash Bacon com batatas fritas nas caixinhas da casa',
  },
  {
    slug: 'casal-classico',
    nome: 'Combo Casal Clássico',
    grupo: 'a-dois',
    preco: 7890,
    pessoas: 2,
    lanche: L.classico,
    acompanha: ['2 Nosso Clássico', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'casal-classico',
    alt: 'Dois Nosso Clássico com bacon e cheddar, batatas fritas e Coca-Cola de 1,5 litro',
  },
  {
    slug: 'casal-classico-catupiry',
    nome: 'Combo Casal Clássico Catupiry',
    grupo: 'a-dois',
    preco: 7890,
    pessoas: 2,
    lanche: L.catupiry,
    acompanha: ['2 Clássico Catupiry', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'catupiry', 'bacon', 'cebola-caramelizada'],
    foto: 'casal-classico-catupiry',
    alt: 'Dois Clássico Catupiry com o catupiry escorrendo, batatas fritas atrás',
  },
  {
    slug: 'casal-fit',
    nome: 'Combo Casal Fit',
    grupo: 'a-dois',
    preco: 7890,
    pessoas: 2,
    lanche: L.fit,
    acompanha: ['2 Nosso Fit', '2 batatas fritas', 'Coca-Cola Zero 1,5\u00a0L'],
    etiquetas: ['artesanal', 'salada'],
    foto: 'casal-fit',
    alt: 'Dois Nosso Fit com salada fresca, batatas fritas e Coca-Cola Zero',
  },
  {
    slug: 'casal-leve',
    nome: 'Combo Casal Leve',
    grupo: 'a-dois',
    preco: 8190,
    pessoas: 2,
    lanche: L.leve,
    acompanha: ['2 Nosso Leve', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'salada', 'bacon', 'cheddar'],
    foto: 'casal-leve',
    alt: 'Dois Nosso Leve com alface, tomate e cebola roxa, batatas fritas atrás',
  },
  {
    slug: 'casal-crocante',
    nome: 'Combo Casal Crocante',
    grupo: 'a-dois',
    preco: 8990,
    pessoas: 2,
    lanche: L.crocante,
    acompanha: ['2 Nosso Crocante', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['catupiry', 'cheddar', 'cebola-caramelizada'],
    foto: 'casal-crocante',
    alt: 'Dois Nosso Crocante com catupiry empanado, batatas e Coca-Cola de 1,5 litro',
  },
  {
    slug: 'casal-triplo-smash-bacon',
    nome: 'Combo Casal Triplo Smash Bacon',
    grupo: 'a-dois',
    preco: 9890,
    pessoas: 2,
    lanche: L.triplo,
    acompanha: ['2 Triplo Smash Bacon', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['smash', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'casal-triplo-smash-bacon',
    alt: 'Dois Triplo Smash Bacon, altos, com bacon e cheddar entre as carnes',
  },
  {
    slug: 'casal-supremo',
    nome: 'Combo Casal Supremo',
    grupo: 'a-dois',
    preco: 9890,
    pessoas: 2,
    lanche: L.supremo,
    acompanha: ['2 Nosso Supremo', '2 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'bacon', 'cheddar', 'cebola-caramelizada'],
    foto: 'casal-supremo',
    alt: 'Dois Nosso Supremo com molho da casa escorrendo, batatas e Coca-Cola de 1,5 litro',
  },

  // ---------- Família ----------
  {
    slug: 'familia-1',
    nome: 'Combo Família 1',
    grupo: 'familia',
    preco: 9890,
    pessoas: 3,
    acompanha: ['2 Nosso Clássico', '1 Nosso Smash', '3 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'smash', 'bacon', 'cheddar'],
    foto: 'familia-1',
    alt: 'Três hambúrgueres, dois embrulhados no papel alumínio, com três batatas fritas',
  },
  {
    slug: 'familia-2',
    nome: 'Combo Família 2',
    grupo: 'familia',
    preco: 11790,
    pessoas: 4,
    acompanha: ['2 Nosso Clássico', '2 Nosso Smash', '4 batatas fritas', LITRO_E_MEIO],
    etiquetas: ['artesanal', 'smash', 'bacon', 'cheddar'],
    foto: 'familia-2',
    alt: 'Quatro hambúrgueres e quatro batatas fritas com uma Coca-Cola de 1,5 litro',
  },

  // ---------- Extras ----------
  {
    slug: 'batata-cheddar-bacon',
    nome: 'Batata com Cheddar e Bacon',
    grupo: 'extras',
    preco: 1890,
    pessoas: 1,
    acompanha: ['250\u00a0g de batata', 'molho de cheddar', 'farofa de bacon'],
    etiquetas: ['cheddar', 'bacon'],
    destaque: 'novo',
    foto: 'batata-cheddar-bacon',
    alt: 'Caixa de batata frita coberta de molho de cheddar e farofa de bacon',
  },
  {
    slug: 'porcao-nuggets',
    nome: 'Porção de Nuggets',
    grupo: 'extras',
    preco: 790,
    pessoas: 1,
    acompanha: ['6 unidades'],
    etiquetas: ['frango'],
    foto: 'porcao-nuggets',
    alt: 'Balde com nuggets dourados e um potinho de ketchup',
  },
  {
    slug: 'porcao-aneis-de-cebola',
    nome: 'Porção de Anéis de Cebola',
    grupo: 'extras',
    preco: 790,
    pessoas: 1,
    acompanha: ['6 unidades'],
    etiquetas: [],
    foto: 'porcao-aneis-de-cebola',
    alt: 'Anéis de cebola empanados e crocantes num prato escuro',
  },
];

export const porSlug = new Map(cardapio.map((item) => [item.slug, item]));

export function doGrupo(grupo: Grupo): Item[] {
  return cardapio.filter((item) => item.grupo === grupo);
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** O que vem no combo, em uma frase ("2 Nosso Clássico, 2 batatas fritas e Coca-Cola 1,5\u00a0L"). */
export function listaAcompanha(item: Item): string {
  const partes = item.acompanha;
  if (partes.length < 2) return capitalizar(partes[0] ?? '');
  return capitalizar(`${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`);
}

/** O que vai dentro, em uma linha: a composição do lanche e o acompanhamento, ou a lista do combo. */
export function resumo(item: Item): string {
  if (item.grupo === 'so-eu' && item.lanche) return `${item.lanche.composicao} Acompanha ${item.acompanha.join(' e ')}.`;
  return `${listaAcompanha(item)}.`;
}

/**
 * Nome para o cartão, sem o "Combo" repetido ("Combo Duplo Smash Bacon" → "Duplo Smash Bacon").
 * Fica inteiro quando sobraria uma palavra só ou começaria em minúscula ("Combo Nossa", "Combo do Dia").
 */
export function nomeCurto(item: Item): string {
  const resto = item.nome.replace(/^Combo /, '');
  return resto !== item.nome && resto.includes(' ') && /^\p{Lu}/u.test(resto) ? resto : item.nome;
}
