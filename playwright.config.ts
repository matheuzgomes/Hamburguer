import { defineConfig, devices } from '@playwright/test';

// Os testes rodam contra o build (dist/) servido com os cabeçalhos reais de
// public/_headers (servidor em tests/e2e/servidor.ts). Rode `npm run build`
// antes de `npm run test:e2e`.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4183',
    locale: 'pt-BR',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
  ],
  globalSetup: './tests/e2e/servidor.ts',
});
