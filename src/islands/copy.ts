for (const b of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  const box = b.closest('.rt-code, .demo-row');
  const status = box?.querySelector('[role=status]');
  let timer = 0;
  b.hidden = false;
  b.addEventListener('click', async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(box?.querySelector('code')?.textContent ?? '');
    } catch {
      ok = false;
    }
    if (status) status.textContent = (ok ? b.dataset.copied : b.dataset.failed) ?? '';
    clearTimeout(timer);
    timer = window.setTimeout(() => status && (status.textContent = ''), 2000);
  });
}
