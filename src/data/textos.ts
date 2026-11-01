/**
 * Textos de fatos (entrega, perguntas frequentes, provas), iguais nos 4 layouts.
 * O que depende de [CONFIRMAR] em loja.ts herda a pendência.
 */
import { preco } from '../lib/dinheiro';
import { loja } from './loja';

const bairros = loja.bairros;
const listaBairros = `${bairros.slice(0, -1).join(', ')} e ${bairros.at(-1)}`;

export const entrega = {
  listaBairros,
  resumo: `Entregamos em ${listaBairros}.`,
  taxa: loja.entrega.gratisNosBairros ? 'Entrega grátis nesses bairros.' : 'Taxa de entrega informada no WhatsApp.',
  tempo: `De ${loja.entrega.tempo} depois que você confirma.`,
  minimo: `Pedido mínimo de ${preco(loja.entrega.pedidoMinimo)}.`,
  outroBairro: 'Mora perto e não está na lista? Chama no WhatsApp que a gente confirma se chega aí.',
};

export const perguntas: { pergunta: string; resposta: string }[] = [
  { pergunta: 'Entregam no meu bairro?', resposta: `${entrega.resumo} ${entrega.outroBairro}` },
  {
    pergunta: 'Quanto custa a entrega?',
    resposta: loja.entrega.gratisNosBairros
      ? `Nada: a entrega é grátis em ${listaBairros}.`
      : 'A taxa depende do bairro e é informada no WhatsApp antes de você confirmar.',
  },
  { pergunta: 'Quanto tempo demora?', resposta: `Em média ${loja.entrega.tempo} depois que você confirma o pedido no WhatsApp.` },
  {
    pergunta: 'Como eu pago?',
    resposta: `${loja.pagamentos.join(', ').replace(/, ([^,]*)$/, ' ou $1')}. Precisa de troco? Escreve na observação do pedido.`,
  },
  {
    pergunta: 'Qual é o horário?',
    resposta: `${loja.horario.texto}. Fora do horário você já pode deixar o pedido pronto no WhatsApp e a gente responde quando abrir.`,
  },
  { pergunta: 'Tem pedido mínimo?', resposta: `Tem: ${preco(loja.entrega.pedidoMinimo)}.` },
];

export const provas = {
  blend: 'Nosso blend é 100% artesanal: a carne é selecionada, moída aqui e preparada sempre fresca.',
  sal: 'E cada hambúrguer leva o sal temperado da casa, um segredinho nosso.',
  seguidores: `${loja.seguidores} pessoas acompanham a chapa no Instagram.`,
};

/** Linha que tira a dúvida embaixo do botão de enviar. */
export const gatilhoEnvio = 'Abre o WhatsApp com o pedido escrito. Você confere e envia por lá.';
