// Copy buttons on the install guide. If the clipboard is unavailable, select the
// text instead so the person can copy it by hand; either way, announce the result.

const status = document.querySelector('[data-copy-status]');

for (const button of document.querySelectorAll('[data-copy]')) {
  const value = button.dataset.copy;
  const original = button.textContent;
  let timer;

  const announce = (message, label) => {
    status.textContent = message;
    button.textContent = label;
    clearTimeout(timer);
    timer = setTimeout(() => { button.textContent = original; }, 2500);
  };

  const selectSource = () => {
    const source = document.querySelector('[data-copy-source]');
    if (!source) return;
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(value);
      announce(`Copiado: ${value}. Ahora pégalo en la barra de direcciones.`, 'Copiado');
    } catch {
      selectSource();
      announce(`No se pudo copiar solo. La dirección quedó seleccionada: cópiala con Ctrl+C o Cmd+C.`, 'Copiar');
    }
  });
}
