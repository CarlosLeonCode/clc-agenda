/**
 * WA Contact Extractor Pro - Content Script Entry Point
 */

(function () {
  'use strict';

  console.log('[WA Extractor Pro] Content script active on WhatsApp Web.');

  function injectMainWorldScript(file) {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(file);
      script.onload = function () {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (err) {
      console.error('[WA Extractor Pro] Script injection error:', err);
    }
  }

  injectMainWorldScript('content/inject.js');

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
        const trigger = document.getElementById('wae-floating-trigger');
        if (trigger) {
          trigger.click();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Overlay not ready' });
        }
      }
      return true;
    });
  }

})();
