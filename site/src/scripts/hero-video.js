// Hero video: plays only while visible and when motion is allowed, with a pause control.
// Without JS the video keeps its native controls and never autoplays.

const video = document.querySelector('[data-video]');
const toggle = document.querySelector('[data-video-toggle]');

if (video && toggle) {
  const label = toggle.querySelector('[data-video-label]');
  const pauseIcon = toggle.querySelector('[data-icon="pause"]');
  const playIcon = toggle.querySelector('[data-icon="play"]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pausedByUser = reduced.matches;
  let visible = false;

  video.removeAttribute('controls');
  toggle.hidden = false;

  const render = () => {
    const playing = !video.paused;
    toggle.setAttribute('aria-pressed', String(!playing));
    // Labels come from the markup, so they follow the page language
    label.textContent = playing ? toggle.dataset.labelPause : toggle.dataset.labelPlay;
    // SVG elements have no .hidden property: toggle the attribute itself
    pauseIcon.toggleAttribute('hidden', !playing);
    playIcon.toggleAttribute('hidden', playing);
  };

  const sync = () => {
    if (visible && !pausedByUser && !document.hidden) {
      video.play().catch(() => { pausedByUser = true; render(); });
    } else {
      video.pause();
    }
  };

  toggle.addEventListener('click', () => {
    pausedByUser = !video.paused;
    sync();
  });
  video.addEventListener('play', render);
  video.addEventListener('pause', render);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', e => { pausedByUser = e.matches; sync(); });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.25 }).observe(video);

  render();
}
