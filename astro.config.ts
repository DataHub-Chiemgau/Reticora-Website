import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import devPages from './src/integrations/dev-pages';

export default defineConfig({
  output: 'static',
  integrations: [devPages()],
  site: 'https://www.reticora.de',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  i18n: { defaultLocale: 'de', locales: ['de', 'en'], routing: { prefixDefaultLocale: false } },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
