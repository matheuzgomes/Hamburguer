/**
 * "Qual é o seu?" (layout 4): a pessoa marca até 3 ingredientes e aparece o lanche que mais bate.
 * Marcar o quarto desmarca o mais antigo (nada fica travado).
 *   [data-quiz-opcao]       checkbox; value = etiqueta do cardápio
 *   [data-quiz-resultado]   um cartão por lanche, com data-etiquetas, data-ordem (desempate) e data-nome
 *   [data-quiz-vazio]       o que aparece antes de escolher
 *   [data-quiz-status]      frase que o leitor de tela anuncia
 */
import { track } from '../lib/track';

const MAXIMO = 3;
const opcoes = Array.from(document.querySelectorAll<HTMLInputElement>('[data-quiz-opcao]'));
const cartoes = Array.from(document.querySelectorAll<HTMLElement>('[data-quiz-resultado]'));
const vazio = document.querySelector<HTMLElement>('[data-quiz-vazio]');
const status = document.querySelector<HTMLElement>('[data-quiz-status]');
const nomes = new Map(opcoes.map((o) => [o.value, o.dataset.nome ?? o.value]));
let ordem: string[] = opcoes.filter((o) => o.checked).map((o) => o.value);

function lista(itens: string[]): string {
  return itens.length < 2 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

function mostrar(): void {
  let melhor: HTMLElement | undefined;
  let pontos = 0;
  for (const cartao of cartoes) {
    const etiquetas = (cartao.dataset.etiquetas ?? '').split(' ');
    const p = ordem.filter((e) => etiquetas.includes(e)).length;
    const desempata = melhor && p === pontos && Number(cartao.dataset.ordem) < Number(melhor.dataset.ordem);
    if (p > pontos || desempata) {
      melhor = cartao;
      pontos = p;
    }
  }
  for (const cartao of cartoes) cartao.hidden = cartao !== melhor || pontos === 0;
  if (vazio) vazio.hidden = pontos > 0;

  if (!status) return;
  if (!ordem.length) {
    status.textContent = '';
    return;
  }
  if (!melhor || !pontos) {
    status.textContent = 'Nenhum lanche junta isso. Troca um ingrediente.';
    return;
  }
  const etiquetas = (melhor.dataset.etiquetas ?? '').split(' ');
  const batem = ordem.filter((e) => etiquetas.includes(e)).map((e) => nomes.get(e)!.toLowerCase());
  const faltam = ordem.filter((e) => !etiquetas.includes(e)).map((e) => nomes.get(e)!.toLowerCase());
  status.textContent = `Deu ${melhor.dataset.nome}: tem ${lista(batem)}.${faltam.length ? ` Sem ${lista(faltam)}, mas é o mais perto.` : ''}`;
}

for (const opcao of opcoes) {
  opcao.addEventListener('change', () => {
    ordem = ordem.filter((e) => e !== opcao.value);
    if (opcao.checked) ordem.push(opcao.value);
    while (ordem.length > MAXIMO) {
      const saiu = ordem.shift();
      const caixa = opcoes.find((o) => o.value === saiu);
      if (caixa) caixa.checked = false;
    }
    mostrar();
    if (ordem.length === MAXIMO) {
      const resultado = cartoes.find((c) => !c.hidden);
      track('quiz', { etiquetas: ordem.join(','), item_id: resultado?.dataset.item });
    }
  });
}

// O navegador pode restaurar as caixas marcadas ao voltar para a página.
if (ordem.length) mostrar();
