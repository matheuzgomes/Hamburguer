/** "R$ 39,90". O espaço é inseparável por padrão (o preço nunca quebra em duas linhas). */
export function preco(centavos: number, espaco = ' '): string {
  const reais = Math.floor(Math.abs(centavos) / 100);
  const resto = String(Math.abs(centavos) % 100).padStart(2, '0');
  const milhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${centavos < 0 ? '-' : ''}R$${espaco}${milhar},${resto}`;
}

/** Só o número ("39,90"), para layouts que desenham o "R$" à parte. */
export function valor(centavos: number): string {
  return preco(centavos, ' ').replace(/^-?R\$ /, '');
}
