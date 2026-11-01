/**
 * Faixas horizontais (layout 1): setas para quem usa mouse e aba ativa conforme a rolagem.
 *   [data-trilha] contém a lista rolável; [data-trilha-mover="-1|1"] rola uma "página".
 *   [data-aba="id-da-seção"] recebe aria-current quando a seção está na tela.
 */
for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-trilha-mover]')) {
  const lista = botao.closest('[data-trilha]')?.querySelector<HTMLElement>('[data-trilha-lista]');
  if (!lista) continue;
  const atualizar = () => {
    const inicio = lista.scrollLeft <= 4;
    const fim = lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 4;
    botao.disabled = botao.dataset.trilhaMover === '-1' ? inicio : fim;
  };
  botao.addEventListener('click', () => {
    const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    lista.scrollBy({ left: Number(botao.dataset.trilhaMover) * lista.clientWidth * 0.85, behavior: reduzido ? 'auto' : 'smooth' });
  });
  lista.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

const abas = new Map(
  Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-aba]')).map((a) => [a.dataset.aba!, a]),
);
if (abas.size) {
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        for (const [id, aba] of abas) {
          if (id === entrada.target.id) aba.setAttribute('aria-current', 'location');
          else aba.removeAttribute('aria-current');
        }
        // Mantém a aba ativa visível na barra (sem mexer na rolagem da página).
        const ativa = abas.get(entrada.target.id);
        ativa?.parentElement?.scrollTo({ left: ativa.offsetLeft - 16 });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of abas.keys()) {
    const secao = document.getElementById(id);
    if (secao) observador.observe(secao);
  }
}
