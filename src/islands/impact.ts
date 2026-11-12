import { computeImpact, impactSentence } from '../lib/impact';
import type { Lang } from '../data/types';

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? '';
}

for (const root of document.querySelectorAll<HTMLElement>('[data-topo]')) {
  const lang: Lang = root.dataset.lang === 'en' ? 'en' : 'de';
  const nodes = [...root.querySelectorAll<SVGGElement>('.n')];
  const edges = [...root.querySelectorAll<SVGGElement>('.e')];
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-ci]')];
  const group = root.querySelector<HTMLElement>('.rt-topo-controls');
  const out = root.querySelector<HTMLElement>('.rt-topo-result');
  if (!out) continue;
  const ids = nodes.map((n) => attr(n, 'data-id'));
  const rels = edges.map((e) => ({ from: attr(e, 'data-from'), to: attr(e, 'data-to'), rel: attr(e, 'data-rel') }));

  const run = (failed: string[]) => {
    const r = computeImpact(ids, rels, failed);
    for (const n of nodes) {
      const id = attr(n, 'data-id');
      n.classList.toggle('is-failed', r.failed.includes(id));
      n.classList.toggle('is-affected', r.affected.includes(id));
    }
    for (const e of edges) {
      e.classList.toggle('is-dim', r.affected.includes(attr(e, 'data-from')) || r.affected.includes(attr(e, 'data-to')));
    }
    for (const c of chips) {
      const id = attr(c, 'data-ci');
      c.setAttribute('aria-pressed', String(r.failed.includes(id)));
      c.classList.toggle('is-affected', r.affected.includes(id));
    }
    const s = impactSentence(lang, r);
    out.textContent = s.main;
    if (s.guarded) {
      const span = document.createElement('span');
      span.textContent = s.guarded;
      out.append(' ', span);
    }
  };
  const toggle = (id: string) => {
    const now = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => attr(c, 'data-ci'));
    run(now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
  };

  for (const c of chips) {
    const id = attr(c, 'data-ci');
    const node = nodes.find((n) => attr(n, 'data-id') === id);
    c.addEventListener('click', () => toggle(id));
    c.addEventListener('focus', () => node?.classList.add('is-focus'));
    c.addEventListener('blur', () => node?.classList.remove('is-focus'));
  }
  for (const n of nodes) n.addEventListener('click', () => toggle(attr(n, 'data-id')));
  if (group) group.hidden = false;
}
