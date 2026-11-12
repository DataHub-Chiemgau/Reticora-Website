const f = document.querySelector<HTMLElement>('[data-filter]');
if (f) {
  const g = f.querySelector<HTMLElement>('[role=group]')!;
  const out = f.querySelector('[aria-live]')!;
  const bodies = [...document.querySelectorAll<HTMLElement>('tbody[data-cat]')];
  g.hidden = false;
  g.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    let n = 0;
    for (const t of bodies) {
      t.hidden = b.dataset.set !== 'all' && t.dataset.cat !== b.dataset.set;
      if (!t.hidden) n += +t.dataset.n!;
    }
    for (const x of g.children) x.setAttribute('aria-pressed', String(x === b));
    out.textContent = (n === 1 ? f.dataset.one! : f.dataset.many!).replace('{n}', String(n));
  });
}
