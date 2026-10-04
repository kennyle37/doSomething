import { defineConfig } from 'vite';

export default defineConfig({
  base: '/doSomething/',
  server: { port: 3000 },
  build: { assetsInlineLimit: 0 }
});
