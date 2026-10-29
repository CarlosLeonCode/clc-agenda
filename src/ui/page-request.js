/**
 * Request/response bridge to the page engine over window.postMessage.
 * Times out after a stretch without any message for the request (the engine
 * sends progress while it works), with a hard cap on the total wait.
 */

export const IDLE_TIMEOUT_MS = 20000;
export const TOTAL_TIMEOUT_MS = 180000;

const TIMEOUT_MESSAGE = 'Tiempo de espera agotado al comunicar con WhatsApp Web.';

export function sendPageRequest(action, payload = {}, { win = window, idleMs = IDLE_TIMEOUT_MS, totalMs = TOTAL_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    let idleTimer = null;

    function finish() {
      clearTimeout(idleTimer);
      clearTimeout(totalTimer);
      win.removeEventListener('message', handler);
    }

    function fail() {
      finish();
      reject(new Error(TIMEOUT_MESSAGE));
    }

    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(fail, idleMs);
    }

    function handler(event) {
      if (event.source !== win || event.origin !== win.location.origin) return;
      const data = event.data;
      if (!data || data.requestId !== requestId) return;

      if (data.type === 'WA_EXTRACTOR_PROGRESS') {
        resetIdle();
      } else if (data.type === 'WA_EXTRACTOR_RESPONSE') {
        finish();
        if (data.success) resolve(data.data);
        else reject(new Error(data.error || 'Error en la extracción.'));
      }
    }

    const totalTimer = setTimeout(fail, totalMs);
    resetIdle();
    win.addEventListener('message', handler);
    win.postMessage({ type: 'WA_EXTRACTOR_REQUEST', requestId, action, payload }, win.location.origin);
  });
}
