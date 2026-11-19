import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import devPages from './src/integrations/dev-pages';
import leadTemplates from './src/integrations/lead-templates';
import securityTxtFile from './src/integrations/security-txt';
import releaseMarker from './src/integrations/release-marker';

export default defineConfig({
  output: 'static',
  integrations: [devPages(), leadTemplates(), securityTxtFile(), releaseMarker()],
  site: 'https://www.reticora.de',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  i18n: { defaultLocale: 'de', locales: ['de', 'en'], routing: { prefixDefaultLocale: false } },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
