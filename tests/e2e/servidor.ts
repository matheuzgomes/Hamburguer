/**
 * Sobe o servidor de dist/ dentro do próprio Playwright (globalSetup), já
 * ouvindo antes do primeiro teste. Substitui o `webServer`, que antes de subir
 * conferia a porta e travava ~2 min no WSL (veja scripts/serve-dist.mjs).
 */
import { iniciarServidor } from '../../scripts/serve-dist.mjs';

export default async function () {
  const servidor = await iniciarServidor(4183);
  return async () => {
    servidor?.closeAllConnections();
    await new Promise((resolve) => (servidor ? servidor.close(resolve) : resolve(undefined)));
  };
}
