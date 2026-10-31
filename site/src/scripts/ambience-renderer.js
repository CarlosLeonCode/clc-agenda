/**
 * Canvas renderer for the seasonal ambience, loaded on demand by ambience.js.
 *
 * The page is white, so additive light glows would vanish: sprites use the brand
 * palette at low alpha, with glow as a soft tinted halo. Sparse and slow on purpose.
 *
 * Performance: every sprite kind is pre-rendered once to an offscreen canvas and
 * stamped with drawImage; motion is dt-based (clamped after long frames); small or
 * touch screens get DPR 1, a 30 fps cap and half the sprites; the loop stops while
 * the tab is hidden.
 */

// Brand palette (src/styles/global.css :root)
const INK = '#0F0F10';
const VIOLET = '#7B61FF';
const VIOLET_STRONG = '#6A4FF5';
const CORAL = '#FF7262';
const SKY = '#1ABCFE';
const YELLOW = '#FFC700';
const LILAC = '#F4F1FF';

const SMALL_SCREEN = '(max-width: 819px), (pointer: coarse)';
const SMALL_FRAME_MS = 1000 / 30;
const MAX_DT = 0.1;
const EDGE_FADE_PX = 72;
const INTRO_SECONDS = 1.6;
const RESIZE_DEBOUNCE_MS = 150;
// Depth layers: far sprites are smaller, dimmer and slower
const DEPTHS = [0.45, 0.7, 1];

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgba = (hex, a) => `rgba(${rgb(hex).join(', ')}, ${a})`;
/** Blends two palette colors: mix(CORAL, LILAC, 0.4) is a soft pink. */
const mix = (a, b, t) => {
  const [ca, cb] = [rgb(a), rgb(b)];
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};
const PINK = mix(CORAL, LILAC, 0.4);
// Lilac alone vanishes on white: its discs get a soft violet rim
const LILAC_RIM = mix(LILAC, VIOLET, 0.55);

/** An offscreen canvas painted once; sprites stamp it every frame. */
function texture(doc, width, height, paint) {
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  return canvas;
}

// Textures ------------------------------------------------------------------

/** Ember spark: warm yellow core inside a coral halo. */
const ember = (doc) => texture(doc, 64, 64, (ctx, w) => {
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, rgba(YELLOW, 1));
  g.addColorStop(0.18, rgba(mix(YELLOW, CORAL, 0.5), 0.95));
  g.addColorStop(0.42, rgba(CORAL, 0.45));
  g.addColorStop(1, rgba(CORAL, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
});

/** Bokeh disc: soft-edged, slightly brighter rim like an out-of-focus light. */
const bokeh = (doc, fill, rim = fill) => texture(doc, 96, 96, (ctx, w) => {
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, rgba(fill, 0.75));
  g.addColorStop(0.6, rgba(fill, 0.7));
  g.addColorStop(0.84, rgba(rim, 0.6));
  g.addColorStop(0.94, rgba(rim, 0.2));
  g.addColorStop(1, rgba(rim, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
});

/** Soft bat silhouette, wings spread; the wing beat squashes it vertically. */
const bat = (doc) => texture(doc, 128, 64, (ctx, w, h) => {
  ctx.scale(w / 100, h / 50);
  ctx.shadowColor = rgba(INK, 0.6);
  ctx.shadowBlur = 3;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(50, 15);
  ctx.lineTo(46.5, 9);
  ctx.lineTo(45.5, 16);
  ctx.quadraticCurveTo(30, 7, 5, 13);
  ctx.quadraticCurveTo(11, 22, 9, 31);
  ctx.quadraticCurveTo(16, 26, 22, 31);
  ctx.quadraticCurveTo(28, 26, 34, 33);
  ctx.quadraticCurveTo(40, 28, 46, 35);
  ctx.quadraticCurveTo(50, 41, 54, 35);
  ctx.quadraticCurveTo(60, 28, 66, 33);
  ctx.quadraticCurveTo(72, 26, 78, 31);
  ctx.quadraticCurveTo(84, 26, 91, 31);
  ctx.quadraticCurveTo(89, 22, 95, 13);
  ctx.quadraticCurveTo(70, 7, 54.5, 16);
  ctx.lineTo(53.5, 9);
  ctx.closePath();
  ctx.fill();
});

/** Fine line snowflake: six arms with two pairs of small branches, thin halo. */
const snowflake = (doc, color) => texture(doc, 128, 128, (ctx, w) => {
  const r = w * 0.36;
  ctx.translate(w / 2, w / 2);
  ctx.strokeStyle = rgba(color, 0.95);
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.shadowColor = rgba(color, 0.55);
  ctx.shadowBlur = 9;
  for (let arm = 0; arm < 6; arm++) {
    ctx.save();
    ctx.rotate((arm * Math.PI) / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r);
    for (const [at, len] of [[0.45, 0.24], [0.72, 0.16]]) {
      for (const side of [-1, 1]) {
        ctx.moveTo(0, -r * at);
        ctx.lineTo(side * r * len * Math.sin(Math.PI / 3), -r * at - r * len * Math.cos(Math.PI / 3));
      }
    }
    ctx.stroke();
    ctx.restore();
  }
});

/** Outline-only heart with a faint halo. */
const heart = (doc, color) => texture(doc, 128, 128, (ctx, w) => {
  ctx.translate(w * 0.14, w * 0.14);
  ctx.scale((w * 0.72) / 100, (w * 0.72) / 100);
  ctx.strokeStyle = rgba(color, 0.95);
  ctx.lineWidth = 4.2;
  ctx.lineJoin = 'round';
  ctx.shadowColor = rgba(color, 0.5);
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(50, 86);
  ctx.bezierCurveTo(20, 64, 6, 46, 10, 30);
  ctx.bezierCurveTo(14, 14, 36, 8, 50, 27);
  ctx.bezierCurveTo(64, 8, 86, 14, 90, 30);
  ctx.bezierCurveTo(94, 46, 80, 64, 50, 86);
  ctx.closePath();
  ctx.stroke();
});

// Seasons ---------------------------------------------------------------------
// Per kind: desktop count, size in CSS px, alpha, speed in px/s (vy < 0 rises),
// side drift, sway amplitude; plus optional depth layers, flicker, wing flap, spin or rocking.

const SEASON_KINDS = {
  halloween: (doc) => [
    { textures: [ember(doc)], count: 32, blend: 'lighter', size: [12, 26], alpha: [0.75, 1], vy: [-34, -14], vx: [-6, 6], sway: [6, 18], flicker: true },
    { textures: [bat(doc)], count: 4, blend: 'source-over', depths: [0.7, 1], size: [56, 80], alpha: [0.22, 0.28], vy: [-3, 3], vx: [14, 26], sway: [4, 10], flap: true, sideways: true }
  ],
  christmas: (doc) => [
    { textures: [bokeh(doc, SKY), bokeh(doc, VIOLET), bokeh(doc, LILAC, LILAC_RIM)], count: 30, blend: 'lighter', size: [12, 48], alpha: [0.2, 0.36], vy: [8, 26], vx: [-4, 4], sway: [10, 28] },
    { textures: [snowflake(doc, VIOLET_STRONG), snowflake(doc, SKY)], count: 6, blend: 'lighter', size: [32, 56], alpha: [0.42, 0.62], vy: [10, 18], vx: [-3, 3], sway: [12, 24], spin: [0.08, 0.22] }
  ],
  valentine: (doc) => [
    { textures: [bokeh(doc, CORAL), bokeh(doc, PINK), bokeh(doc, LILAC, LILAC_RIM)], count: 30, blend: 'lighter', size: [12, 46], alpha: [0.2, 0.34], vy: [-20, -6], vx: [-5, 5], sway: [10, 26] },
    { textures: [heart(doc, CORAL), heart(doc, VIOLET)], count: 6, blend: 'lighter', size: [26, 46], alpha: [0.44, 0.62], vy: [-16, -8], vx: [-3, 3], sway: [12, 22], rock: 0.28 }
  ]
};

/** One sprite, placed anywhere (first fill) or just outside the edge it enters from. */
function spawn(kind, width, height, anywhere) {
  const z = pick(kind.depths || DEPTHS);
  const size = rand(...kind.size) * (0.55 + 0.45 * z);
  const s = {
    kind,
    z,
    size,
    image: pick(kind.textures),
    alpha: rand(...kind.alpha) * (0.55 + 0.45 * z),
    vx: rand(...kind.vx) * z,
    vy: rand(...kind.vy) * z,
    sway: rand(...kind.sway) * z,
    swayRate: rand(0.25, 0.6),
    phase: rand(0, Math.PI * 2),
    angle: rand(0, Math.PI * 2),
    spin: kind.spin ? rand(...kind.spin) * (Math.random() < 0.5 ? -1 : 1) : 0,
    x: rand(0, width),
    y: rand(0, height)
  };
  if (kind.sideways && Math.random() < 0.5) s.vx = -s.vx;
  if (!anywhere) place(s, width, height);
  return s;
}

/** Moves a sprite that left the viewport to the edge it re-enters from. */
function place(s, width, height) {
  const margin = s.size + s.sway;
  if (s.kind.sideways) {
    s.x = s.vx > 0 ? -margin : width + margin;
    s.y = rand(height * 0.08, height * 0.7);
  } else {
    s.x = rand(0, width);
    s.y = s.vy < 0 ? height + margin : -margin;
  }
}

/**
 * Starts the ambience for a season and returns `stop()`.
 * @param {'halloween' | 'christmas' | 'valentine'} season
 * @param {{ canvas?: HTMLCanvasElement, window?: Window }} [options]
 */
export function startAmbience(season, { canvas, window: win = window } = {}) {
  const doc = win.document;
  const makeKinds = SEASON_KINDS[season];
  canvas ??= doc.createElement('canvas');
  const ctx = makeKinds && canvas.getContext('2d');
  if (!ctx) return () => {};

  canvas.className = 'ambience';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.pointerEvents = 'none';
  if (!canvas.isConnected) doc.body.append(canvas);

  const kinds = makeKinds(doc);
  const small = win.matchMedia(SMALL_SCREEN);
  let width = 0;
  let height = 0;
  let sprites = [];
  let filledFor = null;
  let raf = 0;
  let last = null;
  let time = 0;
  let resizeTimer = 0;

  function resize() {
    const isSmall = small.matches;
    const dpr = isSmall ? 1 : Math.min(win.devicePixelRatio || 1, 1.5);
    width = win.innerWidth;
    height = win.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Half the sprites on small screens; refill (and fade in again) only when that
    // changes, or when they were spread over an empty viewport (a hidden frame)
    const layout = width && height ? (isSmall ? 'small' : 'large') : 'empty';
    if (layout !== filledFor) {
      sprites = kinds.flatMap((kind) => Array.from({ length: isSmall ? Math.ceil(kind.count / 2) : kind.count }, () => spawn(kind, width, height, true)));
      // Far layers first, so nearer sprites draw over them
      sprites.sort((a, b) => a.z - b.z);
      filledFor = layout;
      time = 0;
    }
  }

  /** 0 at the viewport edge, 1 once a sprite is EDGE_FADE_PX inside: no popping in or out. */
  const edgeFade = (x, y) => smooth(Math.min(x, y, width - x, height - y) / EDGE_FADE_PX);

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const intro = smooth(time / INTRO_SECONDS);
    // Glows add up ('lighter'); dark silhouettes can't, so they paint normally on top
    for (const blend of ['lighter', 'source-over']) {
      ctx.globalCompositeOperation = blend;
      for (const s of sprites) {
        if (s.kind.blend !== blend) continue;
        const x = s.x + Math.sin(time * s.swayRate + s.phase) * s.sway;
        const y = s.kind.sideways ? s.y + Math.sin(time * 0.9 + s.phase) * s.sway : s.y;
        let alpha = s.alpha * intro * edgeFade(x, y);
        if (s.kind.flicker) alpha *= 0.72 + 0.28 * Math.sin(time * 9 + s.phase) * Math.sin(time * 3.7 + s.phase * 2);
        if (alpha <= 0.004) continue;
        ctx.globalAlpha = Math.min(1, alpha);

        const w = s.size;
        let h = (w * s.image.height) / s.image.width;
        if (s.kind.flap) h *= 0.62 + 0.38 * Math.abs(Math.sin(time * 4.6 + s.phase));
        const angle = s.kind.spin ? s.angle : s.kind.rock ? Math.sin(time * 0.7 + s.phase) * s.kind.rock : 0;
        if (angle) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.drawImage(s.image, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else {
          ctx.drawImage(s.image, x - w / 2, y - h / 2, w, h);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function update(dt) {
    for (const s of sprites) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.angle += s.spin * dt;
      const margin = s.size + s.sway;
      const gone = s.y < -margin - 1 || s.y > height + margin + 1 || s.x < -margin - 1 || s.x > width + margin + 1;
      if (gone) place(s, width, height);
    }
  }

  function frame(now) {
    raf = win.requestAnimationFrame(frame);
    // Some viewport changes never fire 'resize' (e.g. a frame shown after loading hidden)
    if (!resizeTimer && (win.innerWidth !== width || win.innerHeight !== height)) onResize();
    if (last === null) last = now;
    const elapsed = now - last;
    // 30 fps on small screens: skip frames that come too early
    if (small.matches && elapsed > 0 && elapsed < SMALL_FRAME_MS - 2) return;
    const dt = Math.min(elapsed / 1000, MAX_DT);
    last = now;
    time += dt;
    update(dt);
    draw();
  }

  function onResize() {
    win.clearTimeout(resizeTimer);
    resizeTimer = win.setTimeout(() => {
      resizeTimer = 0;
      resize();
    }, RESIZE_DEBOUNCE_MS);
  }

  function onVisibility() {
    if (doc.hidden) {
      win.cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      // Resume without a jump: the hidden time never reaches dt
      last = null;
      raf = win.requestAnimationFrame(frame);
    }
  }

  resize();
  win.addEventListener('resize', onResize);
  doc.addEventListener('visibilitychange', onVisibility);
  if (!doc.hidden) raf = win.requestAnimationFrame(frame);

  return function stop() {
    win.cancelAnimationFrame(raf);
    raf = 0;
    win.clearTimeout(resizeTimer);
    win.removeEventListener('resize', onResize);
    doc.removeEventListener('visibilitychange', onVisibility);
    canvas.remove();
  };
}
