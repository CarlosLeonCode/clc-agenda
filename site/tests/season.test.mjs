import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { seasonFor, currentSeason, SEASONS } from '../src/scripts/season.js';

// `npm test` builds first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const read = (path, base = root) => {
  const url = new URL(path, base);
  return fs.existsSync(url) ? fs.readFileSync(url, 'utf8') : '';
};

// Local dates: months are 0-based, as in the Date constructor
const day = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

test('season: SEASONS lists the three seasons', () => {
  assert.deepEqual([...SEASONS].sort(), ['christmas', 'halloween', 'valentine']);
});

test('season: Halloween runs Oct 15 – Nov 2, inclusive', () => {
  assert.equal(seasonFor(day(2026, 10, 14)), null);
  assert.equal(seasonFor(day(2026, 10, 14, 23, 59)), null);
  assert.equal(seasonFor(day(2026, 10, 15, 0, 0)), 'halloween');
  assert.equal(seasonFor(day(2026, 10, 31)), 'halloween');
  assert.equal(seasonFor(day(2026, 11, 2, 23, 59)), 'halloween');
  assert.equal(seasonFor(day(2026, 11, 3, 0, 0)), null);
});

test('season: Christmas runs Dec 1 – Jan 6 across the year boundary', () => {
  assert.equal(seasonFor(day(2026, 11, 30, 23, 59)), null);
  assert.equal(seasonFor(day(2026, 12, 1, 0, 0)), 'christmas');
  assert.equal(seasonFor(day(2026, 12, 31, 23, 59)), 'christmas');
  assert.equal(seasonFor(day(2027, 1, 1, 0, 0)), 'christmas');
  assert.equal(seasonFor(day(2027, 1, 6, 23, 59)), 'christmas');
  assert.equal(seasonFor(day(2027, 1, 7, 0, 0)), null);
});

test('season: Valentine runs Feb 1 – 15, inclusive', () => {
  assert.equal(seasonFor(day(2027, 1, 31, 23, 59)), null);
  assert.equal(seasonFor(day(2027, 2, 1, 0, 0)), 'valentine');
  assert.equal(seasonFor(day(2027, 2, 15, 23, 59)), 'valentine');
  assert.equal(seasonFor(day(2027, 2, 16, 0, 0)), null);
  assert.equal(seasonFor(day(2028, 2, 29)), null, 'leap day is outside every season');
});

test('season: summer has no season', () => {
  assert.equal(seasonFor(day(2026, 7, 15)), null);
});

test('season: ?season= overrides the calendar', () => {
  const summer = day(2026, 7, 15);
  for (const season of ['halloween', 'christmas', 'valentine']) {
    assert.equal(currentSeason(`?season=${season}`, summer), season);
    assert.equal(currentSeason(`season=${season}`, summer), season, 'without a leading ?');
    assert.equal(currentSeason(`?utm_source=x&season=${season}&lang=es`, summer), season, 'among other params');
  }
});

test('season: ?season=none turns it off even inside a season', () => {
  assert.equal(currentSeason('?season=none', day(2026, 10, 31)), null);
  assert.equal(currentSeason('?a=1&season=none', day(2026, 12, 24)), null);
});

test('season: unknown or missing overrides fall back to the calendar', () => {
  assert.equal(currentSeason('?season=easter', day(2026, 10, 31)), 'halloween');
  assert.equal(currentSeason('?season=easter', day(2026, 7, 15)), null);
  assert.equal(currentSeason('', day(2026, 12, 24)), 'christmas');
  assert.equal(currentSeason('', day(2026, 7, 15)), null);
});

// Built output: follow each page's module scripts through static and dynamic imports
const assetsOf = (html) => [...html.matchAll(/<script[^>]*type="module"[^>]*src="\/_astro\/([^"]+)"/g)].map((m) => m[1]);
function moduleGraph(entries) {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const code = read(file, new URL('_astro/', dist));
    for (const m of code.matchAll(/(?:import|from)\s*["'`]\.\/([^"'`]+\.js)["'`]|import\(\s*["'`]\.\/([^"'`]+\.js)["'`]\s*\)/g)) visit(m[1] || m[2]);
  };
  entries.forEach(visit);
  return [...seen];
}
const loadsAmbience = (page) => moduleGraph(assetsOf(read(page, dist))).some((f) => /^ambience-renderer\.[\w-]+\.js$/.test(f));

const WITH = {
  'home es': ['dist/index.html', 'src/pages/index.astro'],
  'home en': ['dist/en/index.html', 'src/pages/en/index.astro'],
  'install es': ['dist/instalar/index.html', 'src/pages/instalar.astro'],
  'install en': ['dist/en/install/index.html', 'src/pages/en/install.astro']
};

for (const [name, [built, source]] of Object.entries(WITH)) {
  test(`ambience (${name}): the page loads the ambience script and its lazy renderer`, () => {
    assert.match(read(source), /import '(\.\.\/)+scripts\/ambience\.js';/);
    assert.ok(loadsAmbience(built.replace(/^dist\//, '')), 'renderer chunk reachable from the page');
  });
}

test('ambience: reading and utility pages stay plain', () => {
  for (const page of ['404.html', 'privacidad/index.html', 'en/privacy/index.html']) {
    if (!read(page, dist)) continue; // privacy pages exist only while leads are on
    assert.equal(loadsAmbience(page), false, page);
  }
  assert.doesNotMatch(read('src/pages/404.astro'), /ambience/);
  assert.doesNotMatch(read('src/pages/[...privacy].astro'), /ambience/);
});

test('ambience: the detector stays tiny and the renderer is a dynamic import', () => {
  const entry = read('src/scripts/ambience.js');
  assert.match(entry, /from '\.\/season\.js'/);
  assert.match(entry, /currentSeason\(location\.search\)/);
  assert.match(entry, /import\('\.\/ambience-renderer\.js'\)/);
  assert.doesNotMatch(entry, /^import .*ambience-renderer/m, 'never a static import');
  assert.match(entry, /requestIdleCallback/, 'starts after first paint');
});

test('ambience: honors prefers-reduced-motion, including changes', () => {
  const entry = read('src/scripts/ambience.js');
  assert.match(entry, /prefers-reduced-motion: reduce/);
  assert.match(entry, /addEventListener\('change'/);
  assert.match(entry, /'pagehide'/);
});

test('ambience: the renderer is decorative, paused when hidden and light on small screens', () => {
  const renderer = read('src/scripts/ambience-renderer.js');
  assert.match(renderer, /export function startAmbience\(/);
  assert.match(renderer, /setAttribute\('aria-hidden', 'true'\)/);
  assert.match(renderer, /pointerEvents = 'none'/);
  assert.match(renderer, /'visibilitychange'/);
  assert.match(renderer, /\b(document|doc)\.hidden\b/);
  assert.match(renderer, /\(max-width: 819px\), \(pointer: coarse\)/);
  assert.match(renderer, /Math\.min\(\w+\.devicePixelRatio \|\| 1, 1\.5\)/, 'desktop DPR capped at 1.5');
  assert.match(renderer, /cancelAnimationFrame/);
  assert.match(renderer, /removeEventListener\('resize'/);
  assert.match(renderer, /'lighter'/);
  assert.match(renderer, /'source-over'/);
});

test('ambience: the canvas is fixed behind all content and never takes input', () => {
  const css = read('src/styles/global.css');
  const rule = css.match(/\.ambience\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(rule, /position:\s*fixed/);
  assert.match(rule, /inset:\s*0/);
  assert.match(rule, /pointer-events:\s*none/);
  assert.match(rule, /z-index:\s*-1/);
});

// Nav ornament: a small seasonal scene beside the brand
const { ORNAMENTS, mountOrnament } = await import('../src/scripts/ornament.js').catch(() => ({}));
const count = (svg, cls) => (svg.match(new RegExp(`class="[^"]*\\b${cls}\\b`, 'g')) || []).length;

test('ornament: every season has an inline SVG scene, safe under the CSP', () => {
  assert.deepEqual(Object.keys(ORNAMENTS || {}).sort(), [...SEASONS].sort());
  for (const [season, svg] of Object.entries(ORNAMENTS)) {
    assert.match(svg, /^<svg [^>]*viewBox="/, season);
    assert.doesNotMatch(svg, /<script|<style|\son\w+=/i, `${season}: no script, style or handlers`);
  }
});

test('ornament: Halloween is a pumpkin with two ghosts', () => {
  assert.equal(count(ORNAMENTS.halloween, 'orn-pumpkin'), 1);
  assert.equal(count(ORNAMENTS.halloween, 'orn-ghost'), 2);
});

test('ornament: Christmas is a tree with a star, lights and two snowflakes', () => {
  assert.equal(count(ORNAMENTS.christmas, 'orn-tree'), 1);
  assert.equal(count(ORNAMENTS.christmas, 'orn-star'), 1);
  assert.ok(count(ORNAMENTS.christmas, 'orn-light') >= 3);
  assert.equal(count(ORNAMENTS.christmas, 'orn-flake'), 2);
});

test('ornament: Valentine is a heart with two rising hearts', () => {
  assert.equal(count(ORNAMENTS.valentine, 'orn-heart'), 1);
  assert.equal(count(ORNAMENTS.valentine, 'orn-heartlet'), 2);
});

// Just enough DOM for mountOrnament
function fakeDocument({ brand = true } = {}) {
  const el = (tag) => ({
    tag, children: [], attrs: {}, className: '', innerHTML: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    append(child) { this.children.push(child); },
    querySelector(sel) { return sel === '.season-ornament' ? this.children.find((c) => c.className.includes('season-ornament')) || null : null; }
  });
  const brandEl = brand ? el('a') : null;
  return { brand: brandEl, createElement: el, querySelector: (sel) => (sel === '.brand' ? brandEl : null) };
}

test('ornament: mounts once inside the brand, hidden from assistive tech', () => {
  const doc = fakeDocument();
  mountOrnament('halloween', doc);
  mountOrnament('halloween', doc);
  assert.equal(doc.brand.children.length, 1, 'idempotent');
  const [ornament] = doc.brand.children;
  assert.equal(ornament.tag, 'span');
  assert.match(ornament.className, /\bseason-ornament\b/);
  assert.match(ornament.className, /\bseason-ornament--halloween\b/);
  assert.equal(ornament.attrs['aria-hidden'], 'true');
  assert.equal(ornament.innerHTML, ORNAMENTS.halloween);
});

test('ornament: no brand or no season mounts nothing', () => {
  assert.doesNotThrow(() => mountOrnament('christmas', fakeDocument({ brand: false })));
  const doc = fakeDocument();
  mountOrnament(null, doc);
  mountOrnament('easter', doc);
  assert.equal(doc.brand.children.length, 0);
});

test('ornament: loaded in season only, as a dynamic import, regardless of reduced motion', () => {
  const entry = read('src/scripts/ambience.js');
  assert.match(entry, /import\('\.\/ornament\.js'\)/);
  assert.doesNotMatch(entry, /^import .*ornament/m, 'never a static import');
  for (const page of ['index.html', 'en/index.html', 'instalar/index.html', 'en/install/index.html']) {
    assert.ok(moduleGraph(assetsOf(read(page, dist))).some((f) => /^ornament\.[\w-]+\.js$/.test(f)), page);
  }
});

test('ornament: overlays the nav without shifting it or taking clicks, and stills with reduced motion', () => {
  const css = read('src/styles/global.css');
  assert.match(css.match(/\.brand\s*\{([^}]*)\}/)?.[1] || '', /position:\s*relative/);
  const rule = css.match(/\.season-ornament\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(rule, /position:\s*absolute/);
  assert.match(rule, /pointer-events:\s*none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.season-ornament,\s*\.season-ornament \*\s*\{\s*animation:\s*none/);
});
