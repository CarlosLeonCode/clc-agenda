// "New version" email, on top of clc-leads' headless controller. One controller per
// page, same project everywhere, so signup and dismissal state (kept per origin in
// localStorage) carries across pages. The controller owns the show policy (after a
// value moment, on return visits, never after a signup, backs off after dismissals,
// honors GPC/DNT) and the request; this file only renders its snapshot.
// Config and copy come from the card's data attributes.
import { createLeadCapture } from '@carlosleoncode/lead-capture/vanilla';

// Value moments: a download on the install guide, or real engagement on the home page
const POLICY = { triggerEvents: ['download', 'engaged'], triggerCount: 1, promptOnReturn: true };
const ENGAGED_VIDEO_SECONDS = 20;
// timeupdate fires every ~250 ms while playing; larger gaps are seeks or stalls
const MAX_PLAYBACK_STEP = 1.5;

const card = document.querySelector('[data-leads-card]');

if (card) {
  const { project, endpoint, lang, source } = card.dataset;
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
    source,
    locale: lang,
    policy: POLICY
  });

  const message = (field, code) => messages[`${field}.${code}`] || messages[code] || messages.server;
  let handledFocusRequest = 0;
  let opener = null;
  let expanded = false;

  const render = () => {
    const snapshot = controller.getSnapshot();
    card.hidden = !snapshot.visible;
    if (!snapshot.visible) expanded = false;
    // Automatic prompts start as a one-line question; a manual open or a yes shows the form
    const compact = snapshot.trigger === 'auto' && !expanded && snapshot.step === 'email' && snapshot.status !== 'error';
    card.classList.toggle('leads-card--compact', compact);
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

  // The floating corner card must never sit on the nav, the video's pause control or
  // the hero buttons: when the bottom right would, it tries the bottom left, then the
  // top right under the nav. Phones use a dismissable bottom sheet instead, so this
  // only runs from 640 px up.
  const floating = card.dataset.leadsVariant === 'floating';
  const keepClear = floating ? (() => {
    // The buttons themselves: their row spans the full width but they sit centered
    // The card appears right when people reach the closing call to action, so it must not cover it either
    const avoid = [...document.querySelectorAll('.site-header, [data-video-toggle], .hero .cta-row > *, .final-title, .final .btn')];
    const placements = ['', 'leads-card--left', 'leads-card--top'];
    const overlaps = () => {
      const c = card.getBoundingClientRect();
      return avoid.some(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && c.left < r.right && r.left < c.right && c.top < r.bottom && r.top < c.bottom;
      });
    };
    const use = (placement) => {
      card.classList.remove('leads-card--left', 'leads-card--top');
      if (placement) card.classList.add(placement);
    };
    let queued = false;
    const place = () => {
      queued = false;
      use('');
      if (card.hidden || innerWidth < 640) return;
      // Keeps the default corner when nothing is clear (it is dismissable)
      use(placements.find(p => (use(p), !overlaps())) ?? '');
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(place); } };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return place;
  })() : () => {};

  card.querySelector('[data-leads-expand]').addEventListener('click', () => {
    expanded = true;
    render();
    keepClear();
    email.focus();
  });

  controller.subscribe(() => { render(); keepClear(); });
  controller.start();
  render();

  for (const link of document.querySelectorAll('[data-leads-event="download"]')) {
    link.addEventListener('click', () => controller.recordEvent('download'));
  }

  // Home page engagement, recorded at most once per page load: 20 s of the promo
  // video actually played, or the visitor reaching the final call to action
  let engaged = false;
  const markEngaged = () => {
    if (engaged) return;
    engaged = true;
    controller.recordEvent('engaged');
  };

  const video = document.querySelector('[data-video]');
  if (video) {
    let watched = 0;
    let last = null;
    video.addEventListener('timeupdate', () => {
      if (engaged) return;
      const now = video.currentTime;
      // Only small forward steps while playing count; seeking jumps do not
      if (last !== null && !video.seeking && !video.paused) {
        const step = now - last;
        if (step > 0 && step <= MAX_PLAYBACK_STEP) watched += step;
      }
      last = now;
      if (watched >= ENGAGED_VIDEO_SECONDS) markEngaged();
    });
    // Looping restarts at 0 and seeks jump: start measuring again from the new position
    video.addEventListener('seeking', () => { last = null; });
  }

  const finalCta = document.querySelector('[data-leads-engage]');
  if (finalCta && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        markEngaged();
      }
    }, { threshold: 0.5 });
    observer.observe(finalCta);
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
