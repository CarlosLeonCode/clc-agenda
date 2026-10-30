// "New version" email on the install guide, on top of clc-leads' headless controller.
// The controller owns the show policy (after a download, on return visits, never
// after a signup, backs off after dismissals, honors GPC/DNT) and the request;
// this file only renders its snapshot. Config and copy come from the card's data attributes.
import { createLeadCapture } from '@carlosleoncode/lead-capture/vanilla';

const card = document.querySelector('[data-leads-card]');

if (card) {
  const { project, endpoint, lang } = card.dataset;
  const messages = JSON.parse(card.dataset.messages);
  const form = card.querySelector('[data-leads-form]');
  const formView = card.querySelector('[data-leads-form-view]');
  const email = card.querySelector('[data-leads-email]');
  const consent = card.querySelector('[data-leads-consent]');
  const consentText = card.querySelector('[data-leads-consent-text]').textContent.trim();
  const honeypot = card.querySelector('[data-leads-honeypot]');
  const submit = card.querySelector('[data-leads-submit]');
  const status = card.querySelector('[data-leads-status]');
  const fieldErrors = {
    email: card.querySelector('[data-leads-error="email"]'),
    consent: card.querySelector('[data-leads-error="consent"]')
  };
  const inputs = { email, consent };

  const controller = createLeadCapture({
    project,
    endpoint,
    source: 'install-page',
    locale: lang,
    policy: { triggerEvents: ['download'], triggerCount: 1, promptOnReturn: true }
  });

  const message = (field, code) => messages[`${field}.${code}`] || messages[code] || messages.server;
  let handledFocusRequest = 0;
  let opener = null;

  const render = () => {
    const snapshot = controller.getSnapshot();
    card.hidden = !snapshot.visible;
    formView.hidden = snapshot.step === 'success';

    const submitting = snapshot.status === 'submitting';
    submit.disabled = submitting;
    submit.textContent = submitting ? card.dataset.submitting : card.dataset.submit;

    for (const [field, el] of Object.entries(fieldErrors)) {
      const code = snapshot.errors[field];
      el.textContent = code ? message(field, code) : '';
      inputs[field].toggleAttribute('aria-invalid', Boolean(code));
    }
    status.textContent = snapshot.step === 'success'
      ? card.dataset.success
      : snapshot.errors.form ? message('form', snapshot.errors.form) : '';

    // Only a manual open moves focus; the automatic prompt never steals it
    if (snapshot.visible && snapshot.trigger === 'manual' && snapshot.focusRequest !== handledFocusRequest) {
      handledFocusRequest = snapshot.focusRequest;
      email.focus();
    }
  };

  controller.subscribe(render);
  controller.start();
  render();

  for (const link of document.querySelectorAll('[data-leads-event="download"]')) {
    link.addEventListener('click', () => controller.recordEvent('download'));
  }
  for (const button of document.querySelectorAll('[data-leads-open]')) {
    button.addEventListener('click', () => { opener = button; controller.open(); });
  }

  const close = () => {
    // Read focus before hiding the card: once hidden, focus inside it is lost
    const focusWasInside = card.contains(document.activeElement);
    controller.dismiss();
    if (opener && focusWasInside) opener.focus();
    opener = null;
  };
  card.querySelector('[data-leads-close]').addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !card.hidden) close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await controller.submitEmail({
      email: email.value,
      consent: consent.checked,
      consentText,
      honeypot: honeypot.value
    });
    // Name, role and country are optional in clc-leads; this page never asks for them
    if (result.ok) controller.skip();
  });
}
