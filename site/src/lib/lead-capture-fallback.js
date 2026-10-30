// Stand-in for @carlosleoncode/lead-capture/vanilla when leads are off (see
// astro.config.mjs). Same controller shape, but it never shows, sends or stores anything.
const SNAPSHOT = Object.freeze({
  visible: false,
  step: 'email',
  trigger: null,
  status: 'idle',
  errors: Object.freeze({}),
  focusRequest: 0
});
const NOT_SENT = Object.freeze({ ok: false, errors: Object.freeze({}) });
const noop = () => {};

export function createLeadCapture({ project = '' } = {}) {
  return {
    project,
    getSnapshot: () => SNAPSHOT,
    subscribe: () => noop,
    start: noop,
    stop: noop,
    recordEvent: noop,
    recordPageView: noop,
    canAutoPrompt: () => ({ show: false, reason: 'trigger' }),
    open: noop,
    dismiss: noop,
    submit: async () => NOT_SENT,
    submitEmail: async () => NOT_SENT,
    submitDetails: async () => NOT_SENT,
    skip: noop
  };
}
