/**
 * Landing motion with GSAP + ScrollTrigger.
 * Progressive enhancement: the page is complete without this script. Every
 * animation starts from the final, visible state (gsap.from), and nothing runs
 * when the visitor asks for reduced motion.
 *
 * Performance: only transform/opacity are animated; the hero intro waits for the
 * fonts (so the headline never re-wraps mid-animation); everything below the hero
 * is set up after first paint; infinite loops pause while offscreen.
 */

import { gsap } from 'gsap';

// ScrollTrigger only matters below the hero: load it after first paint, in its own task
let ScrollTrigger;
const loadScrollTrigger = () => import('gsap/ScrollTrigger').then((m) => {
  ScrollTrigger = m.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
});

const $ = (selector) => gsap.utils.toArray(selector);
const mm = gsap.matchMedia();

// Preloaded fonts are usually ready before first paint; never hold the intro longer than this
const FONT_WAIT_MS = 800;
const whenFontsReady = () => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, FONT_WAIT_MS))]);
const afterFirstPaint = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 200));

/** Runs an infinite tween or timeline only while its section is on screen. */
function onlyWhenVisible(animation, trigger) {
  const st = ScrollTrigger.create({
    trigger,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? animation.resume() : animation.pause())
  });
  if (!st.isActive) animation.pause();
  return animation;
}

mm.add(
  {
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 1024px)'
  },
  (context) => {
    const { motion, desktop } = context.conditions;
    // Reduced motion: leave everything in its final state
    if (!motion) return;

    // Hero entrance: built now (from-states apply immediately), played once fonts are in
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    intro
      .from('[data-line]', { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.12 })
      .from('[data-hl]', { scale: 0.6, rotate: 0, duration: 0.7, ease: 'back.out(2)', stagger: 0.1 }, '-=0.5')
      .from('[data-fade]', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4')
      .from('[data-canvas]', { y: 40, opacity: 0, duration: 0.9 }, '-=0.3')
      .from('[data-chip]', { scale: 0.7, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'back.out(2)' }, '-=0.4');
    whenFontsReady().then(() => intro.play());

    // Everything else stays off the critical path of the first paint
    // Named form: registers the setup in this context without running it yet
    context.add('setupBelowHero', () => {
      // Floating chips and shapes, slow and out of sync
      $('[data-chip]').forEach((chip, i) => {
        onlyWhenVisible(gsap.to(chip, { y: -12, duration: 2.4 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 }), '[data-canvas]');
      });
      onlyWhenVisible(gsap.to('.shape-green', { rotate: 40, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 }), '[data-canvas]');

      // Infinite marquee: the track holds two identical groups, so -50% loops seamlessly
      onlyWhenVisible(gsap.to('[data-marquee]', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 }), '.marquee');

      // Scroll reveals
      gsap.from('[data-step]', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.steps', start: 'top 80%' }
      });
      $('[data-panel], [data-reveal], [data-faq]').forEach((el) => {
        gsap.from(el, {
          y: 36,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      });

      // Gentle parallax on the product shot
      gsap.to('[data-shot]', {
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: '[data-canvas]', start: 'top bottom', end: 'bottom top', scrub: true }
      });

      if (desktop) animateCursors();
    });
    afterFirstPaint(() => loadScrollTrigger().then(() => context.setupBelowHero()));
  }
);

/** Named cursors drift around the headline; "Tú" travels to the product shot and clicks. */
function animateCursors() {
  const [ana, bruno, you] = $('[data-cursor]');
  const ripple = document.querySelector('[data-ripple]');
  const shot = document.querySelector('[data-shot]');
  if (!ana || !bruno || !you || !ripple || !shot) return;

  gsap.from([ana, bruno, you], { opacity: 0, scale: 0.6, duration: 0.5, stagger: 0.15, delay: 0.6, ease: 'back.out(2)' });

  onlyWhenVisible(gsap.to(ana, { keyframes: [{ x: 30, y: -24 }, { x: 60, y: 10 }, { x: 0, y: 0 }], duration: 7, ease: 'sine.inOut', repeat: -1 }), '.hero');
  onlyWhenVisible(gsap.to(bruno, { keyframes: [{ x: -40, y: 30 }, { x: -10, y: 60 }, { x: 0, y: 0 }], duration: 8, ease: 'sine.inOut', repeat: -1 }), '.hero');

  // "Tú" heads to the "426 sin guardar" chip area inside the shot, clicks, and returns
  const target = () => {
    const from = you.getBoundingClientRect();
    const to = shot.getBoundingClientRect();
    return { x: to.left + to.width * 0.36 - from.left, y: to.top + to.height * 0.12 - from.top };
  };
  const loop = onlyWhenVisible(gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.6 }), '.hero');
  loop
    .to(you, { x: () => target().x, y: () => target().y, duration: 1.6, ease: 'power2.inOut' })
    .to(you, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 })
    .fromTo(ripple, { scale: 0.4, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 0.7, ease: 'power2.out' }, '<')
    .to(you, { x: 0, y: 0, duration: 1.8, ease: 'power2.inOut' }, '+=0.8');
}
