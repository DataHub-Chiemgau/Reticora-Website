// Barrierefreiheit H-1: Scrollrahmen ([data-scroll-frame]) sind im HTML immer fokussierbar (tabindex="0"), damit sie ohne
// JavaScript per Tastatur scrollbar bleiben. Läuft auf der Seite eine Insel, bleibt der Tab-Halt nur, solange der Rahmen
// tatsächlich überläuft; die Breite folgt dem Fenster (ResizeObserver). Ein gerade fokussierter Rahmen behält den Halt.
export function fitScrollFrames(): void {
  const fit = (e: Element) => {
    if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) e.setAttribute('tabindex', '0');
    else if (document.activeElement !== e) e.removeAttribute('tabindex');
  };
  const ro = new ResizeObserver((list) => list.forEach((x) => fit(x.target)));
  const frames = [...document.querySelectorAll<HTMLElement>('[data-scroll-frame]:not([data-fit])')];
  for (const e of frames) {
    e.dataset.fit = '';
    ro.observe(e);
    fit(e);
  }
  // Schriften ändern die Breite des Inhalts, nicht die des Rahmens: danach noch einmal messen.
  document.fonts.ready.then(() => frames.forEach(fit));
}
