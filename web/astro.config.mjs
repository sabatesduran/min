import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const appSource = fileURLToPath(new URL('../src', import.meta.url));
const workspace = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  site: 'https://min.didac.dev',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [react()],
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    resolve: {
      alias: {
        '@': appSource,
        '@app': appSource,
      },
    },
    server: {
      fs: {
        allow: [workspace],
      },
    },
  },
});
