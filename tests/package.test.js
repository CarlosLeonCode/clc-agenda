import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// npm test builds dist/ first, so the package can be zipped from the current build
const root = fileURLToPath(new URL('../', import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clc-package-'));
const zipPath = path.join(tmp, 'clc-agenda.zip');
execFileSync('node', ['scripts/package.mjs', zipPath], { cwd: root });

const entries = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).trim().split('\n').sort();
const read = file => execFileSync('unzip', ['-p', zipPath, file], { encoding: 'utf8' });

const RUNTIME_FILES = [
  'dist/content.js',
  'dist/inject.js',
  'dist/overlay.js',
  'icons/icon-128.png',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'manifest.json',
  'popup/popup.css',
  'popup/popup.html',
  'popup/popup.js'
];

test('Package: the zip holds exactly what Chrome needs, at its root', () => {
  assert.deepEqual(entries, RUNTIME_FILES);
});

test('Package: the zipped manifest parses and every file it references is inside the zip', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const referenced = [
    ...manifest.content_scripts.flatMap(cs => [...(cs.js || []), ...(cs.css || [])]),
    manifest.action.default_popup,
    ...Object.values(manifest.action.default_icon),
    ...Object.values(manifest.icons)
  ];
  for (const file of referenced) assert.ok(entries.includes(file), `manifest references ${file}, missing from the zip`);
});

test('Package: the popup only loads files that ship in the zip', () => {
  const html = read('popup/popup.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => path.posix.normalize(path.posix.join('popup', m[1])));
  for (const ref of refs) assert.ok(entries.includes(ref), `popup.html loads ${ref}, missing from the zip`);
});

test('Package: npm run package builds first and the zip stays out of git', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.package, 'npm run build && node scripts/package.mjs');
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^clc-agenda\.zip$/m);
});
