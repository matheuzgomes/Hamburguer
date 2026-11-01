/** Fotos em meio-tom de 2 tintas (layout 2), geradas por `npm run meio-tom`, por nome. */
import type { ImageMetadata } from 'astro';

const arquivos = import.meta.glob<{ default: ImageMetadata }>('../assets/meio-tom/*.png', { eager: true });

const porNome: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(arquivos).map(([caminho, modulo]) => [caminho.split('/').pop()!.replace('.png', ''), modulo.default]),
);

/** `tamanho: 'p'` é a versão de 300 px, para as linhas da tabela de preços. */
export function meioTom(nome: string, tamanho: 'g' | 'p' = 'g'): ImageMetadata {
  const imagem = porNome[tamanho === 'p' ? `${nome}-p` : nome];
  if (!imagem) throw new Error(`Meio-tom não encontrado: ${nome} (rode npm run meio-tom)`);
  return imagem;
}
