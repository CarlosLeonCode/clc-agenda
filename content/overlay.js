/**
 * WA Contact Extractor Pro - Floating UI Overlay Manager (v2.7)
 * Archived Chats & Groups Support, Top-Aligned Column Selector,
 * Spacious Table View, Webpack Sync, Real-Time Dynamic Table.
 */

(function () {
  'use strict';

  let overviewData = null;
  let activeTab = 'groups';
  let currentFilter = 'all';
  let currentChatFilter = 'all';
  let currentGroupFilter = 'all';
  let extractedContacts = [];
  let selectedContactIds = new Set();
  let searchTerm = '';
  let groupSearchTerm = '';

  // Field Definitions with Dynamic Table Renderers
  const AVAILABLE_FIELDS = [
    {
      id: 'name',
      label: '👤 Nombre',
      shortHeader: 'Nombre',
      default: true,
      renderCell: (c) => {
        const name = c.name || c.savedName || c.pushName;
        if (!name) return '<span style="color: var(--wae-text-muted); font-style: italic;">Sin Nombre</span>';
        return `<span style="font-weight: 600; color: #ffffff;">${escapeHTML(name)}</span>`;
      },
      getValue: (c) => c.name || c.savedName || c.pushName || ''
    },
    {
      id: 'phone',
      label: '📞 Teléfono (+57...)',
      shortHeader: 'Teléfono',
      default: true,
      renderCell: (c) => {
        const phone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '-');
        return `<span style="font-family: monospace; font-size: 13px; color: var(--wae-blue); font-weight: 600;">${escapeHTML(phone)}</span>`;
      },
      getValue: (c) => c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '')
    },
    {
      id: 'cleanPhone',
      label: '🔢 Solo Dígitos',
      shortHeader: 'Solo Números',
      default: false,
      renderCell: (c) => {
        const num = c.cleanPhone || '-';
        return `<span style="font-family: monospace; font-size: 13px; color: #e9edef;">${escapeHTML(num)}</span>`;
      },
      getValue: (c) => c.cleanPhone || ''
    },
    {
      id: 'isMyContact',
      label: '📇 En Agenda',
      shortHeader: 'En Agenda',
      default: false,
      renderCell: (c) => {
        return `<span class="wae-tag ${c.isMyContact ? 'wae-tag-yes' : 'wae-tag-no'}">${c.isMyContact ? 'En agenda' : 'No guardado'}</span>`;
      },
      getValue: (c) => c.isMyContact ? 'Sí' : 'No'
    },
    {
      id: 'isAdmin',
      label: '👑 Rol en Grupo',
      shortHeader: 'Rol',
      default: false,
      renderCell: (c) => {
        if (c.isAdmin) return '<span class="wae-tag wae-tag-admin">Admin</span>';
        return '<span style="color: #8696a0; font-size: 12px;">Miembro</span>';
      },
      getValue: (c) => c.isAdmin ? 'Admin' : 'Miembro'
    },
    {
      id: 'isBusiness',
      label: '🏢 Tipo de Cuenta',
      shortHeader: 'Tipo Cuenta',
      default: false,
      renderCell: (c) => {
        if (c.isBusiness) return '<span class="wae-tag wae-tag-yes">Empresa</span>';
        return '<span style="color: #8696a0; font-size: 12px;">Personal</span>';
      },
      getValue: (c) => c.isBusiness ? 'Empresa' : 'Personal'
    },
    {
      id: 'country',
      label: '🌍 País / Región',
      shortHeader: 'País',
      default: false,
      renderCell: (c) => {
        return `<span style="font-size: 12px; color: #ffffff; font-weight: 500;">${escapeHTML(c.country || 'Desconocido')}</span>`;
      },
      getValue: (c) => c.country || 'Desconocido'
    },
    {
      id: 'sourceName',
      label: '🏷️ Origen / Grupo',
      shortHeader: 'Origen',
      default: false,
      renderCell: (c) => {
        return `<span style="font-size: 11.5px; color: #8696a0;">${escapeHTML(c.sourceName || c.source || '-')}</span>`;
      },
      getValue: (c) => c.sourceName || c.source || 'Todos'
    },
    {
      id: 'id',
      label: '🆔 WhatsApp ID',
      shortHeader: 'WhatsApp ID',
      default: false,
      renderCell: (c) => {
        return `<span style="font-family: monospace; font-size: 11px; color: #8696a0;">${escapeHTML(c.id || '-')}</span>`;
      },
      getValue: (c) => c.id || ''
    }
  ];

  const FIELD_MAP = new Map(AVAILABLE_FIELDS.map(f => [f.id, f]));
  let selectedFields = new Set(['name', 'phone']);

  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sendPageRequest(action, payload = {}) {
    return new Promise((resolve, reject) => {
      const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('Tiempo de espera agotado al comunicar con WhatsApp Web.'));
      }, 15000);

      function handler(event) {
        if (event.source !== window || event.origin !== window.location.origin) return;
        if (!event.data || event.data.type !== 'WA_EXTRACTOR_RESPONSE') return;
        if (event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error || 'Error en la extracción.'));
          }
        }
      }

      window.addEventListener('message', handler);
      window.postMessage({
        type: 'WA_EXTRACTOR_REQUEST',
        requestId,
        action,
        payload
      }, window.location.origin);
    });
  }

  function showToast(message, isError = false) {
    let toast = document.getElementById('wae-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wae-toast';
      toast.className = 'wae-toast';
      document.body.appendChild(toast);
    }
    toast.style.borderColor = isError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)';
    toast.textContent = String(message);
    toast.classList.add('wae-show');
    setTimeout(() => {
      toast.classList.remove('wae-show');
    }, 3500);
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function getActiveOrderedFields() {
    return AVAILABLE_FIELDS.filter(f => selectedFields.has(f.id));
  }

  function formatCSV(contacts, fieldsToExport, delimiter = ',') {
    const activeFields = fieldsToExport.map(id => FIELD_MAP.get(id)).filter(Boolean);

    const sanitizeCSVField = (val, isPhone = false) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (!isPhone && /^[=\-+@\t\r]/.test(s)) {
        s = "'" + s;
      }
      if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = activeFields.map(f => f.shortHeader);
    const headerLine = headers.map(h => sanitizeCSVField(h)).join(delimiter);

    const rows = contacts.map(c => {
      return activeFields.map(f => {
        const val = f.getValue(c);
        const isPhone = f.id === 'phone' || f.id === 'cleanPhone';
        return sanitizeCSVField(val, isPhone);
      }).join(delimiter);
    });

    return '\uFEFF' + [headerLine, ...rows].join('\r\n');
  }

  function formatVCard(contacts, fieldsToExport) {
    const escapeVCard = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const cards = [];

    const includeName = fieldsToExport.includes('name');
    const includePhone = fieldsToExport.includes('phone') || fieldsToExport.includes('cleanPhone');
    const includeOrg = fieldsToExport.includes('isBusiness');
    const includeNote = fieldsToExport.includes('sourceName') || fieldsToExport.includes('country');

    for (const c of contacts) {
      const phone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');
      let name = '';
      if (includeName) {
        name = (c.name || c.savedName || c.pushName || '').trim();
      }
      if (!name && phone) name = `WA ${phone}`;
      else if (!name) name = 'Contacto WhatsApp';

      const card = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCard(name)}`,
        `N:${escapeVCard(name)};;;;`
      ];

      if (includePhone && phone) {
        card.push(`TEL;TYPE=CELL,VOICE:${phone}`);
      }

      if (includeOrg && c.isBusiness) {
        card.push(`ORG:Empresa WhatsApp`);
      }

      const categories = [];
      if (fieldsToExport.includes('sourceName') && c.sourceName) categories.push(c.sourceName);
      if (fieldsToExport.includes('isAdmin') && c.isAdmin) categories.push('Admin');
      if (fieldsToExport.includes('country') && c.country) categories.push(c.country);

      if (categories.length > 0) {
        card.push(`CATEGORIES:${categories.map(escapeVCard).join(',')}`);
      }

      if (includeNote && c.sourceName) {
        card.push(`NOTE:Extraído de: ${escapeVCard(c.sourceName)}`);
      }

      card.push('END:VCARD');
      cards.push(card.join('\r\n'));
    }

    return cards.join('\r\n');
  }

  function formatGoogleContactsCSV(contacts) {
    const headers = ['First Name', 'Middle Name', 'Last Name', 'Name Prefix', 'Name Suffix', 'Phonetic First Name', 'Phonetic Middle Name', 'Phonetic Last Name', 'Organization Name', 'Organization Title', 'Phone 1 - Type', 'Phone 1 - Value', 'Email 1 - Type', 'Email 1 - Value', 'Notes', 'Labels'];
    const csv = (value) => {
      const text = value == null ? '' : String(value);
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows = contacts.map(c => {
      const displayName = (c.name || c.savedName || c.pushName || '').trim();
      const parts = displayName.split(/\s+/).filter(Boolean);
      const firstName = parts.slice(0, -1).join(' ') || parts[0] || '';
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
      const phone = c.cleanPhone ? `+${c.cleanPhone}` : (c.phone || '');
      const source = c.sourceName || c.source || '';
      return [firstName, '', lastName, '', '', '', '', '', c.isBusiness ? 'Empresa WhatsApp' : '', '', phone ? 'Mobile' : '', phone, '', '', source ? `Extraído de: ${source}` : '', source].map(csv).join(',');
    });
    return '\uFEFF' + [headers.map(csv).join(','), ...rows].join('\r\n');
  }

  function formatJSON(contacts, fieldsToExport) {
    const activeFields = fieldsToExport.map(id => FIELD_MAP.get(id)).filter(Boolean);

    return JSON.stringify({
      metadata: {
        exportedAt: new Date().toISOString(),
        totalContacts: contacts.length,
        selectedFields: activeFields.map(f => f.id),
        generator: 'CLC Agenda'
      },
      contacts: contacts.map(c => {
        const item = {};
        for (const f of activeFields) {
          item[f.id] = f.getValue(c);
        }
        return item;
      })
    }, null, 2);
  }

  /**
   * Draggable & Dockable Button Setup
   */
  function clampLauncherPosition(x, y, buttonWidth, buttonHeight, viewportWidth, viewportHeight) {
    const margin = 10;
    const maxX = Math.max(margin, viewportWidth - buttonWidth - margin);
    const maxY = Math.max(margin, viewportHeight - buttonHeight - margin);
    return {
      x: Math.min(maxX, Math.max(margin, x)),
      y: Math.min(maxY, Math.max(margin, y))
    };
  }

  function setupDraggableLauncher(btn) {
    try {
      const savedPos = localStorage.getItem('wae_btn_pos');
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (parsed.preset === 'top') {
          dockButton('top', btn, false);
        } else if (parsed.preset === 'middle') {
          dockButton('middle', btn, false);
        } else if (parsed.preset === 'bottom') {
          dockButton('bottom', btn, false);
        } else if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
          const rect = btn.getBoundingClientRect();
          const position = clampLauncherPosition(
            parsed.x,
            parsed.y,
            btn.offsetWidth || rect.width,
            btn.offsetHeight || rect.height,
            window.innerWidth,
            window.innerHeight
          );
          btn.style.left = `${position.x}px`;
          btn.style.top = `${position.y}px`;
          btn.style.right = 'auto';
          btn.style.bottom = 'auto';
          btn.style.transform = 'none';
        }
      }
    } catch (e) {}

    let isDragging = false;
    let startX, startY, origLeft, origTop;
    let dragThreshold = 5;
    let hasMoved = false;

    btn.addEventListener('mousedown', (e) => {
      if (e.target.closest('.wae-dock-controls')) return;
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = btn.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;

      btn.style.left = `${origLeft}px`;
      btn.style.top = `${origTop}px`;
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
      btn.style.transform = 'none';

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
        hasMoved = true;
      }

      if (hasMoved) {
        let newX = origLeft + dx;
        let newY = origTop + dy;

        const maxW = window.innerWidth - btn.offsetWidth - 10;
        const maxH = window.innerHeight - btn.offsetHeight - 10;
        newX = Math.max(10, Math.min(maxW, newX));
        newY = Math.max(10, Math.min(maxH, newY));

        btn.style.left = `${newX}px`;
        btn.style.top = `${newY}px`;
      }
    }

    function onMouseUp(e) {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (hasMoved) {
        const rect = btn.getBoundingClientRect();
        try {
          localStorage.setItem('wae_btn_pos', JSON.stringify({ x: rect.left, y: rect.top, preset: 'custom' }));
        } catch (e) {}
      } else {
        openModal();
      }
    }
  }

  function dockButton(position, btn, save = true) {
    btn.style.left = 'auto';
    btn.style.transform = 'none';

    if (position === 'top') {
      btn.style.top = '24px';
      btn.style.bottom = 'auto';
      btn.style.right = '24px';
    } else if (position === 'middle') {
      btn.style.top = '50%';
      btn.style.bottom = 'auto';
      btn.style.right = '24px';
      btn.style.transform = 'translateY(-50%)';
    } else if (position === 'bottom') {
      btn.style.top = 'auto';
      btn.style.bottom = '24px';
      btn.style.right = '24px';
    }

    if (save) {
      try {
        localStorage.setItem('wae_btn_pos', JSON.stringify({ preset: position }));
        showToast(`Botón anclado a: ${position === 'top' ? 'Arriba' : position === 'middle' ? 'Al Medio' : 'Abajo'}`);
      } catch (e) {}
    }
  }

  function openModal() {
    const modal = document.getElementById('wae-modal-container');
    const backdrop = document.getElementById('wae-backdrop');
    if (modal && backdrop) {
      modal.classList.add('wae-active');
      backdrop.classList.add('wae-active');
      loadOverview();
    }
  }

  function closeModal() {
    const modal = document.getElementById('wae-modal-container');
    const backdrop = document.getElementById('wae-backdrop');
    if (modal && backdrop) {
      modal.classList.remove('wae-active');
      backdrop.classList.remove('wae-active');
    }
  }

  /**
   * UI Initialization
   */
  function initUI() {
    if (document.getElementById('wae-floating-trigger')) return;

    // 1. Floating trigger button
    const trigger = document.createElement('div');
    trigger.id = 'wae-floating-trigger';
    trigger.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5.01L2 22l5.12-1.33C8.57 21.49 10.24 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.53 0-2.98-.44-4.22-1.19l-.3-.18-3.04.79.81-2.96-.2-.31C4.34 14.93 3.89 13.51 3.89 12 3.89 7.53 7.53 3.89 12 3.89s8.11 3.64 8.11 8.11-3.64 8.11-8.11 8.11zM17.06 14.5c-.28-.14-1.65-.81-1.9-.9-.26-.1-.44-.14-.63.14-.19.28-.73.9-.9 1.09-.17.19-.34.21-.62.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.68-1.57-1.96-.17-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.55-.46-.48-.63-.49h-.54c-.19 0-.49.07-.75.35s-1 1-1 2.43 1.02 2.82 1.17 3.01c.14.19 2.01 3.07 4.87 4.31.68.29 1.21.47 1.63.6.69.22 1.31.19 1.81.12.55-.08 1.65-.67 1.88-1.32.24-.65.24-1.21.17-1.32-.07-.12-.26-.19-.54-.33z"/>
      </svg>
      <span>Extraer Contactos</span>
      <div class="wae-dock-controls" title="Anclar posición">
        <button class="wae-dock-btn" data-dock="top" title="Mover Arriba">⬆</button>
        <button class="wae-dock-btn" data-dock="middle" title="Mover al Medio">⏺</button>
        <button class="wae-dock-btn" data-dock="bottom" title="Mover Abajo">⬇</button>
      </div>
    `;
    document.body.appendChild(trigger);
    setupDraggableLauncher(trigger);

    trigger.querySelectorAll('.wae-dock-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pos = btn.getAttribute('data-dock');
        dockButton(pos, trigger, true);
      });
    });

    // 2. Backdrop & Modal container
    const backdrop = document.createElement('div');
    backdrop.id = 'wae-backdrop';
    document.body.appendChild(backdrop);

    const modal = document.createElement('div');
    modal.id = 'wae-modal-container';
    modal.innerHTML = `
      <div class="wae-header">
        <div class="wae-header-title">
          <div class="wae-header-logo-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5.01L2 22l5.12-1.33C8.57 21.49 10.24 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.53 0-2.98-.44-4.22-1.19l-.3-.18-3.04.79.81-2.96-.2-.31C4.34 14.93 3.89 13.51 3.89 12 3.89 7.53 7.53 3.89 12 3.89s8.11 3.64 8.11 8.11-3.64 8.11-8.11 8.11z"/>
            </svg>
          </div>
          <h2>CLC Agenda</h2>
          <span class="wae-header-badge">v2.7</span>
        </div>
        <div class="wae-header-actions">
          <button class="wae-close-btn" id="wae-btn-close" title="Cerrar ventana">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="wae-tabs">
        <button class="wae-tab-btn wae-active" data-tab="groups">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Grupos</span>
        </button>
        <button class="wae-tab-btn" data-tab="labels">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          <span>Etiquetas</span>
        </button>
        <button class="wae-tab-btn" data-tab="all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          <span>Todos</span>
        </button>
        <button class="wae-tab-btn" data-tab="chats">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Chats</span>
        </button>
      </div>

      <div class="wae-body">
        <!-- TAB 1: GRUPOS (SPACIOUS CARDS GRID) -->
        <div class="wae-tab-pane wae-active" id="wae-tab-groups">
          <div class="wae-group-section-header">
            <div class="wae-fields-title-group" style="gap: 8px;">
              <span class="wae-label">👥 Grupos Detectados</span>
              <span class="wae-fields-badge" id="wae-groups-count">Cargando...</span>
              <div class="wae-pills" style="margin-left: 6px;">
                <button class="wae-group-pill-btn wae-active" data-group-filter="all">Todos</button>
                <button class="wae-group-pill-btn" data-group-filter="archived">📁 Archivados</button>
              </div>
            </div>
            <div class="wae-group-search-box">
              <svg class="wae-group-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="wae-group-search-input" placeholder="Buscar grupo por nombre...">
            </div>
          </div>

          <!-- Groups Cards Grid -->
          <div class="wae-groups-grid" id="wae-groups-container">
            <div style="color: #8696a0; font-size: 13px; padding: 10px;">Cargando grupos...</div>
          </div>
        </div>

        <!-- TAB 2: ETIQUETAS -->
        <div class="wae-tab-pane" id="wae-tab-labels">
          <div class="wae-group-section-header">
            <div class="wae-fields-title-group">
              <span class="wae-label">🏷️ Etiquetas de WhatsApp Business</span>
            </div>
          </div>
          <div class="wae-labels-grid" id="wae-labels-container">
            <div style="color: #8696a0; font-size: 13px;">Cargando etiquetas...</div>
          </div>
        </div>

        <!-- TAB 3: TODOS -->
        <div class="wae-tab-pane" id="wae-tab-all">
          <p>Extrae y filtra la base de contactos completa disponible en tu WhatsApp Web.</p>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
            <div class="wae-pills">
              <button class="wae-pill-btn wae-active" data-filter="all">👥 Todos los contactos</button>
              <button class="wae-pill-btn" data-filter="unsaved">📱 Solo NO guardados</button>
              <button class="wae-pill-btn" data-filter="saved">📇 Solo en agenda</button>
              <button class="wae-pill-btn" data-filter="archived">📁 Solo Archivados</button>
              <button class="wae-pill-btn" data-filter="business">🏢 Solo empresas</button>
            </div>
          </div>
          <button class="wae-btn-primary" id="wae-btn-extract-all">
            ⚡ Extraer Base de Contactos
          </button>
        </div>

        <!-- TAB 4: CHATS -->
        <div class="wae-tab-pane" id="wae-tab-chats">
          <p>
            Extrae el nombre y número telefónico de todas las conversaciones individuales (1 a 1) sincronizadas en tu WhatsApp Web.
          </p>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
            <div class="wae-pills">
              <button class="wae-chat-pill-btn wae-active" data-chat-filter="all">👥 Todos los chats</button>
              <button class="wae-chat-pill-btn" data-chat-filter="active">💬 Solo activos</button>
              <button class="wae-chat-pill-btn" data-chat-filter="archived">📁 Solo archivados</button>
            </div>
          </div>
          <button class="wae-btn-primary" id="wae-btn-extract-chats">
            ⚡ Extraer Contactos de Chats
          </button>
        </div>

        <!-- RESULTS SECTION (TOP-ALIGNED TOOLBAR & SPATIOUS TABLE) -->
        <div class="wae-results-section" id="wae-results-section" style="display: none;">
          <!-- 1. Stats Ribbon -->
          <div class="wae-stats-ribbon">
            <div class="wae-stat-card" style="--card-accent: var(--wae-emerald);">
              <div class="wae-stat-card-title">Total Contactos</div>
              <div class="wae-stat-card-value" id="wae-stat-total" style="color: var(--wae-emerald);">0</div>
            </div>
            <div class="wae-stat-card" style="--card-accent: var(--wae-blue);">
              <div class="wae-stat-card-title">En Agenda</div>
              <div class="wae-stat-card-value" id="wae-stat-saved" style="color: var(--wae-blue);">0</div>
            </div>
            <div class="wae-stat-card" style="--card-accent: var(--wae-amber);">
              <div class="wae-stat-card-title">No Guardados</div>
              <div class="wae-stat-card-value" id="wae-stat-unsaved" style="color: var(--wae-amber);">0</div>
            </div>
            <div class="wae-stat-card" style="--card-accent: var(--wae-rose);">
              <div class="wae-stat-card-title">Admins</div>
              <div class="wae-stat-card-value" id="wae-stat-admin" style="color: var(--wae-rose);">0</div>
            </div>
          </div>

          <!-- 2. Field Selection Toolbar (PLACED AT TOP OF TABLE!) -->
          <div class="wae-fields-section">
            <div class="wae-fields-header">
              <div class="wae-fields-title-group">
                <span class="wae-fields-title">⚙️ Columnas a Exportar</span>
                <span class="wae-fields-badge" id="wae-fields-selected-count">2 seleccionadas</span>
              </div>
              <div class="wae-fields-presets">
                <button class="wae-preset-btn wae-active" data-preset="name_phone">⭐ Nombre y Teléfono</button>
                <button class="wae-preset-btn" data-preset="phone_only">📱 Solo Teléfonos</button>
                <button class="wae-preset-btn" data-preset="name_only">👤 Solo Nombres</button>
                <button class="wae-preset-btn" data-preset="all">📊 Todos los Datos</button>
              </div>
            </div>
            <div class="wae-fields-grid" id="wae-fields-checkboxes-container">
              <!-- Rendered via JS -->
            </div>
          </div>

          <!-- 3. Header with stats and search box -->
          <div class="wae-results-header">
            <div class="wae-stats-badge" id="wae-stats-text">
              0 contactos encontrados
            </div>
            <div class="wae-search-box">
              <svg class="wae-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="wae-search-input" placeholder="Buscar por nombre o teléfono...">
            </div>
          </div>

          <!-- 4. Dynamic Live Table -->
          <div class="wae-table-wrap">
            <table class="wae-table" id="wae-main-table">
              <thead id="wae-table-head">
                <!-- Dynamically rendered based on active fields -->
              </thead>
              <tbody id="wae-table-body">
                <!-- Dynamically rendered rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="wae-footer">
        <div class="wae-export-head">
          <p class="wae-export-lead">Elige dónde queda la agenda.</p>
          <div class="wae-selection-count" id="wae-selection-count">0 seleccionados para exportar</div>
        </div>
        <div class="wae-export-grid">
          <button class="wae-export-choice wae-btn-export wae-btn-google" id="wae-btn-export-google" type="button" title="Columnas exactas para importar en Google Contacts. La agenda queda en tu cuenta de Google, no solo en WhatsApp.">
            <span class="wae-export-choice-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>CSV para Google Contacts</span>
          </button>
          <button class="wae-export-choice wae-btn-export wae-btn-vcf" id="wae-btn-export-vcf" type="button" title="Archivo vCard para la agenda del teléfono. Después se puede sincronizar con Telegram.">
            <span class="wae-export-choice-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>Guardar en el celular</span>
          </button>
          <button class="wae-export-choice wae-btn-export wae-btn-csv" id="wae-btn-export-csv" type="button" title="Columnas que elijas. Para revisar o editar en Excel o Sheets. No los carga en la agenda.">
            <span class="wae-export-choice-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>CSV para Excel</span>
          </button>
          <button class="wae-export-choice wae-btn-export wae-btn-json" id="wae-btn-export-json" type="button" title="Respaldo técnico, o para pasarlos a otra herramienta.">
            <span class="wae-export-choice-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Descargar JSON</span>
          </button>
          <button class="wae-export-choice wae-btn-export wae-btn-copy" id="wae-btn-copy" type="button" title="Para pegarlos en un documento o un mensaje.">
            <span class="wae-export-choice-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copiar</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    renderFieldCheckboxes();
    attachEventListeners();
  }

  function renderFieldCheckboxes() {
    const container = document.getElementById('wae-fields-checkboxes-container');
    if (!container) return;

    container.innerHTML = AVAILABLE_FIELDS.map(f => {
      const isChecked = selectedFields.has(f.id);
      return `
        <label class="wae-field-item ${isChecked ? 'wae-checked' : ''}" data-field="${escapeHTML(f.id)}">
          <input type="checkbox" data-field-id="${escapeHTML(f.id)}" ${isChecked ? 'checked' : ''}>
          <span>${escapeHTML(f.label)}</span>
        </label>
      `;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const fieldId = e.target.getAttribute('data-field-id');
        if (e.target.checked) {
          selectedFields.add(fieldId);
        } else {
          if (selectedFields.size > 1) {
            selectedFields.delete(fieldId);
          } else {
            e.target.checked = true;
            showToast('Debes seleccionar al menos un campo para exportar.', true);
            return;
          }
        }
        updateFieldSelectionUI();
        renderTable(); // Instant Live Real-Time Table Sync!
      });
    });

    updateFieldSelectionUI();
  }

  function updateFieldSelectionUI() {
    const container = document.getElementById('wae-fields-checkboxes-container');
    if (!container) return;

    container.querySelectorAll('.wae-field-item').forEach(item => {
      const fieldId = item.getAttribute('data-field');
      const isChecked = selectedFields.has(fieldId);
      item.classList.toggle('wae-checked', isChecked);
      const input = item.querySelector('input');
      if (input) input.checked = isChecked;
    });

    const countSpan = document.getElementById('wae-fields-selected-count');
    if (countSpan) {
      countSpan.textContent = `${selectedFields.size} seleccionada${selectedFields.size > 1 ? 's' : ''}`;
    }

    document.querySelectorAll('.wae-preset-btn').forEach(btn => {
      const preset = btn.getAttribute('data-preset');
      let matches = false;
      if (preset === 'name_phone' && selectedFields.size === 2 && selectedFields.has('name') && selectedFields.has('phone')) matches = true;
      else if (preset === 'phone_only' && selectedFields.size === 1 && selectedFields.has('phone')) matches = true;
      else if (preset === 'name_only' && selectedFields.size === 1 && selectedFields.has('name')) matches = true;
      else if (preset === 'all' && selectedFields.size === AVAILABLE_FIELDS.length) matches = true;
      btn.classList.toggle('wae-active', matches);
    });
  }

  function applyFieldPreset(preset) {
    if (preset === 'name_phone') {
      selectedFields = new Set(['name', 'phone']);
    } else if (preset === 'phone_only') {
      selectedFields = new Set(['phone']);
    } else if (preset === 'name_only') {
      selectedFields = new Set(['name']);
    } else if (preset === 'all') {
      selectedFields = new Set(AVAILABLE_FIELDS.map(f => f.id));
    }
    updateFieldSelectionUI();
    renderTable(); // Instant Live Real-Time Table Sync!
  }

  function attachEventListeners() {
    const backdrop = document.getElementById('wae-backdrop');
    const closeBtn = document.getElementById('wae-btn-close');

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    const tabBtns = document.querySelectorAll('.wae-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('wae-active'));
        btn.classList.add('wae-active');

        const tab = btn.getAttribute('data-tab');
        activeTab = tab;

        document.querySelectorAll('.wae-tab-pane').forEach(p => p.classList.remove('wae-active'));
        const pane = document.getElementById(`wae-tab-${tab}`);
        if (pane) pane.classList.add('wae-active');
      });
    });

    // Todos Tab filter pills
    const pillBtns = document.querySelectorAll('.wae-pill-btn');
    pillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        pillBtns.forEach(b => b.classList.remove('wae-active'));
        btn.classList.add('wae-active');
        currentFilter = btn.getAttribute('data-filter');
      });
    });

    // Chats Tab filter pills
    const chatPillBtns = document.querySelectorAll('.wae-chat-pill-btn');
    chatPillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chatPillBtns.forEach(b => b.classList.remove('wae-active'));
        btn.classList.add('wae-active');
        currentChatFilter = btn.getAttribute('data-chat-filter');
      });
    });

    // Groups Tab filter pills
    const groupPillBtns = document.querySelectorAll('.wae-group-pill-btn');
    groupPillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        groupPillBtns.forEach(b => b.classList.remove('wae-active'));
        btn.classList.add('wae-active');
        currentGroupFilter = btn.getAttribute('data-group-filter');
        renderGroups();
      });
    });

    document.querySelectorAll('.wae-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        applyFieldPreset(preset);
      });
    });

    document.getElementById('wae-btn-extract-all').addEventListener('click', handleExtractAllClick);
    document.getElementById('wae-btn-extract-chats').addEventListener('click', handleExtractChatsClick);

    // Group Search Input
    const groupSearchInput = document.getElementById('wae-group-search-input');
    if (groupSearchInput) {
      groupSearchInput.addEventListener('input', (e) => {
        groupSearchTerm = e.target.value.toLowerCase().trim();
        renderGroups();
      });
    }

    // Results Search Input
    document.getElementById('wae-search-input').addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      renderTable();
    });

    document.getElementById('wae-btn-export-csv').addEventListener('click', () => exportData('csv'));
    document.getElementById('wae-btn-export-vcf').addEventListener('click', () => exportData('vcf'));
    document.getElementById('wae-btn-export-google').addEventListener('click', () => exportData('google'));
    document.getElementById('wae-btn-export-json').addEventListener('click', () => exportData('json'));
    document.getElementById('wae-btn-copy').addEventListener('click', handleCopyData);
  }

  function renderGroups() {
    const container = document.getElementById('wae-groups-container');
    const countBadge = document.getElementById('wae-groups-count');
    if (!container || !overviewData) return;

    const allGroups = overviewData.groups || [];
    const filtered = allGroups.filter(g => {
      if (currentGroupFilter === 'archived' && !g.isArchived) return false;
      if (!groupSearchTerm) return true;
      return g.title.toLowerCase().includes(groupSearchTerm);
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} grupo${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="color: #8696a0; font-size: 13px; grid-column: 1 / -1; padding: 18px; text-align: center;">
          ${allGroups.length === 0 ? 'No se encontraron grupos en la base de datos local.' : 'No hay grupos que coincidan con el filtro o la búsqueda.'}
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(g => {
      const chipText = g.participantCount > 0 ? `${g.participantCount} miembros` : '⚡ Extraer miembros';
      const archiveBadge = g.isArchived ? `<span style="font-size: 10px; background: rgba(251, 191, 36, 0.15); color: var(--wae-amber); padding: 1px 6px; border-radius: 4px; font-weight: 700;">📁 Archivada</span> ` : '';
      return `
        <div class="wae-group-card" data-group-id="${escapeHTML(g.id)}">
          <div class="wae-group-card-header">
            <span class="wae-group-card-title" title="${escapeHTML(g.title)}">${archiveBadge}${escapeHTML(g.title)}</span>
            <span class="wae-group-chip">${chipText}</span>
          </div>
          <div class="wae-group-card-action">
            <span>⚡ Extraer participantes</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.wae-group-card').forEach(card => {
      card.addEventListener('click', () => {
        const groupId = card.getAttribute('data-group-id');
        handleExtractGroupById(groupId);
      });
    });
  }

  async function loadOverview() {
    try {
      const data = await sendPageRequest('GET_OVERVIEW');
      overviewData = data;

      renderGroups();

      const labelsContainer = document.getElementById('wae-labels-container');
      if (data.labels && data.labels.length > 0) {
        labelsContainer.innerHTML = data.labels.map(l => {
          const color = l.color || '#10b981';
          return `
            <div class="wae-label-card" style="--label-color: ${escapeHTML(color)};" data-label-id="${escapeHTML(l.id)}">
              <div class="wae-label-card-header">
                <span class="wae-label-card-name" title="${escapeHTML(l.name)}">${escapeHTML(l.name)}</span>
                <span class="wae-label-chip">${l.count} contactos</span>
              </div>
              <div class="wae-label-card-action">
                <span>⚡ Extraer contactos</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          `;
        }).join('');

        labelsContainer.querySelectorAll('.wae-label-card').forEach(card => {
          card.addEventListener('click', () => {
            const labelId = card.getAttribute('data-label-id');
            handleExtractLabelClick(labelId);
          });
        });
      } else {
        labelsContainer.innerHTML = `
          <div style="color: #8696a0; font-size: 13px; grid-column: 1 / -1;">
            No se detectaron etiquetas de WhatsApp Business activas.
          </div>
        `;
      }
    } catch (err) {
      console.warn('[WA Extractor] Load overview warning:', err);
    }
  }

  async function handleExtractGroupById(groupId) {
    if (!groupId) {
      showToast('Por favor selecciona un grupo válido.', true);
      return;
    }

    try {
      showToast('Extrayendo participantes del grupo...');
      const res = await sendPageRequest('EXTRACT_GROUP', { groupId });
      setExtractedResults(res.contacts, `Grupo: ${res.groupTitle}`);
    } catch (err) {
      showToast(err.message || 'Error al extraer grupo.', true);
    }
  }

  async function handleExtractLabelClick(labelId) {
    try {
      showToast('Extrayendo contactos por etiqueta...');
      const res = await sendPageRequest('EXTRACT_LABEL', { labelId });
      setExtractedResults(res.contacts, `Etiqueta: ${res.labelName}`);
    } catch (err) {
      showToast(err.message || 'Error al extraer etiqueta.', true);
    }
  }

  async function handleExtractAllClick() {
    try {
      showToast('Extrayendo base de contactos...');
      const res = await sendPageRequest('EXTRACT_ALL', { filter: currentFilter });
      setExtractedResults(res.contacts, `Contactos (${currentFilter === 'archived' ? 'Archivados' : currentFilter})`);
    } catch (err) {
      showToast(err.message || 'Error al extraer contactos.', true);
    }
  }

  async function handleExtractChatsClick() {
    try {
      showToast('Extrayendo contactos de chats...');
      const res = await sendPageRequest('EXTRACT_CHATS', { filter: currentChatFilter });
      setExtractedResults(res.contacts, `Chats (${currentChatFilter === 'archived' ? 'Archivados' : currentChatFilter})`);
    } catch (err) {
      showToast(err.message || 'Error al extraer chats.', true);
    }
  }

  function setExtractedResults(contacts, sourceDescription) {
    extractedContacts = contacts || [];
    selectedContactIds = new Set(extractedContacts.map(c => c.cleanPhone || c.id));

    const resultsSection = document.getElementById('wae-results-section');
    resultsSection.style.display = 'flex';

    const savedCount = extractedContacts.filter(c => c.isMyContact).length;
    const unsavedCount = extractedContacts.length - savedCount;
    const adminCount = extractedContacts.filter(c => c.isAdmin).length;

    document.getElementById('wae-stat-total').textContent = extractedContacts.length;
    document.getElementById('wae-stat-saved').textContent = savedCount;
    document.getElementById('wae-stat-unsaved').textContent = unsavedCount;
    document.getElementById('wae-stat-admin').textContent = adminCount;

    showToast(`✅ ${extractedContacts.length} contactos extraídos con éxito.`);
    renderTable();
  }

  /**
   * Real-Time Table Rendering: Headers and Rows sync with selectedFields
   */
  function renderTable() {
    const thead = document.getElementById('wae-table-head');
    const tbody = document.getElementById('wae-table-body');
    const statsText = document.getElementById('wae-stats-text');
    const selectionCount = document.getElementById('wae-selection-count');

    const activeFields = getActiveOrderedFields();

    // 1. Render Dynamic <thead> based on active fields
    const allSelected = extractedContacts.length > 0 && selectedContactIds.size === extractedContacts.length;
    thead.innerHTML = `
      <tr>
        <th style="width: 38px;">
          <input type="checkbox" id="wae-select-all" ${allSelected ? 'checked' : ''}>
        </th>
        ${activeFields.map(f => `<th>${escapeHTML(f.shortHeader)}</th>`).join('')}
        <th style="width: 50px; text-align: right;">Copiar</th>
      </tr>
    `;

    const selectAllInput = document.getElementById('wae-select-all');
    if (selectAllInput) {
      selectAllInput.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
          extractedContacts.forEach(c => selectedContactIds.add(c.cleanPhone || c.id));
        } else {
          selectedContactIds.clear();
        }
        renderTable();
      });
    }

    // 2. Filter data
    const filtered = extractedContacts.filter(c => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const name = (c.name || c.savedName || c.pushName || '').toLowerCase();
      const phone = (c.phone || c.cleanPhone || '').toLowerCase();
      const country = (c.country || '').toLowerCase();
      const source = (c.sourceName || '').toLowerCase();
      return name.includes(term) || phone.includes(term) || country.includes(term) || source.includes(term);
    });

    statsText.innerHTML = `Mostrando <strong>${filtered.length}</strong> de ${extractedContacts.length} contactos`;
    selectionCount.textContent = `${selectedContactIds.size} seleccionados de ${extractedContacts.length} totales`;

    const totalCols = activeFields.length + 2;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center; padding: 24px; color: #8696a0;">No hay contactos que coincidan con la búsqueda.</td></tr>`;
      return;
    }

    // 3. Render Dynamic <tbody> rows
    tbody.innerHTML = filtered.slice(0, 400).map(c => {
      const id = c.cleanPhone || c.id;
      const isSelected = selectedContactIds.has(id);
      const quickPhone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');

      return `
        <tr>
          <td>
            <input type="checkbox" class="wae-row-check" data-id="${escapeHTML(id)}" ${isSelected ? 'checked' : ''}>
          </td>
          ${activeFields.map(f => `<td>${f.renderCell(c)}</td>`).join('')}
          <td style="text-align: right;">
            <button class="wae-btn-copy-row" data-phone="${escapeHTML(quickPhone)}" title="Copiar este número">
              📋
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.wae-row-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          selectedContactIds.add(id);
        } else {
          selectedContactIds.delete(id);
        }
        selectionCount.textContent = `${selectedContactIds.size} seleccionados de ${extractedContacts.length} totales`;
        if (selectAllInput) {
          selectAllInput.checked = selectedContactIds.size === extractedContacts.length;
        }
      });
    });

    tbody.querySelectorAll('.wae-btn-copy-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = btn.getAttribute('data-phone');
        if (p) {
          navigator.clipboard.writeText(p).then(() => {
            showToast(`Número ${p} copiado.`);
          });
        }
      });
    });
  }

  function getSelectedContactsList() {
    if (selectedContactIds.size === 0) {
      return extractedContacts;
    }
    return extractedContacts.filter(c => selectedContactIds.has(c.cleanPhone || c.id));
  }

  function exportData(type) {
    const list = getSelectedContactsList();
    if (list.length === 0) {
      showToast('No hay contactos seleccionados para exportar.', true);
      return;
    }

    const fieldsArray = Array.from(selectedFields);
    const timestamp = new Date().toISOString().slice(0, 10);
    const sourcePrefix = (list[0]?.sourceName || 'whatsapp_contactos').toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (type === 'csv') {
      const csv = formatCSV(list, fieldsArray);
      downloadFile(csv, `${sourcePrefix}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
      showToast(`Listo: ${list.length} contactos. Ábrelos en Excel o en una hoja de cálculo.`);
    } else if (type === 'vcf') {
      const vcf = formatVCard(list, fieldsArray);
      downloadFile(vcf, `${sourcePrefix}_${timestamp}.vcf`, 'text/vcard;charset=utf-8;');
      showToast(`Listo: ${list.length} contactos. Importa el archivo en la agenda del celular.`);
    } else if (type === 'google') {
      const csv = formatGoogleContactsCSV(list);
      downloadFile(csv, `${sourcePrefix}_${timestamp}_google_contacts.csv`, 'text/csv;charset=utf-8;');
      showToast(`Listo: ${list.length} contactos. Importa el archivo en Google Contacts.`);
    } else if (type === 'json') {
      const json = formatJSON(list, fieldsArray);
      downloadFile(json, `${sourcePrefix}_${timestamp}.json`, 'application/json;charset=utf-8;');
      showToast(`Listo: ${list.length} contactos. El archivo JSON quedó descargado.`);
    }
  }

  function handleCopyData() {
    const list = getSelectedContactsList();
    if (list.length === 0) {
      showToast('No hay contactos seleccionados.', true);
      return;
    }

    const activeFields = getActiveOrderedFields();
    let textToCopy = '';

    if (activeFields.length === 1 && activeFields[0].id === 'phone') {
      textToCopy = list.map(c => c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '')).filter(Boolean).join(', ');
    } else if (activeFields.length === 1 && activeFields[0].id === 'cleanPhone') {
      textToCopy = list.map(c => c.cleanPhone || '').filter(Boolean).join(', ');
    } else if (activeFields.length === 1 && activeFields[0].id === 'name') {
      textToCopy = list.map(c => c.name || c.savedName || c.pushName || '').filter(Boolean).join('\n');
    } else {
      textToCopy = list.map(c => {
        return activeFields.map(f => f.getValue(c)).join(' - ');
      }).join('\n');
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`📋 ${list.length} contactos copiados al portapapeles según tu selección.`);
    }).catch(() => {
      showToast('No se pudo acceder al portapapeles.', true);
    });
  }

  window.WAExtractorUI = { init: initUI };

})();
