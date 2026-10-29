/**
 * CLC Agenda - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const btnAction = document.getElementById('btn-action');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const isWhatsAppWeb = activeTab && activeTab.url && activeTab.url.includes('web.whatsapp.com');

    if (isWhatsAppWeb) {
      statusDot.className = 'status-indicator active';
      statusText.textContent = 'WhatsApp Web detectado y listo';
      btnAction.textContent = 'Abrir en WhatsApp Web';
      btnAction.addEventListener('click', async () => {
        try {
          await chrome.tabs.sendMessage(activeTab.id, { action: 'OPEN_EXTRACTOR' });
          window.close();
        } catch (err) {
          statusText.textContent = 'Recarga la pestaña de WhatsApp';
        }
      });
    } else {
      statusDot.className = 'status-indicator inactive';
      statusText.textContent = 'No estás en WhatsApp Web';
      btnAction.textContent = 'Ir a WhatsApp Web';
      btnAction.addEventListener('click', async () => {
        await chrome.tabs.create({ url: 'https://web.whatsapp.com' });
        window.close();
      });
    }
  } catch (err) {
    statusDot.className = 'status-indicator inactive';
    statusText.textContent = 'Error al detectar pestaña';
    btnAction.textContent = 'Ir a WhatsApp Web';
    btnAction.addEventListener('click', async () => {
      await chrome.tabs.create({ url: 'https://web.whatsapp.com' });
      window.close();
    });
  }
});
