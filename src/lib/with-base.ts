/**
 * Internal link that respects the site's base path (Astro `base`): "/" locally and on
 * Cloudflare, "/Hamburguer/" on GitHub Pages. Use it for every hand-written href/src that
 * starts with "/". (Images, fonts and scripts processed by Astro get the base automatically.)
 */
const root = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export function withBase(target = ''): string {
  return root + target.replace(/^\//, '');
}
