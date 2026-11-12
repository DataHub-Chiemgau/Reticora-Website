for (const b of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  const box = b.closest('.rt-code');
  const status = box?.querySelector('[role=status]');
  let timer = 0;
  b.hidden = false;
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(box?.querySelector('code')?.textContent ?? '');
    } catch {
      return;
    }
    if (status) status.textContent = b.dataset.copied ?? '';
    clearTimeout(timer);
    timer = window.setTimeout(() => status && (status.textContent = ''), 2000);
  });
}
