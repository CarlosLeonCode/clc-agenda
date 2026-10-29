/**
 * Webpack Runtime Module Hooking for WhatsApp Web
 */

export function initWebpackStore() {
  if (window.Store && window.Store.GroupMetadata && window.Store.Chat) return;
  window.Store = window.Store || {};

  try {
    const chunkKeys = Object.keys(window).filter(k => k.startsWith('webpackChunk'));
    const targetChunk = window.webpackChunkwhatsapp_web_client || window.webpackChunkbuild_web || (chunkKeys.length > 0 ? window[chunkKeys[0]] : null);

    if (targetChunk && typeof targetChunk.push === 'function') {
      targetChunk.push([
        ['wae_extractor_' + Math.random().toString(36).substring(2, 9)],
        {},
        (req) => {
          window.__wae_require__ = req;
          if (!req.m) return;

          for (const key of Object.keys(req.m)) {
            try {
              const m = req(key);
              if (!m) continue;

              // Contact Store
              if (!window.Store.Contact) {
                if (m.Contact && (m.Contact._models || m.Contact.models || m.Contact.get)) window.Store.Contact = m.Contact;
                else if (m.default && m.default.Contact && (m.default.Contact._models || m.default.Contact.models)) window.Store.Contact = m.default.Contact;
              }

              // Chat Store
              if (!window.Store.Chat) {
                if (m.Chat && (m.Chat._models || m.Chat.models || m.Chat.get)) window.Store.Chat = m.Chat;
                else if (m.default && m.default.Chat && (m.default.Chat._models || m.default.Chat.models)) window.Store.Chat = m.default.Chat;
              }

              // GroupMetadata Store
              if (!window.Store.GroupMetadata) {
                if (m.GroupMetadata && (m.GroupMetadata._models || m.GroupMetadata.models || m.GroupMetadata.get || m.GroupMetadata.find)) {
                  window.Store.GroupMetadata = m.GroupMetadata;
                } else if (m.default && m.default.GroupMetadata) {
                  window.Store.GroupMetadata = m.default.GroupMetadata;
                }
              }

              // Label Store
              if (!window.Store.Label) {
                if (m.Label && (m.Label._models || m.Label.models || m.Label.get)) window.Store.Label = m.Label;
                else if (m.default && m.default.Label) window.Store.Label = m.default.Label;
              }

              // Cmd / OpenChat
              if (!window.Store.Cmd && m.Cmd && m.Cmd.openChatAt) {
                window.Store.Cmd = m.Cmd;
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
