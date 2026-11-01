/**
 * Camada única de mensuração. Nesta fase (layouts de teste) os eventos vão só para
 * window.dataLayer, sem rede; o GA4 com consentimento entra na Etapa 3.
 */
export type Parametros = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(nome: string, parametros: Parametros = {}): void {
  const limpos: Parametros = {};
  for (const [chave, valor] of Object.entries(parametros)) if (valor !== undefined && valor !== '') limpos[chave] = valor;
  (window.dataLayer ||= []).push({ event: nome, ...limpos });
}
