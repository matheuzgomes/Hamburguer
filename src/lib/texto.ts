/** Texto para busca: sem acento, minúsculo e sem espaço nas pontas ("Clássico" → "classico"). */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
