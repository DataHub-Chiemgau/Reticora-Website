// Kontaktformular: per fetch senden, Fehler am Feld und in der Zusammenfassung zeigen.
// Alle Texte kommen aus dem Dokument (#form-msgs, [data-notice]). Aus der Adresse wird nur `?topic=` gelesen,
// und nur, wenn der Wert in der festen Liste der Anliegen steht.
export {}; // Modul, damit `f` nicht im globalen Gültigkeitsbereich liegt
const f = document.querySelector<HTMLFormElement>('form[data-lead]');
if (f) {
  const q = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
  const msg = new Map<string, string>();
  document.querySelectorAll<HTMLElement>('#form-msgs li').forEach((l) => msg.set(l.dataset.code!, l.textContent!));
  const sum = q('#form-summary')!;
  const btn = q<HTMLButtonElement>('button[type=submit]', f)!;
  const label = btn.textContent!;
  f.noValidate = true;

  const topic = f.elements.namedItem('topic') as HTMLSelectElement;
  const want = new URLSearchParams(location.search).get('topic');
  if (!topic.value && want && ['demo', 'enterprise', 'security', 'other'].includes(want)) topic.value = want;

  const clear = () => {
    document.querySelectorAll<HTMLElement>('.rt-error').forEach((e) => ((e.hidden = true), (e.textContent = '')));
    f.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    document.querySelectorAll<HTMLElement>('[data-notice]').forEach((e) => (e.hidden = true));
    sum.hidden = true;
  };

  const show = (el: HTMLElement) => ((el.hidden = false), el.focus());
  // Fehlerseite des Servers (422, Ä-08): die Zusammenfassung ist schon gefüllt; Fokus auch dort, wo autofocus nicht greift.
  if (!sum.hidden) sum.focus();

  const notice = (n: string) => {
    clear();
    show(q(`[data-notice="${n}"]`)!);
  };

  const errors = (codes: string[]) => {
    clear();
    const list = q('ul', sum)!;
    list.textContent = '';
    let n = 0;
    for (const c of codes) {
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
