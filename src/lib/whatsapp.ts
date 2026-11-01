/**
 * Links do WhatsApp e origem da visita (UTM), adaptado de ~/projects/arremate.
 * `lerUtm` e `textoOrigem` são puras; `utmDaSessao` lê a URL e a sessão.
 */

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
}

const CHAVES = ['source', 'medium', 'campaign'] as const;
const CHAVE_SESSAO = 'nh-utm';

function limpar(valor: string | null): string | undefined {
  const limpo = (valor ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
  return limpo || undefined;
}

export function lerUtm(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const chave of CHAVES) {
    const valor = limpar(params.get('utm_' + chave));
    if (valor) utm[chave] = valor;
  }
  return utm;
}

/** "(origem: instagram · bio)" ou "" sem UTM. */
export function textoOrigem(utm: Utm): string {
  const partes = CHAVES.map((c) => utm[c]).filter(Boolean);
  return partes.length ? `(origem: ${partes.join(' · ')})` : '';
}

export function urlWhatsApp(numero: string, mensagem = ''): string {
  return `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
}

/** UTM da URL atual; sem UTM, a guardada na sessão (até fechar a aba). */
export function utmDaSessao(): Utm {
  const atual = lerUtm(location.search);
  try {
    if (Object.keys(atual).length) {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(atual));
      return atual;
    }
    const salvo = sessionStorage.getItem(CHAVE_SESSAO);
    return salvo ? (JSON.parse(salvo) as Utm) : {};
  } catch {
    return atual;
  }
}
