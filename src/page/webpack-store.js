/**
 * Webpack Runtime Module Hooking for WhatsApp Web
 */

// Module-scoped on purpose: WhatsApp internals never become page globals
export const store = {};

export function initWebpackStore() {
  if (store.GroupMetadata && store.Chat) return;

  try {
    const chunkKeys = Object.keys(window).filter(k => k.startsWith('webpackChunk'));
    const targetChunk = window.webpackChunkwhatsapp_web_client || window.webpackChunkbuild_web || (chunkKeys.length > 0 ? window[chunkKeys[0]] : null);

    if (targetChunk && typeof targetChunk.push === 'function') {
      targetChunk.push([
        ['wae_extractor_' + Math.random().toString(36).substring(2, 9)],
        {},
        (req) => {
          if (!req.m) return;

          for (const key of Object.keys(req.m)) {
            try {
              const m = req(key);
              if (!m) continue;

              // Contact Store
              if (!store.Contact) {
                if (m.Contact && (m.Contact._models || m.Contact.models || m.Contact.get)) store.Contact = m.Contact;
                else if (m.default && m.default.Contact && (m.default.Contact._models || m.default.Contact.models)) store.Contact = m.default.Contact;
              }

              // Chat Store
              if (!store.Chat) {
                if (m.Chat && (m.Chat._models || m.Chat.models || m.Chat.get)) store.Chat = m.Chat;
                else if (m.default && m.default.Chat && (m.default.Chat._models || m.default.Chat.models)) store.Chat = m.default.Chat;
              }

              // GroupMetadata Store
              if (!store.GroupMetadata) {
                if (m.GroupMetadata && (m.GroupMetadata._models || m.GroupMetadata.models || m.GroupMetadata.get || m.GroupMetadata.find)) {
                  store.GroupMetadata = m.GroupMetadata;
                } else if (m.default && m.default.GroupMetadata) {
                  store.GroupMetadata = m.default.GroupMetadata;
                }
              }

              // Label Store
              if (!store.Label) {
                if (m.Label && (m.Label._models || m.Label.models || m.Label.get)) store.Label = m.Label;
                else if (m.default && m.default.Label) store.Label = m.default.Label;
              }
            } catch (e) {}
          }
        }
      ]);
    }
  } catch (err) {
    console.warn('[WA Extractor] Webpack hook warning:', err);
  }
}
