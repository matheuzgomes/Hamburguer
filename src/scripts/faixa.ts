/**
 * Faixa rolante (layout 2) com botão de pausa (WCAG 2.2.2: movimento de mais de 5 s
 * precisa poder parar). Com movimento reduzido, a faixa já começa parada.
 *   [data-faixa] recebe data-pausada; [data-faixa-pausar] é o botão (aria-pressed).
 */
for (const faixa of document.querySelectorAll<HTMLElement>('[data-faixa]')) {
  const botao = faixa.querySelector<HTMLButtonElement>('[data-faixa-pausar]');
  if (!botao) continue;
  const definir = (pausada: boolean) => {
    faixa.toggleAttribute('data-pausada', pausada);
    botao.setAttribute('aria-pressed', String(pausada));
  };
  definir(matchMedia('(prefers-reduced-motion: reduce)').matches);
  botao.addEventListener('click', () => definir(!faixa.hasAttribute('data-pausada')));
}
