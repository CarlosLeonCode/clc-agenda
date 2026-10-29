/**
 * CLC Agenda - Page Engine Entry (world: MAIN)
 * Webpack Hooking, Deep Multi-Store Group Resolution, On-Demand Server Fetch,
 * Multi-Device JID Normalization, Suffix Matching, and Archived Chats/Groups Support.
 */

import { initWebpackStore } from './webpack-store.js';
import {
  handleGetOverview,
  handleExtractGroup,
  handleExtractLabel,
  handleExtractAll,
  handleExtractChats
} from './handlers.js';

function start() {
  window.__WA_EXTRACTOR_INITIALIZED__ = true;

  console.log('[WA Extractor Pro] Engine v2.7 (Archived Support & Deep Webpack Hook) initialized.');

  // Attempt Webpack hook immediately
  initWebpackStore();

  /**
   * Global message listener with origin verification
   */
  window.addEventListener('message', async (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    if (!event.data || event.data.type !== 'WA_EXTRACTOR_REQUEST') {
      return;
    }

    const { action, requestId, payload } = event.data;

    try {
      let responseData = null;

      switch (action) {
        case 'GET_OVERVIEW':
          responseData = await handleGetOverview();
          break;
        case 'EXTRACT_GROUP':
          responseData = await handleExtractGroup(payload?.groupId);
          break;
        case 'EXTRACT_LABEL':
          responseData = await handleExtractLabel(payload?.labelId);
          break;
        case 'EXTRACT_ALL':
          responseData = await handleExtractAll(payload?.filter || 'all');
          break;
        case 'EXTRACT_CHATS':
          responseData = await handleExtractChats(payload?.filter || 'all');
          break;
        default:
          throw new Error(`Acción no reconocida: ${action}`);
      }

      window.postMessage({
        type: 'WA_EXTRACTOR_RESPONSE',
        requestId,
        success: true,
        data: responseData
      }, window.location.origin);
    } catch (err) {
      console.error('[WA Extractor] Request error:', err);
      window.postMessage({
        type: 'WA_EXTRACTOR_RESPONSE',
        requestId,
        success: false,
        error: err.message || 'Error al procesar solicitud'
      }, window.location.origin);
    }
  });
}

if (!window.__WA_EXTRACTOR_INITIALIZED__) {
  start();
}
