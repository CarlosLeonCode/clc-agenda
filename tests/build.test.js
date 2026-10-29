import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// npm test runs the build first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const ENTRIES = ['inject', 'overlay', 'content'];

function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

test('Build: every manifest entry is bundled as a classic script', () => {
  for (const name of ENTRIES) {
    const file = new URL(`dist/${name}.js`, root);
    assert.ok(fs.existsSync(file), `dist/${name}.js should exist`);
    const code = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(code, /^\s*(import|export)\s/m, `dist/${name}.js should not contain module syntax`);
  }
});

test('Build: the manifest loads only bundled scripts and runs the engine in the MAIN world', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
  const scripts = manifest.content_scripts.flatMap(cs => cs.js || []);
  assert.deepEqual(scripts.sort(), ['dist/content.js', 'dist/inject.js', 'dist/overlay.js']);
  const engine = manifest.content_scripts.find(cs => (cs.js || []).includes('dist/inject.js'));
  assert.equal(engine.world, 'MAIN');
  assert.equal(manifest.web_accessible_resources, undefined);
});

test('Build: phone cleaning has a single source of truth in src/core/phone.js', () => {
  const srcDir = new URL('src/', root).pathname;
  const definers = listJsFiles(srcDir)
    .filter(file => /function cleanPhoneNumber\(/.test(fs.readFileSync(file, 'utf8')))
    .map(file => path.relative(srcDir, file));
  assert.deepEqual(definers, [path.join('core', 'phone.js')]);
});

test('Build: overlay styles are bundled into the shadow root without !important', () => {
  const code = fs.readFileSync(new URL('dist/overlay.js', root), 'utf8');
  assert.doesNotMatch(code, /!important/);
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.ok(manifest.content_scripts.every(cs => !cs.css), 'no page-level stylesheet in the manifest');
});

test('Build: overlay templates use CSS tokens instead of inline colors', () => {
  const source = fs.readFileSync(new URL('src/ui/overlay.js', root), 'utf8');
  assert.doesNotMatch(source, /style="[^"]*(color|background)/);
  assert.doesNotMatch(source, /rgba?\(/);
});
