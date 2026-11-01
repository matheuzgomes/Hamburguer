/** Fotos tratadas (src/assets/fotos, geradas por `npm run fotos`), por nome de arquivo. */
import type { ImageMetadata } from 'astro';

const arquivos = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.webp', { eager: true });

export const fotos: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(arquivos).map(([caminho, modulo]) => [caminho.split('/').pop()!.replace('.webp', ''), modulo.default]),
);

export function foto(nome: string): ImageMetadata {
  const imagem = fotos[nome];
  if (!imagem) throw new Error(`Foto não encontrada: ${nome} (rode npm run fotos)`);
  return imagem;
}
