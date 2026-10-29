/**
 * CLC Agenda - Floating UI Overlay Manager
 * Renders inside a Shadow DOM root so WhatsApp's CSS and ours never collide.
 * Two views, never both: choose a source, then review and save the contacts.
 */

import styles from './overlay.css';
import { FIELD_DEFINITIONS } from '../core/fields.js';
import { exportToCSV } from '../exporters/csv.js';
import { exportToVCard } from '../exporters/vcard.js';
import { exportToGoogleContactsCSV } from '../exporters/google-contacts.js';
import { exportToJSON } from '../exporters/json.js';
import { clampLauncherPosition } from './launcher-position.js';
import { nextTabIndex, nextFocusIndex } from './a11y.js';
import { initialViewState, reduceView, visibleTabs, memberCountLabel, friendlyError } from './view-state.js';
import { PAGE_SIZE, contactKey, filterContacts, getExportList, setSelectionFor, areAllSelected, paginate } from './selection.js';

let host = null;
let shadow = null;
let lastFocused = null;
let view = initialViewState();
let overviewData = null;
let overviewFailed = false;
let groupArchivedOnly = false;
let groupSearchTerm = '';
let lastRequestKey = null;
const paneScroll = {};
let extractedContacts = [];
let selectedContactIds = new Set();
let searchTerm = '';
let visibleLimit = PAGE_SIZE;

const ICONS = {
  chevron: '<svg class="wae-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  back: '<svg class="wae-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  search: '<svg class="wae-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  close: '<svg class="wae-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  copy: '<svg class="wae-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  logo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5.01L2 22l5.12-1.33C8.57 21.49 10.24 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.53 0-2.98-.44-4.22-1.19l-.3-.18-3.04.79.81-2.96-.2-.31C4.34 14.93 3.89 13.51 3.89 12 3.89 7.53 7.53 3.89 12 3.89s8.11 3.64 8.11 8.11-3.64 8.11-8.11 8.11z"/></svg>'
};

const TAB_LABELS = { groups: 'Grupos', labels: 'Etiquetas', all: 'Contactos', chats: 'Chats' };

// Dynamic table cell renderers per field
const CELL_RENDERERS = {
  name: (c) => {
    const name = c.name || c.savedName || c.pushName;
    if (!name) return '<span class="wae-cell-empty">Sin nombre</span>';
    return `<span class="wae-cell-name">${escapeHTML(name)}</span>`;
  },
  phone: (c) => {
    const phone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '-');
    return `<span class="wae-cell-phone">${escapeHTML(phone)}</span>`;
  },
  cleanPhone: (c) => {
    const num = c.cleanPhone || '-';
    return `<span class="wae-cell-mono">${escapeHTML(num)}</span>`;
  },
  isMyContact: (c) => {
    return `<span class="wae-tag ${c.isMyContact ? 'wae-tag-yes' : 'wae-tag-no'}">${c.isMyContact ? 'En agenda' : 'No guardado'}</span>`;
  },
  isAdmin: (c) => {
    if (c.isAdmin) return '<span class="wae-tag wae-tag-admin">Admin</span>';
    return '<span class="wae-cell-muted">Miembro</span>';
  },
  isBusiness: (c) => {
    if (c.isBusiness) return '<span class="wae-tag wae-tag-yes">Empresa</span>';
    return '<span class="wae-cell-muted">Personal</span>';
  },
  country: (c) => {
    return `<span>${escapeHTML(c.country || 'Desconocido')}</span>`;
  },
  sourceName: (c) => {
    return `<span class="wae-cell-muted">${escapeHTML(c.sourceName || c.source || '-')}</span>`;
  },
  id: (c) => {
    return `<span class="wae-cell-mono wae-cell-muted">${escapeHTML(c.id || '-')}</span>`;
  }
};

const AVAILABLE_FIELDS = FIELD_DEFINITIONS.map(f => ({ ...f, renderCell: CELL_RENDERERS[f.id] }));

let selectedFields = new Set(['name', 'phone']);

function byId(id) {
  return shadow ? shadow.getElementById(id) : null;
}

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
  const toast = byId('wae-toast');
  if (!toast) return;
  toast.classList.toggle('wae-toast-error', isError);
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
  shadow.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

function getActiveOrderedFields() {
  return AVAILABLE_FIELDS.filter(f => selectedFields.has(f.id));
}

const CHAT_ICON = '<path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5.01L2 22l5.12-1.33C8.57 21.49 10.24 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.53 0-2.98-.44-4.22-1.19l-.3-.18-3.04.79.81-2.96-.2-.31C4.34 14.93 3.89 13.51 3.89 12 3.89 7.53 7.53 3.89 12 3.89s8.11 3.64 8.11 8.11-3.64 8.11-8.11 8.11z"/>';
const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Draggable & dockable launcher (pointer events cover mouse, pen and touch)
 */
function setupDraggableLauncher(launcher, btn) {
  try {
    const savedPos = localStorage.getItem('wae_btn_pos');
    if (savedPos) {
      const parsed = JSON.parse(savedPos);
      if (parsed.preset === 'top' || parsed.preset === 'middle' || parsed.preset === 'bottom') {
        dockButton(parsed.preset, launcher, false);
      } else if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
        const position = clampLauncherPosition(
          parsed.x,
          parsed.y,
          launcher.offsetWidth,
          launcher.offsetHeight,
          window.innerWidth,
          window.innerHeight
        );
        moveLauncher(launcher, position.x, position.y);
      }
    }
  } catch (e) {}

  const dragThreshold = 5;
  let drag = null;
  let suppressClick = false;

  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    drag = { startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top, moved: false };
    btn.setPointerCapture(e.pointerId);
  });

  btn.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) <= dragThreshold && Math.abs(dy) <= dragThreshold) return;
    drag.moved = true;
    const position = clampLauncherPosition(
      drag.origLeft + dx,
      drag.origTop + dy,
      launcher.offsetWidth,
      launcher.offsetHeight,
      window.innerWidth,
      window.innerHeight
    );
    moveLauncher(launcher, position.x, position.y);
  });

  btn.addEventListener('pointerup', () => {
    if (!drag) return;
    suppressClick = drag.moved;
    if (drag.moved) {
      const rect = launcher.getBoundingClientRect();
      try {
        localStorage.setItem('wae_btn_pos', JSON.stringify({ x: rect.left, y: rect.top, preset: 'custom' }));
      } catch (e) {}
    }
    drag = null;
  });

  btn.addEventListener('pointercancel', () => { drag = null; });

  // Keyboard activation and plain clicks open the dialog; a drag does not
  btn.addEventListener('click', () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    openModal();
  });
}

function moveLauncher(launcher, x, y) {
  launcher.style.left = `${x}px`;
  launcher.style.top = `${y}px`;
  launcher.style.right = 'auto';
  launcher.style.bottom = 'auto';
  launcher.style.transform = 'none';
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
      showToast(`Botón movido ${position === 'top' ? 'arriba' : position === 'middle' ? 'al medio' : 'abajo'}`);
    } catch (e) {}
  }
}

function isModalOpen() {
  const modal = byId('wae-modal-container');
  return Boolean(modal && modal.classList.contains('wae-active'));
}

function openModal() {
  const modal = byId('wae-modal-container');
  const backdrop = byId('wae-backdrop');
  if (!modal || !backdrop) return false;
  if (isModalOpen()) return true;

  lastFocused = shadow.activeElement || byId('wae-launcher-btn');
  modal.classList.add('wae-active');
  backdrop.classList.add('wae-active');
  modal.inert = false;
  const focusTarget = view.view === 'results'
    ? byId('wae-btn-back')
    : modal.querySelector('[role="tab"][aria-selected="true"]');
  if (focusTarget) focusTarget.focus();
  loadOverview();
  return true;
}

function closeModal() {
  const modal = byId('wae-modal-container');
  const backdrop = byId('wae-backdrop');
  if (!modal || !backdrop) return;
  modal.classList.remove('wae-active');
  backdrop.classList.remove('wae-active');
  modal.inert = true;
  const returnTo = lastFocused && lastFocused.isConnected ? lastFocused : byId('wae-launcher-btn');
  if (returnTo) returnTo.focus();
}

function handleModalKeydown(e) {
  if (!isModalOpen()) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    const modal = byId('wae-modal-container');
    const focusables = Array.from(modal.querySelectorAll(FOCUSABLE))
      .filter(el => !el.disabled && el.getClientRects().length > 0);
    const next = nextFocusIndex(focusables.indexOf(shadow.activeElement), focusables.length, e.shiftKey);
    if (next !== null) {
      e.preventDefault();
      focusables[next].focus();
    }
  }
}

/**
 * UI Initialization
 */
function initUI() {
  if (host) return;

  host = document.createElement('div');
  host.id = 'clc-agenda-root';
  shadow = host.attachShadow({ mode: 'open' });
  document.body.appendChild(host);

  const style = document.createElement('style');
  style.textContent = styles;
  shadow.appendChild(style);

  // Keystrokes typed in the overlay must not reach WhatsApp's shortcuts
  for (const type of ['keydown', 'keyup', 'keypress']) {
    host.addEventListener(type, (e) => e.stopPropagation());
  }
  shadow.addEventListener('keydown', handleModalKeydown);

  // 1. Floating launcher
  const launcher = document.createElement('div');
  launcher.className = 'wae-launcher';
  launcher.id = 'wae-launcher';
  launcher.innerHTML = `
    <button type="button" class="wae-launcher-btn" id="wae-launcher-btn" aria-haspopup="dialog" aria-controls="wae-modal-container" aria-label="Extraer contactos con CLC Agenda">
      <svg viewBox="0 0 24 24" aria-hidden="true">${CHAT_ICON}</svg>
      <span>Extraer contactos</span>
    </button>
    <div class="wae-dock-controls" role="group" aria-label="Mover el botón">
      <button type="button" class="wae-dock-btn" data-dock="top" aria-label="Mover arriba" title="Mover arriba"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
      <button type="button" class="wae-dock-btn" data-dock="middle" aria-label="Mover al medio" title="Mover al medio"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg></button>
      <button type="button" class="wae-dock-btn" data-dock="bottom" aria-label="Mover abajo" title="Mover abajo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    </div>
  `;
  shadow.appendChild(launcher);
  setupDraggableLauncher(launcher, byId('wae-launcher-btn'));

  launcher.querySelectorAll('.wae-dock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dockButton(btn.getAttribute('data-dock'), launcher, true);
    });
  });

  // 2. Backdrop, dialog and live region for toasts
  const backdrop = document.createElement('div');
  backdrop.id = 'wae-backdrop';
  shadow.appendChild(backdrop);

  const toast = document.createElement('div');
  toast.id = 'wae-toast';
  toast.className = 'wae-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  shadow.appendChild(toast);

  const modal = document.createElement('div');
  modal.id = 'wae-modal-container';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'wae-title');
  modal.inert = true;
  modal.innerHTML = `
    <header class="wae-header">
      <h2 class="wae-title" id="wae-title"><span class="wae-logo">${ICONS.logo}</span>CLC Agenda</h2>
      <button type="button" class="wae-icon-btn" id="wae-btn-close" aria-label="Cerrar" title="Cerrar">${ICONS.close}</button>
    </header>

    <div class="wae-view" id="wae-view-source">
      <div class="wae-tabs" role="tablist" aria-label="Origen de los contactos">
        ${Object.entries(TAB_LABELS).map(([tab, label]) => `
          <button type="button" class="wae-tab" role="tab" id="wae-tabbtn-${tab}" data-tab="${tab}" aria-controls="wae-tab-${tab}" aria-selected="false" tabindex="-1">${label}</button>
        `).join('')}
      </div>

      <div class="wae-alert" id="wae-error" role="alert" hidden></div>

      <section class="wae-pane" id="wae-tab-groups" role="tabpanel" aria-labelledby="wae-tabbtn-groups">
        <div class="wae-toolbar">
          <label class="wae-search">
            ${ICONS.search}
            <input type="search" id="wae-group-search-input" placeholder="Buscar grupo" aria-label="Buscar grupo" autocomplete="off">
          </label>
          <button type="button" class="wae-toggle" id="wae-btn-archived" aria-pressed="false">Archivados</button>
        </div>
        <ul class="wae-list" id="wae-groups-container" aria-label="Grupos"></ul>
      </section>

      <section class="wae-pane" id="wae-tab-labels" role="tabpanel" aria-labelledby="wae-tabbtn-labels">
        <ul class="wae-list" id="wae-labels-container" aria-label="Etiquetas"></ul>
      </section>

      <section class="wae-pane wae-pane-form" id="wae-tab-all" role="tabpanel" aria-labelledby="wae-tabbtn-all">
        <p class="wae-hint">Todos los contactos que WhatsApp Web tiene en este navegador.</p>
        <label class="wae-field" for="wae-all-filter">Mostrar</label>
        <select class="wae-select" id="wae-all-filter">
          <option value="all">Todos los contactos</option>
          <option value="unsaved">Solo sin guardar</option>
          <option value="saved">Solo en agenda</option>
          <option value="archived">Solo de chats archivados</option>
          <option value="business">Solo cuentas de empresa</option>
        </select>
        <button type="button" class="wae-btn wae-btn-primary" id="wae-btn-extract-all" data-request="all">Ver contactos</button>
      </section>

      <section class="wae-pane wae-pane-form" id="wae-tab-chats" role="tabpanel" aria-labelledby="wae-tabbtn-chats">
        <p class="wae-hint">Las personas con las que tienes chats individuales.</p>
        <label class="wae-field" for="wae-chat-filter">Mostrar</label>
        <select class="wae-select" id="wae-chat-filter">
          <option value="all">Todos los chats</option>
          <option value="active">Solo chats activos</option>
          <option value="archived">Solo chats archivados</option>
        </select>
        <button type="button" class="wae-btn wae-btn-primary" id="wae-btn-extract-chats" data-request="chats">Ver contactos</button>
      </section>
    </div>

    <div class="wae-view" id="wae-view-results" hidden>
      <div class="wae-results-top">
        <button type="button" class="wae-back" id="wae-btn-back" aria-label="Volver">${ICONS.back}<span id="wae-results-title"></span></button>
        <span class="wae-results-count" id="wae-results-count"></span>
      </div>

      <div class="wae-results-body">
        <div class="wae-stats-ribbon">
          <div class="wae-stat-card"><span class="wae-stat-card-title">En agenda</span><span class="wae-stat-card-value" id="wae-stat-saved">0</span></div>
          <div class="wae-stat-card"><span class="wae-stat-card-title">Sin guardar</span><span class="wae-stat-card-value" id="wae-stat-unsaved">0</span></div>
          <div class="wae-stat-card"><span class="wae-stat-card-title">Admins</span><span class="wae-stat-card-value" id="wae-stat-admin">0</span></div>
        </div>

        <div class="wae-fields-section">
          <div class="wae-fields-header">
            <span class="wae-fields-title">Columnas <span id="wae-fields-selected-count"></span></span>
            <div class="wae-fields-presets">
              <button type="button" class="wae-preset-btn" data-preset="name_phone">Nombre y teléfono</button>
              <button type="button" class="wae-preset-btn" data-preset="phone_only">Solo teléfonos</button>
              <button type="button" class="wae-preset-btn" data-preset="name_only">Solo nombres</button>
              <button type="button" class="wae-preset-btn" data-preset="all">Todos los datos</button>
            </div>
          </div>
          <div class="wae-fields-grid" id="wae-fields-checkboxes-container"></div>
        </div>

        <div class="wae-toolbar">
          <label class="wae-search">
            ${ICONS.search}
            <input type="search" id="wae-search-input" placeholder="Buscar nombre o número" aria-label="Buscar contacto" autocomplete="off">
          </label>
          <span class="wae-stats-badge" id="wae-stats-text"></span>
        </div>

        <div class="wae-table-wrap">
          <table class="wae-table" id="wae-main-table">
            <thead id="wae-table-head"></thead>
            <tbody id="wae-table-body"></tbody>
          </table>
        </div>
      </div>

      <footer class="wae-footer">
        <span class="wae-selection-count" id="wae-selection-count"></span>
        <div class="wae-export-grid">
          <button type="button" class="wae-btn" id="wae-btn-copy">Copiar</button>
          <button type="button" class="wae-btn" id="wae-btn-export-json">JSON</button>
          <button type="button" class="wae-btn" id="wae-btn-export-csv">Excel (CSV)</button>
          <button type="button" class="wae-btn" id="wae-btn-export-vcf">Celular (.vcf)</button>
          <button type="button" class="wae-btn wae-btn-primary" id="wae-btn-export-google">Google Contacts</button>
        </div>
      </footer>
    </div>
  `;
  shadow.appendChild(modal);

  renderFieldCheckboxes();
  attachEventListeners();
  renderView();
}

function dispatch(action) {
  view = reduceView(view, action);
  renderView();
}

function getTabButtons() {
  return Array.from(shadow.querySelectorAll('.wae-tab')).filter(btn => !btn.hidden);
}

function attachEventListeners() {
  byId('wae-btn-close').addEventListener('click', closeModal);
  byId('wae-backdrop').addEventListener('click', closeModal);

  shadow.querySelectorAll('.wae-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    btn.addEventListener('keydown', (e) => {
      const tabs = getTabButtons();
      const next = nextTabIndex(tabs.indexOf(btn), e.key, tabs.length);
      if (next === null) return;
      e.preventDefault();
      switchTab(tabs[next].getAttribute('data-tab'));
      tabs[next].focus();
    });
  });

  byId('wae-btn-archived').addEventListener('click', (e) => {
    groupArchivedOnly = !groupArchivedOnly;
    e.currentTarget.setAttribute('aria-pressed', String(groupArchivedOnly));
    renderGroups();
  });

  byId('wae-group-search-input').addEventListener('input', (e) => {
    groupSearchTerm = e.target.value.toLowerCase().trim();
    renderGroups();
  });

  byId('wae-groups-container').addEventListener('click', (e) => {
    const row = e.target.closest('[data-group-id]');
    if (row) runExtraction(`group:${row.dataset.groupId}`, 'EXTRACT_GROUP', { groupId: row.dataset.groupId }, res => res.groupTitle);
    if (e.target.closest('#wae-btn-retry')) loadOverview();
  });

  byId('wae-labels-container').addEventListener('click', (e) => {
    const row = e.target.closest('[data-label-id]');
    if (row) runExtraction(`label:${row.dataset.labelId}`, 'EXTRACT_LABEL', { labelId: row.dataset.labelId }, res => res.labelName);
  });

  byId('wae-btn-extract-all').addEventListener('click', () => {
    const select = byId('wae-all-filter');
    runExtraction('all', 'EXTRACT_ALL', { filter: select.value }, () => select.selectedOptions[0].textContent);
  });

  byId('wae-btn-extract-chats').addEventListener('click', () => {
    const select = byId('wae-chat-filter');
    runExtraction('chats', 'EXTRACT_CHATS', { filter: select.value }, () => select.selectedOptions[0].textContent);
  });

  byId('wae-btn-back').addEventListener('click', () => {
    dispatch({ type: 'BACK' });
    const row = lastRequestKey && shadow.querySelector(`[data-request="${CSS.escape(lastRequestKey)}"]`);
    (row || shadow.querySelector('.wae-tab[aria-selected="true"]')).focus();
  });

  shadow.querySelectorAll('.wae-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFieldPreset(btn.getAttribute('data-preset')));
  });

  byId('wae-search-input').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    visibleLimit = PAGE_SIZE;
    renderTable();
  });

  byId('wae-btn-export-csv').addEventListener('click', () => exportData('csv'));
  byId('wae-btn-export-vcf').addEventListener('click', () => exportData('vcf'));
  byId('wae-btn-export-google').addEventListener('click', () => exportData('google'));
  byId('wae-btn-export-json').addEventListener('click', () => exportData('json'));
  byId('wae-btn-copy').addEventListener('click', handleCopyData);
}

function switchTab(tab) {
  const current = byId(`wae-tab-${view.tab}`);
  if (current) paneScroll[view.tab] = current.scrollTop;
  dispatch({ type: 'TAB', tab });
}

/**
 * Applies the view state to the DOM: which view, which tab, what is loading
 */
function renderView() {
  const isResults = view.view === 'results';
  const sourceView = byId('wae-view-source');
  const resultsView = byId('wae-view-results');
  sourceView.hidden = isResults;
  resultsView.hidden = !isResults;

  const tabs = visibleTabs(overviewData);
  if (!tabs.includes(view.tab)) {
    view = reduceView(view, { type: 'TAB', tab: 'groups' });
  }

  shadow.querySelectorAll('.wae-tab').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    const isActive = tab === view.tab;
    btn.hidden = !tabs.includes(tab);
    btn.setAttribute('aria-selected', String(isActive));
    btn.tabIndex = isActive ? 0 : -1;
  });
  shadow.querySelectorAll('.wae-pane').forEach(pane => {
    pane.hidden = pane.id !== `wae-tab-${view.tab}`;
  });
  const activePane = byId(`wae-tab-${view.tab}`);
  if (!isResults && activePane && paneScroll[view.tab] !== undefined) {
    activePane.scrollTop = paneScroll[view.tab];
  }

  const busy = Boolean(view.loading);
  sourceView.setAttribute('aria-busy', String(busy));
  shadow.querySelectorAll('[data-request]').forEach(el => {
    const isLoading = el.getAttribute('data-request') === view.loading;
    el.disabled = busy;
    el.classList.toggle('wae-is-loading', isLoading);
    if (el.classList.contains('wae-btn')) {
      el.textContent = isLoading ? 'Leyendo contactos…' : 'Ver contactos';
    }
  });

  const alert = byId('wae-error');
  alert.hidden = !view.error;
  alert.textContent = view.error || '';
}

function renderGroups() {
  const container = byId('wae-groups-container');
  if (!container) return;

  if (overviewFailed) {
    container.innerHTML = `
      <li class="wae-empty">
        <p>No se pudo leer WhatsApp Web.</p>
        <button type="button" class="wae-btn" id="wae-btn-retry">Reintentar</button>
      </li>
    `;
    return;
  }

  if (!overviewData) {
    container.innerHTML = Array.from({ length: 6 }, () => '<li class="wae-skeleton" aria-hidden="true"></li>').join('');
    return;
  }

  const allGroups = overviewData.groups || [];
  const filtered = allGroups.filter(g => {
    if (groupArchivedOnly && !g.isArchived) return false;
    if (!groupSearchTerm) return true;
    return g.title.toLowerCase().includes(groupSearchTerm);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <li class="wae-empty">
        <p>${allGroups.length === 0 ? 'No encontramos grupos. Abre WhatsApp Web, espera a que carguen tus chats y vuelve a abrir CLC Agenda.' : 'Ningún grupo coincide con la búsqueda.'}</p>
      </li>
    `;
    return;
  }

  container.innerHTML = filtered.map(g => {
    const key = `group:${g.id}`;
    return `
      <li>
        <button type="button" class="wae-row" data-group-id="${escapeHTML(g.id)}" data-request="${escapeHTML(key)}">
          <span class="wae-row-title">${escapeHTML(g.title)}</span>
          ${g.isArchived ? '<span class="wae-chip">Archivado</span>' : ''}
          <span class="wae-row-meta">${memberCountLabel(g.participantCount)}</span>
          <span class="wae-row-end">${ICONS.chevron}<span class="wae-spinner" aria-hidden="true"></span></span>
        </button>
      </li>
    `;
  }).join('');
  renderView();
}

function renderLabels() {
  const container = byId('wae-labels-container');
  if (!container || !overviewData) return;
  const labels = overviewData.labels || [];

  container.innerHTML = labels.map(l => {
    const key = `label:${l.id}`;
    return `
      <li>
        <button type="button" class="wae-row" data-label-id="${escapeHTML(l.id)}" data-request="${escapeHTML(key)}">
          <span class="wae-dot" aria-hidden="true"></span>
          <span class="wae-row-title">${escapeHTML(l.name)}</span>
          <span class="wae-row-meta">${l.count} ${l.count === 1 ? 'contacto' : 'contactos'}</span>
          <span class="wae-row-end">${ICONS.chevron}<span class="wae-spinner" aria-hidden="true"></span></span>
        </button>
      </li>
    `;
  }).join('');

  container.querySelectorAll('.wae-row').forEach((row, index) => {
    // Label colors come from WhatsApp data, so they are set as a property, not markup
    const color = labels[index].color;
    if (color) row.style.setProperty('--label-color', String(color));
  });
  renderView();
}

async function loadOverview() {
  overviewFailed = false;
  if (!overviewData) renderGroups();
  try {
    overviewData = await sendPageRequest('GET_OVERVIEW');
  } catch (err) {
    console.warn('[WA Extractor] Load overview warning:', err);
    overviewFailed = true;
  }
  renderGroups();
  renderLabels();
  renderView();
}

async function runExtraction(key, action, payload, titleOf) {
  if (view.loading) return;
  lastRequestKey = key;
  const pane = byId(`wae-tab-${view.tab}`);
  if (pane) paneScroll[view.tab] = pane.scrollTop;
  dispatch({ type: 'REQUEST', key });
  try {
    const res = await sendPageRequest(action, payload);
    setExtractedResults(res.contacts, titleOf(res));
  } catch (err) {
    dispatch({ type: 'FAIL', message: friendlyError(err.message) });
  }
}

function setExtractedResults(contacts, title) {
  extractedContacts = contacts || [];
  selectedContactIds = new Set(extractedContacts.map(contactKey));
  searchTerm = '';
  visibleLimit = PAGE_SIZE;
  byId('wae-search-input').value = '';

  const savedCount = extractedContacts.filter(c => c.isMyContact).length;
  byId('wae-results-title').textContent = title || 'Contactos';
  byId('wae-results-count').textContent = `${extractedContacts.length} ${extractedContacts.length === 1 ? 'contacto' : 'contactos'}`;
  byId('wae-stat-saved').textContent = savedCount;
  byId('wae-stat-unsaved').textContent = extractedContacts.length - savedCount;
  byId('wae-stat-admin').textContent = extractedContacts.filter(c => c.isAdmin).length;

  dispatch({ type: 'RESULTS', title, contacts: extractedContacts });
  renderTable();
  byId('wae-btn-back').focus();
}

function renderFieldCheckboxes() {
  const container = byId('wae-fields-checkboxes-container');
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
          showToast('Deja al menos una columna.', true);
          return;
        }
      }
      updateFieldSelectionUI();
      renderTable();
    });
  });

  updateFieldSelectionUI();
}

function updateFieldSelectionUI() {
  const container = byId('wae-fields-checkboxes-container');
  if (!container) return;

  container.querySelectorAll('.wae-field-item').forEach(item => {
    const fieldId = item.getAttribute('data-field');
    const isChecked = selectedFields.has(fieldId);
    item.classList.toggle('wae-checked', isChecked);
    const input = item.querySelector('input');
    if (input) input.checked = isChecked;
  });

  const countSpan = byId('wae-fields-selected-count');
  if (countSpan) {
    countSpan.textContent = `(${selectedFields.size})`;
  }

  shadow.querySelectorAll('.wae-preset-btn').forEach(btn => {
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
  renderTable();
}

/**
 * Real-Time Table Rendering: Headers and Rows sync with selectedFields
 */
function renderTable() {
  const thead = byId('wae-table-head');
  const tbody = byId('wae-table-body');
  const statsText = byId('wae-stats-text');
  const selectionCount = byId('wae-selection-count');

  const activeFields = getActiveOrderedFields();

  // 1. Filter data; select-all acts on every contact matching the search
  const filtered = filterContacts(extractedContacts, searchTerm);
  const { rows, hiddenCount } = paginate(filtered, visibleLimit);

  // 2. Render Dynamic <thead> based on active fields
  const allSelected = areAllSelected(selectedContactIds, filtered);
  thead.innerHTML = `
    <tr>
      <th class="wae-col-check">
        <input type="checkbox" id="wae-select-all" aria-label="Seleccionar todos los contactos visibles" ${allSelected ? 'checked' : ''}>
      </th>
      ${activeFields.map(f => `<th>${escapeHTML(f.shortHeader)}</th>`).join('')}
      <th class="wae-col-action"><span class="wae-sr-only">Copiar</span></th>
    </tr>
  `;

  const selectAllInput = byId('wae-select-all');
  if (selectAllInput) {
    selectAllInput.addEventListener('change', (e) => {
      selectedContactIds = setSelectionFor(selectedContactIds, filtered, e.target.checked);
      renderTable();
    });
  }

  statsText.textContent = rows.length < extractedContacts.length ? `${rows.length} de ${extractedContacts.length}` : '';
  selectionCount.textContent = `${selectedContactIds.size} seleccionados`;

  const totalCols = activeFields.length + 2;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${totalCols}" class="wae-empty">No hay contactos que coincidan con la búsqueda.</td></tr>`;
    return;
  }

  // 3. Render Dynamic <tbody> rows
  const loadMoreRow = hiddenCount > 0
    ? `<tr><td colspan="${totalCols}" class="wae-load-more"><button type="button" class="wae-btn" id="wae-btn-load-more">Mostrar ${Math.min(PAGE_SIZE, hiddenCount)} más (quedan ${hiddenCount})</button></td></tr>`
    : '';

  tbody.innerHTML = rows.map(c => {
    const id = contactKey(c);
    const isSelected = selectedContactIds.has(id);
    const quickPhone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');

    return `
      <tr>
        <td>
          <input type="checkbox" class="wae-row-check" data-id="${escapeHTML(id)}" aria-label="Seleccionar ${escapeHTML(c.name || c.savedName || c.pushName || quickPhone)}" ${isSelected ? 'checked' : ''}>
        </td>
        ${activeFields.map(f => `<td>${f.renderCell(c)}</td>`).join('')}
        <td class="wae-col-action">
          <button type="button" class="wae-icon-btn wae-btn-copy-row" data-phone="${escapeHTML(quickPhone)}" aria-label="Copiar ${escapeHTML(quickPhone)}" title="Copiar número">${ICONS.copy}</button>
        </td>
      </tr>
    `;
  }).join('') + loadMoreRow;

  const loadMoreBtn = byId('wae-btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleLimit += PAGE_SIZE;
      renderTable();
    });
  }

  tbody.querySelectorAll('.wae-row-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      if (e.target.checked) {
        selectedContactIds.add(id);
      } else {
        selectedContactIds.delete(id);
      }
      selectionCount.textContent = `${selectedContactIds.size} seleccionados`;
      if (selectAllInput) {
        selectAllInput.checked = areAllSelected(selectedContactIds, filtered);
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
  return getExportList(extractedContacts, selectedContactIds);
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
    const csv = exportToCSV(list, { fields: fieldsArray });
    downloadFile(csv, `${sourcePrefix}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
    showToast(`Listo: ${list.length} contactos. Ábrelos en Excel o en una hoja de cálculo.`);
  } else if (type === 'vcf') {
    const vcf = exportToVCard(list, { fields: fieldsArray });
    downloadFile(vcf, `${sourcePrefix}_${timestamp}.vcf`, 'text/vcard;charset=utf-8;');
    showToast(`Listo: ${list.length} contactos. Importa el archivo en la agenda del celular.`);
  } else if (type === 'google') {
    const csv = exportToGoogleContactsCSV(list);
    downloadFile(csv, `${sourcePrefix}_${timestamp}_google_contacts.csv`, 'text/csv;charset=utf-8;');
    showToast(`Listo: ${list.length} contactos. Importa el archivo en Google Contacts.`);
  } else if (type === 'json') {
    const json = exportToJSON(list, { fields: fieldsArray });
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
    showToast(`${list.length} contactos copiados`);
  }).catch(() => {
    showToast('No se pudo acceder al portapapeles.', true);
  });
}

window.WAExtractorUI = {
  init: initUI,
  open: () => Boolean(host) && openModal()
};
