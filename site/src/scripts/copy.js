// Copy buttons on the install guide. If the clipboard is unavailable, select the
// text instead so the person can copy it by hand; either way, announce the result.
// Messages live in data attributes, so they follow the page language.

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
      announce(status.dataset.copied.replace('{value}', value), button.dataset.done);
    } catch {
      selectSource();
      announce(status.dataset.failed, original);
    }
  });
}
