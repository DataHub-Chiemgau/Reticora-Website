import type { AstroIntegration } from 'astro';

/** Hängt die Entwicklungsseiten ein; im Release-Build (RETICORA_RELEASE=1) fehlen sie. */
export default function devPages(): AstroIntegration {
  return {
    name: 'reticora-dev-pages',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        if (process.env.RETICORA_RELEASE === '1') return;
        injectRoute({ pattern: '/dev/bausteine', entrypoint: './src/dev/bausteine.astro' });
      },
    },
  };
}
