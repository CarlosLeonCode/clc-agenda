/**
 * Pure view state for the overlay: source list vs. results, loading and errors
 */

export const TABS = ['groups', 'labels', 'all', 'chats'];

export function initialViewState() {
  return { view: 'source', tab: 'groups', loading: null, error: null, results: null };
}

export function reduceView(state, action) {
  switch (action.type) {
    case 'TAB':
      return { ...state, view: 'source', tab: action.tab, error: null };
    case 'REQUEST':
      return { ...state, loading: action.key, error: null };
    case 'RESULTS':
      return {
        ...state,
        view: 'results',
        loading: null,
        error: null,
        results: { title: action.title, tab: state.tab, contacts: action.contacts || [] }
      };
    case 'FAIL':
      return { ...state, loading: null, error: action.message };
    case 'BACK':
      return { ...state, view: 'source', tab: state.results ? state.results.tab : state.tab };
    default:
      return state;
  }
}

/** Labels only exist on WhatsApp Business, so the tab is hidden when there are none. */
export function visibleTabs(overview) {
  const hasLabels = Boolean(overview && overview.labels && overview.labels.length > 0);
  return TABS.filter(tab => tab !== 'labels' || hasLabels);
}

export function memberCountLabel(count) {
  if (!count) return 'Sin cargar';
  return `${count} ${count === 1 ? 'miembro' : 'miembros'}`;
}

/** Maps engine error messages to one short instruction for the user. */
export function friendlyError(message) {
  const text = String(message || '');
  if (!text) return 'No se pudo leer WhatsApp Web. Vuelve a intentarlo.';
  if (text.includes('participantes cargados')) {
    return 'Este grupo todavía no cargó sus miembros. Abre el grupo en WhatsApp y vuelve a intentarlo.';
  }
  if (text.includes('Tiempo de espera')) return 'WhatsApp Web tardó demasiado en responder. Vuelve a intentarlo.';
  return text;
}

const QUICK_FILTERS = {
  saved: c => c.isMyContact,
  unsaved: c => !c.isMyContact,
  admins: c => c.isAdmin
};

export function summarize(contacts) {
  return {
    all: contacts.length,
    saved: contacts.filter(QUICK_FILTERS.saved).length,
    unsaved: contacts.filter(QUICK_FILTERS.unsaved).length,
    admins: contacts.filter(QUICK_FILTERS.admins).length
  };
}

/** Contacts behind one of the summary counts; unknown filters mean all contacts. */
export function quickFilterContacts(contacts, filter) {
  const predicate = QUICK_FILTERS[filter];
  return predicate ? contacts.filter(predicate) : contacts;
}
