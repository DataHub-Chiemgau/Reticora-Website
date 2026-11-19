import type { AstroIntegration } from 'astro';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ui } from '../i18n';
import { formTexts, markerProblems, TEMPLATE_PAGES } from '../../scripts/lib/lead-templates.mjs';

/**
 * Spec Ä-08: Nach dem Build liegt die fertige Kontaktseite je Sprache als Vorlage in `backend/templates/`
 * (außerhalb des Webroots, nicht im Repository), dazu `form-texts.json` mit den Fehlertexten aus `ui(lang).form`.
 * Das Lead-Backend zeigt bei Eingabefehlern ohne JavaScript diese Seite mit Fehlern und Eingaben (422).
 */
export default function leadTemplates(): AstroIntegration {
  let root: URL;
  return {
    name: 'reticora-lead-templates',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root;
      },
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(new URL('backend/templates/', root));
        mkdirSync(out, { recursive: true });
        const texts = { de: formTexts(ui('de').form), en: formTexts(ui('en').form) };
        writeFileSync(`${out}form-texts.json`, JSON.stringify(texts, null, 2) + '\n');
        for (const [lang, page] of TEMPLATE_PAGES) {
          const src = fileURLToPath(new URL(page, dir));
          const target = `${out}contact.${lang}.html`;
          if (!existsSync(src)) {
            rmSync(target, { force: true });
            logger.warn(`${page} fehlt: keine Vorlage für ${lang}; lead.php zeigt bei Eingabefehlern dann die kurze Hinweisseite.`);
            continue;
          }
          const html = readFileSync(src, 'utf8');
          const problems = markerProblems(html);
          if (problems.length) throw new Error(`Vorlage aus ${page} unbrauchbar: ${problems.join('; ')}`);
          writeFileSync(target, html);
          logger.info(`Vorlage ${lang}: backend/templates/contact.${lang}.html`);
        }
      },
    },
  };
}
