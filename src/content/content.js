/**
 * CLC Agenda - Content Script Entry Point (world: ISOLATED)
 * The page engine (dist/inject.js) is loaded by the manifest in the MAIN world.
 */

console.log('[WA Extractor Pro] Content script active on WhatsApp Web.');

function waitForWhatsApp() {
  const checkInterval = setInterval(() => {
    const appRoot = document.getElementById('app') || document.querySelector('#main') || document.body;
    if (appRoot && document.readyState === 'complete') {
      if (window.WAExtractorUI && window.WAExtractorUI.init) {
        window.WAExtractorUI.init();
        clearInterval(checkInterval);
      }
    }
  }, 1000);
}

waitForWhatsApp();

if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'OPEN_EXTRACTOR') {
      if (window.WAExtractorUI && window.WAExtractorUI.open && window.WAExtractorUI.open()) {
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Overlay not ready' });
      }
    }
    return true;
  });
}
