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

  console.log('[CLC Agenda] Engine initialized.');

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
    // Heartbeat: the UI times out only after a stretch without any message for this request
    const onProgress = () => window.postMessage({ type: 'WA_EXTRACTOR_PROGRESS', requestId }, window.location.origin);

    try {
      let responseData = null;

      switch (action) {
        case 'GET_OVERVIEW':
          responseData = await handleGetOverview(onProgress);
          break;
        case 'EXTRACT_GROUP':
          responseData = await handleExtractGroup(payload?.groupId, onProgress);
          break;
        case 'EXTRACT_LABEL':
          responseData = await handleExtractLabel(payload?.labelId, onProgress);
          break;
        case 'EXTRACT_ALL':
          responseData = await handleExtractAll(payload?.filter || 'all', onProgress);
          break;
        case 'EXTRACT_CHATS':
          responseData = await handleExtractChats(payload?.filter || 'all', onProgress);
          break;
        default:
          throw Object.assign(new Error(`Unknown action: ${action}`), { code: 'UNKNOWN_ACTION' });
      }

      window.postMessage({
        type: 'WA_EXTRACTOR_RESPONSE',
        requestId,
        success: true,
        data: responseData
      }, window.location.origin);
    } catch (err) {
      console.error('[CLC Agenda] Request error:', err);
      window.postMessage({
        type: 'WA_EXTRACTOR_RESPONSE',
        requestId,
        success: false,
        code: err.code || 'ENGINE_ERROR',
        error: err.message || 'Request failed'
      }, window.location.origin);
    }
  });
}

if (!window.__WA_EXTRACTOR_INITIALIZED__) {
  start();
}
