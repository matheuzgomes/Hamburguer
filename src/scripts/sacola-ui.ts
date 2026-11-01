/**
 * Controlador da sacola, comum aos 4 layouts. Não desenha nada: liga o estado a
 * atributos data-* que cada layout coloca onde quiser.
 *
 * Ações (cliques, por delegação):
 *   [data-adicionar="slug"]       +1 do item
 *   [data-mais="slug"] / [data-menos="slug"] / [data-remover="slug"]
 *   [data-upgrade-aceitar]        troca o item sugerido pelo degrau de cima
 *   [data-esvaziar]               limpa a sacola
 *   [data-abrir="id-do-dialog"]   abre um <dialog> (showModal); [data-fechar] fecha
 *   [data-compartilhar]           compartilha a página; ="pedido" o link "Pede igual"; ="item:slug" um lanche;
 *                                 ="quiz:slug" o resultado do "Qual é o seu?"
 *   [data-enviar] (link)          abre o WhatsApp com a mensagem pronta
 * Campos: [data-campo="bairro|pagamento|observacao"] (radio, select ou textarea)
 *
 * Saídas (texto/visibilidade, atualizados a cada mudança):
 *   <html data-sacola="vazia|cheia" data-loja="aberta|fechada">
 *   [data-sacola-contagem] [data-sacola-total] [data-qtd="slug"]
 *   [data-item="slug"] recebe data-na-sacola quando tem quantidade
 *   [data-sacola-lista] com um <template data-modelo-linha> dentro; no modelo,
 *     [data-linha="nome|qtd|subtotal"] e botões com data-mais/menos/remover vazios;
 *     se a linha com foco sai, o foco vai para [data-foco-sacola] do mesmo <dialog>
 *   [data-falta-minimo] (oculto se não falta) com [data-falta-valor] dentro
 *   [data-upgrade] (oculto se não há sugestão) com [data-upgrade-texto] dentro
 *   [data-status-loja] e [data-rotulo-enviar]
 *   [data-resposta-bairro] responde se entregamos no bairro escolhido
 *   [data-aviso] (role="status") mostra os avisos por 2,6 s com data-visivel
 * Eventos em document: "sacola:mudou" { sacola, total, contagem, novo? }, "sacola:aviso" { texto }.
 */
import { preco } from '../lib/dinheiro';
import { estadoDaLoja, hora, type Horario } from '../lib/horario';
import { decodificar, PARAMETRO, urlPedidoIgual } from '../lib/pedido-igual';
import {
  aceitarUpgrade,
  adicionar,
  contagem,
  definir,
  faltaParaMinimo,
  linhas,
  montarMensagem,
  remover,
  sugestaoUpgrade,
  total,
  type DadosPedido,
  type ItemSacola,
  type Linhas,
} from '../lib/sacola';
import { track } from '../lib/track';
import { textoOrigem, urlWhatsApp, utmDaSessao } from '../lib/whatsapp';

interface Dados {
  itens: ItemSacola[];
  whatsapp: string;
  pedidoMinimo: number;
  horario: Horario;
  bairros: string[];
  /** "{bairro}" é trocado pelo nome. */
  respostaSim: string;
  respostaNao: string;
}

const dados: Dados = JSON.parse(document.getElementById('dados-cardapio')!.textContent!);
const catalogo = new Map(dados.itens.map((i) => [i.slug, i]));
const slugs = new Set(catalogo.keys());
const raiz = document.documentElement;
const CHAVE_SACOLA = 'nh-sacola';
const CHAVE_DADOS = 'nh-dados';

const $$ = <T extends Element = HTMLElement>(seletor: string, base: ParentNode = document) =>
  Array.from(base.querySelectorAll<T & Element>(seletor)) as unknown as T[];

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento (aba anônima bloqueada): a sacola vale só nesta página.
  }
}

/** O que veio do aparelho também é validado: só slug do cardápio e quantidade válida. */
function sacolaSalva(): Linhas {
  const bruta = ler<Record<string, unknown>>(CHAVE_SACOLA, {});
  let sacola: Linhas = {};
  for (const [slug, qtd] of Object.entries(bruta)) if (slugs.has(slug) && typeof qtd === 'number') sacola = definir(sacola, slug, qtd);
  return sacola;
}

let sacola = sacolaSalva();
let pedido: DadosPedido = ler<DadosPedido>(CHAVE_DADOS, {});
const origem = textoOrigem(utmDaSessao());

// "Pede igual": o link do amigo substitui a sacola (e some da barra de endereço).
const params = new URLSearchParams(location.search);
if (params.has(PARAMETRO)) {
  const doLink = decodificar(params.get(PARAMETRO), slugs);
  params.delete(PARAMETRO);
  history.replaceState(null, '', location.pathname + (params.size ? `?${params}` : '') + location.hash);
  if (Object.keys(doLink).length) {
    sacola = doLink;
    track('pedido_igual_aberto', { itens: Object.keys(doLink).length });
    queueMicrotask(() => avisar('Montamos a sacola igual à do link. É só conferir e enviar.'));
  }
}

let temporizadorAviso = 0;
function avisar(texto: string): void {
  document.dispatchEvent(new CustomEvent('sacola:aviso', { detail: { texto } }));
  for (const el of $$('[data-aviso]')) {
    el.textContent = texto;
    el.dataset.visivel = '';
  }
  clearTimeout(temporizadorAviso);
  temporizadorAviso = window.setTimeout(() => {
    for (const el of $$('[data-aviso]')) delete el.dataset.visivel;
  }, 2600);
}

function definirTexto(seletor: string, texto: string): void {
  for (const el of $$(seletor)) el.textContent = texto;
}

/**
 * Linhas existentes são atualizadas no lugar (o foco do teclado fica no botão "+"),
 * as novas entram no fim com data-nova e as que saíram são removidas.
 */
function renderizarLista(): void {
  const itens = linhas(sacola, catalogo);
  for (const lista of $$('[data-sacola-lista]')) {
    const modelo = lista.querySelector<HTMLTemplateElement>('template[data-modelo-linha]');
    if (!modelo) continue;
    const existentes = new Map($$<HTMLElement>('[data-linha-slug]', lista).map((el) => [el.dataset.linhaSlug!, el]));
    const ficam = new Set(itens.map(({ item }) => item.slug));
    for (const [slug, el] of existentes) {
      if (ficam.has(slug)) continue;
      const tinhaFoco = el.contains(document.activeElement);
      el.remove();
      if (tinhaFoco) lista.closest('dialog')?.querySelector<HTMLElement>('[data-foco-sacola]')?.focus();
    }
    for (const { item, qtd, subtotal } of itens) {
      let linha = existentes.get(item.slug);
      if (linha) delete linha.dataset.nova;
      else {
        linha = (modelo.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
        linha.dataset.linhaSlug = item.slug;
        linha.dataset.nova = '';
        for (const botao of $$<HTMLButtonElement>('[data-mais], [data-menos], [data-remover]', linha)) {
          for (const acao of ['mais', 'menos', 'remover'] as const) if (acao in botao.dataset) botao.dataset[acao] = item.slug;
          botao.setAttribute('aria-label', `${botao.getAttribute('aria-label') ?? ''} ${item.nome}`.trim());
        }
        lista.append(linha);
      }
      for (const campo of $$('[data-linha]', linha)) {
        const nome = campo.dataset.linha;
        campo.textContent = nome === 'nome' ? item.nome : nome === 'qtd' ? String(qtd) : preco(subtotal);
      }
    }
  }
}

/**
 * Quando o botão clicado some (o "Adicionar" vira seletor de quantidade e vice-versa),
 * o foco vai para o controle equivalente do mesmo item, em vez de cair no <body>.
 */
function manterFoco(alvo: HTMLElement, slug: string): void {
  if (!alvo.isConnected || alvo.checkVisibility()) return;
  const item = alvo.closest('[data-item]');
  if (!item) return;
  const opcoes = $$<HTMLElement>(`[data-mais="${slug}"], [data-adicionar="${slug}"]`, item);
  opcoes.find((el) => el.checkVisibility())?.focus();
}

function renderizar(novo?: string): void {
  const soma = total(sacola, catalogo);
  const qtdTotal = contagem(sacola, catalogo);
  raiz.dataset.sacola = qtdTotal ? 'cheia' : 'vazia';

  definirTexto('[data-sacola-contagem]', String(qtdTotal));
  definirTexto('[data-sacola-total]', preco(soma));
  for (const el of $$('[data-qtd]')) el.textContent = String(sacola[el.dataset.qtd!] ?? 0);
  for (const el of $$('[data-item]')) el.toggleAttribute('data-na-sacola', Boolean(sacola[el.dataset.item!]));

  renderizarLista();

  const falta = faltaParaMinimo(soma, dados.pedidoMinimo);
  for (const el of $$('[data-falta-minimo]')) el.hidden = falta === 0;
  definirTexto('[data-falta-valor]', preco(falta));

  const sugestao = sugestaoUpgrade(sacola, catalogo);
  for (const el of $$('[data-upgrade]')) {
    el.hidden = !sugestao;
    if (!sugestao) continue;
    for (const texto of $$('[data-upgrade-texto]', el)) {
      texto.textContent = `Por +${preco(sugestao.diferenca)} o ${sugestao.de.nome.replace(/^Combo /, '')} vira ${sugestao.para.nome.replace(/^Combo /, '')}.`;
    }
    for (const botao of $$('[data-upgrade-aceitar]', el)) {
      botao.dataset.de = sugestao.de.slug;
      botao.dataset.para = sugestao.para.slug;
    }
  }

  atualizarEnvio();
  sincronizarCampos();

  document.dispatchEvent(new CustomEvent('sacola:mudou', { detail: { sacola, total: soma, contagem: qtdTotal, novo } }));
}

/** O mesmo campo pode aparecer duas vezes (bairro na seção de entrega e na sacola). */
function sincronizarCampos(): void {
  for (const campo of $$<HTMLInputElement>('[data-campo]')) {
    const valor = pedido[campo.dataset.campo as keyof DadosPedido] ?? '';
    if (campo.type === 'radio') campo.checked = campo.value === valor;
    else if (campo.value !== valor) campo.value = valor;
  }
  const bairro = pedido.bairro;
  for (const el of $$('[data-resposta-bairro]')) {
    el.hidden = !bairro;
    if (bairro) el.textContent = dados.bairros.includes(bairro) ? dados.respostaSim.replace('{bairro}', bairro) : dados.respostaNao;
  }
}

function atualizarEnvio(): void {
  const vazia = !contagem(sacola, catalogo);
  const mensagem = vazia ? 'Oi, Nossa! Quero fazer um pedido.' : montarMensagem(sacola, catalogo, { ...pedido, origem });
  const url = urlWhatsApp(dados.whatsapp, mensagem);
  for (const link of $$<HTMLAnchorElement>('a[data-enviar]')) link.href = url;
}

function atualizarLoja(): void {
  const estado = estadoDaLoja(new Date(), dados.horario);
  raiz.dataset.loja = estado.aberto ? 'aberta' : 'fechada';
  definirTexto('[data-status-loja]', estado.texto);
  definirTexto(
    '[data-rotulo-enviar]',
    estado.aberto ? 'Enviar pedido no WhatsApp' : `Deixar pedido pronto, abrimos às ${hora(dados.horario.abre)}`,
  );
}

function mudar(nova: Linhas, novo?: string): void {
  sacola = nova;
  gravar(CHAVE_SACOLA, sacola);
  renderizar(novo);
}

async function compartilhar(tipo: string | undefined): Promise<void> {
  const pedidoIgual = tipo === 'pedido' && contagem(sacola, catalogo) > 0;
  const [prefixo, slug] = tipo?.split(':') ?? [];
  const item = slug ? catalogo.get(slug) : undefined;
  const quiz = prefixo === 'quiz' && item;
  const base = location.origin + location.pathname;
  const url = pedidoIgual ? urlPedidoIgual(base, sacola) : quiz ? `${base}#qual-e-o-seu` : item ? `${base}#${item.slug}` : base;
  const nome = item?.nome.replace(/^Combo /, '');
  const texto = pedidoIgual
    ? 'Montei meu pedido na Nossa Hamburgueria. Pede igual:'
    : quiz
      ? `Deu ${nome} pra mim no "Qual é o seu?" da Nossa Hamburgueria. Qual é o seu?`
      : item
        ? `Olha esse ${nome} da Nossa Hamburgueria (${preco(item.preco, ' ')}):`
        : 'Olha essa hamburgueria de Cascadura, entrega toda noite:';
  track('share', {
    method: 'share' in navigator ? 'nativo' : 'whatsapp',
    content_type: pedidoIgual ? 'pedido' : quiz ? 'quiz' : item ? 'item' : 'site',
    item_id: item?.slug,
  });
  if ('share' in navigator) {
    try {
      await navigator.share({ title: 'Nossa Hamburgueria Artesanal', text: texto, url });
      return;
    } catch (erro) {
      if ((erro as DOMException).name === 'AbortError') return;
    }
  }
  // Sem a folha de compartilhar do sistema (computador): manda pelo WhatsApp, escolhendo o contato lá.
  window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, '_blank', 'noopener');
}

document.addEventListener('click', (evento) => {
  const alvo = (evento.target as Element).closest<HTMLElement>(
    '[data-adicionar], [data-mais], [data-menos], [data-remover], [data-upgrade-aceitar], [data-esvaziar], [data-abrir], [data-fechar], [data-compartilhar], a[data-enviar]',
  );
  if (!alvo) {
    // Clique no fundo de um <dialog> aberto fecha (light dismiss).
    const alvoDialog = evento.target as HTMLElement;
    if (alvoDialog instanceof HTMLDialogElement && alvoDialog.open) alvoDialog.close();
    return;
  }
  const d = alvo.dataset;
  if (d.adicionar) {
    const item = catalogo.get(d.adicionar);
    mudar(adicionar(sacola, d.adicionar), d.adicionar);
    track('add_to_cart', { item_id: d.adicionar, value: (item?.preco ?? 0) / 100, currency: 'BRL' });
    if (item) avisar(`${item.nome} na sacola.`);
    manterFoco(alvo, d.adicionar);
  } else if (d.mais) mudar(adicionar(sacola, d.mais), d.mais);
  else if (d.menos) {
    mudar(adicionar(sacola, d.menos, -1));
    manterFoco(alvo, d.menos);
  } else if (d.remover) {
    track('remove_from_cart', { item_id: d.remover });
    mudar(remover(sacola, d.remover));
  } else if ('upgradeAceitar' in d && d.de && d.para) {
    track('upgrade_aceito', { de: d.de, para: d.para });
    mudar(aceitarUpgrade(sacola, d.de, d.para), d.para);
  } else if ('esvaziar' in d) mudar({});
  else if (d.abrir) {
    const dialogo = document.getElementById(d.abrir);
    if (dialogo instanceof HTMLDialogElement && !dialogo.open) {
      dialogo.showModal();
      if (dialogo.dataset.sacolaDialogo !== undefined) track('view_cart', { value: total(sacola, catalogo) / 100, currency: 'BRL' });
    }
  } else if ('fechar' in d) alvo.closest('dialog')?.close();
  else if ('compartilhar' in d) void compartilhar(d.compartilhar);
  else if ('enviar' in d) {
    atualizarEnvio();
    track('pedido_whatsapp', { value: total(sacola, catalogo) / 100, currency: 'BRL', itens: contagem(sacola, catalogo) });
  }
});

document.addEventListener('change', (evento) => {
  const campo = (evento.target as HTMLElement).closest<HTMLInputElement>('[data-campo]');
  if (!campo) return;
  pedido = { ...pedido, [campo.dataset.campo!]: campo.value };
  gravar(CHAVE_DADOS, pedido);
  if (campo.dataset.campo === 'bairro') track('bairro_consultado', { bairro: campo.value });
  atualizarEnvio();
  sincronizarCampos();
});

// A sacola muda em outra aba (mesmo layout aberto duas vezes): acompanha.
addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_SACOLA) {
    sacola = sacolaSalva();
    renderizar();
  }
});

atualizarLoja();
setInterval(atualizarLoja, 60_000);
renderizar();
