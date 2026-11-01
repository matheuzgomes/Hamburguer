/**
 * Link interno que respeita a subpasta do site (base do Astro): "/" local e no Cloudflare,
 * "/Hamburguer/" no GitHub Pages. Use em todo href/src escrito à mão que comece com "/".
 * (Imagens, fontes e scripts processados pelo Astro já recebem a base sozinhos.)
 */
const raiz = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export function caminho(destino = ''): string {
  return raiz + destino.replace(/^\//, '');
}
