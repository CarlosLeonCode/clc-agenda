/**
 * CLC Agenda - Popup Controller
 * Copy comes from _locales through chrome.i18n, so it follows the browser language.
 */

const msg = (key) => chrome.i18n.getMessage(key) || key;

function localize() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = msg(el.getAttribute('data-i18n'));
  });
  document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;
}

function showGoToWhatsApp(statusDot, statusText, btnAction, statusKey) {
  statusDot.className = 'status-indicator inactive';
  statusText.textContent = msg(statusKey);
  btnAction.textContent = msg('popupGoTo');
  btnAction.addEventListener('click', async () => {
    await chrome.tabs.create({ url: 'https://web.whatsapp.com' });
    window.close();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  localize();
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const btnAction = document.getElementById('btn-action');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const isWhatsAppWeb = activeTab && activeTab.url && activeTab.url.includes('web.whatsapp.com');

    if (isWhatsAppWeb) {
      statusDot.className = 'status-indicator active';
      statusText.textContent = msg('popupReady');
      btnAction.textContent = msg('popupOpen');
      btnAction.addEventListener('click', async () => {
        try {
          await chrome.tabs.sendMessage(activeTab.id, { action: 'OPEN_EXTRACTOR' });
          window.close();
        } catch (err) {
          statusText.textContent = msg('popupReload');
        }
      });
    } else {
      showGoToWhatsApp(statusDot, statusText, btnAction, 'popupNotOnWhatsApp');
    }
  } catch (err) {
    showGoToWhatsApp(statusDot, statusText, btnAction, 'popupTabError');
  }
});
