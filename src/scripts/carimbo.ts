/**
 * Carimbo "PEDIDO PRONTO" (layout 3): quando a pessoa envia, o cupom da sacola é
 * carimbado. Some quando a sacola muda ou fecha, para não enganar no próximo pedido.
 */
const dialogo = document.getElementById('sacola');
if (dialogo instanceof HTMLDialogElement) {
  dialogo.addEventListener('click', (evento) => {
    if ((evento.target as Element).closest('a[data-enviar]')) dialogo.dataset.carimbado = '';
  });
  const tirar = () => delete dialogo.dataset.carimbado;
  dialogo.addEventListener('close', tirar);
  document.addEventListener('sacola:mudou', tirar);
}
