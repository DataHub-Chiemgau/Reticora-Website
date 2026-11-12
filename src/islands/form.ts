// Kontaktformular: Token holen, per fetch senden, Fehler am Feld und in der Zusammenfassung zeigen.
// Alle Texte kommen aus dem Dokument (#form-msgs, [data-notice]); aus der Adresse wird nie Text übernommen.
export {}; // Modul, damit `f` nicht im globalen Gültigkeitsbereich liegt
const f = document.querySelector<HTMLFormElement>('form[data-lead]');
if (f) {
  const q = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
  const msg = new Map<string, string>();
  document.querySelectorAll<HTMLElement>('#form-msgs li').forEach((l) => msg.set(l.dataset.code!, l.textContent!));
  const sum = q('#form-summary')!;
  const btn = q<HTMLButtonElement>('button[type=submit]', f)!;
  const label = btn.textContent!;
  const ts = f.elements.namedItem('ts') as HTMLInputElement;
  const sig = f.elements.namedItem('sig') as HTMLInputElement;
  const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement).value;
  f.noValidate = true;

  const token = () =>
    fetch(f.action + '?token=1')
      .then((r) => r.json())
      .then((t) => ((ts.value = t.ts), (sig.value = t.sig)))
      .catch(() => {});
  token();
  // Das Token gilt zwei Stunden; eine lange offene Seite holt rechtzeitig ein neues.
  setInterval(token, 6e6);

  const clear = () => {
    document.querySelectorAll<HTMLElement>('.rt-error').forEach((e) => ((e.hidden = true), (e.textContent = '')));
    f.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    document.querySelectorAll<HTMLElement>('[data-notice]').forEach((e) => (e.hidden = true));
    sum.hidden = true;
    q('.contact-nojs')?.remove();
  };

  const show = (el: HTMLElement) => ((el.hidden = false), el.focus());

  const errors = (codes: string[]) => {
    clear();
    const list = q('ul', sum)!;
    list.textContent = '';
    let n = 0;
    for (let c of codes) {
      if (c === 'topic.invalid' && !val('topic')) c = 'topic.required';
      const text = msg.get(c);
      if (!text || c === 'one' || c === 'many') continue;
      n++;
      const name = c.split('.')[0];
      const input = q(`#f-${name}`, f);
      const li = document.createElement('li');
      if (input) {
        const e = q(`#f-${name}-err`)!;
        e.textContent = text;
        e.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        const a = document.createElement('a');
        a.href = `#f-${name}`;
        a.textContent = text;
        li.append(a);
      } else li.textContent = text;
      list.append(li);
    }
    if (!n) return notice('500');
    q('#form-summary-title')!.textContent = n > 1 ? msg.get('many')!.replace('{n}', String(n)) : msg.get('one')!;
    show(sum);
  };

  const notice = (n: string) => {
    clear();
    show(q(`[data-notice="${n}"]`)!);
  };

  // Rückkehr vom Server ohne JavaScript: ?fehler=… bzw. ?error=… (nur bekannte Codes werden übernommen).
  const p = new URLSearchParams(location.search);
  const back = (p.get('fehler') ?? p.get('error') ?? '').split(',').filter((c) => msg.has(c));
  if (back.length) errors(back);

  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    btn.disabled = true;
    btn.textContent = btn.dataset.sending!;
    const done = () => ((btn.disabled = false), (btn.textContent = label));
    fetch(f.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams(new FormData(f) as unknown as Record<string, string>),
    })
      .then(async (r) => {
        if (r.ok) return location.assign(f.dataset.thanks!);
        done();
        if (r.status === 422) errors(Object.values((await r.json()).errors ?? {}));
        else notice(r.status === 429 ? '429' : '500');
      })
      .catch(() => (done(), notice('500')));
  });
}
