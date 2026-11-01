/**
 * Dados da loja. Tudo o que está marcado [CONFIRMAR] veio de posts antigos ou da
 * Brendi (desativada) e precisa da palavra da loja antes de publicar
 * (`npm run check:dist -- --strict` falha enquanto houver marcador).
 */

export const loja = {
  nome: 'Nossa Hamburgueria Artesanal',
  nomeCurto: 'Nossa Hamburgueria',
  slogan: 'Da nossa chapa direto pra sua casa',

  whatsapp: '5521966050013',
  whatsappExibicao: '(21) 96605-0013',
  instagram: 'hamburgueria.nossa',
  instagramUrl: 'https://www.instagram.com/hamburgueria.nossa/',
  seguidores: '10,2 mil',

  cidade: 'Rio de Janeiro',
  uf: 'RJ',
  bairroBase: 'Cascadura',

  /**
   * [CONFIRMAR] A bio diz 19h às 00h, todos os dias; posts e artes dizem 19h à 1h,
   * e uma arte diz 18h às 00h. Os testes usam a bio.
   * Horários em minutos desde 00:00; `fecha` maior que 24h = madrugada do dia seguinte.
   */
  horario: {
    abre: 19 * 60,
    fecha: 24 * 60,
    fuso: 'America/Sao_Paulo',
    texto: 'Toda noite, 19h às 00h',
  },

  /** [CONFIRMAR] Bairros citados nos posts de promoção com entrega grátis. */
  bairros: ['Cascadura', 'Madureira', 'Campinho', 'Piedade', 'Abolição', 'Tomás Coelho', 'Quintino'],

  entrega: {
    /** [CONFIRMAR] Grátis só nas promoções ou sempre? */
    gratisNosBairros: true,
    /** [CONFIRMAR] Veio da Brendi (desativada). */
    tempo: '40 a 50 min',
    /** [CONFIRMAR] Veio da Brendi (desativada). Em centavos. */
    pedidoMinimo: 3000,
  },

  /** [CONFIRMAR] Nenhum post diz as formas de pagamento. */
  pagamentos: ['Pix', 'Cartão', 'Dinheiro'],
} as const;

export type Bairro = (typeof loja.bairros)[number];
