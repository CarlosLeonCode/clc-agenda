/**
 * Zips the files Chrome needs into an installable package (load it unzipped with
 * "Load unpacked"). Run through `npm run package`, which builds dist/ first.
 * Usage: node scripts/package.mjs [output.zip]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.resolve(root, process.argv[2] || 'clc-agenda.zip');

// Runtime files only: no sources, tests, site, video or brand SVG sources
const FILES = [
  'manifest.json',
  'dist/content.js',
  'dist/inject.js',
  'dist/overlay.js',
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png'
];

for (const file of FILES) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`Missing ${file}. Run "npm run build" first.`);
    process.exit(1);
  }
}

// zip appends to existing archives, so start clean
fs.rmSync(out, { force: true });
// -X drops extra file attributes, -q keeps the output quiet
execFileSync('zip', ['-X', '-q', out, ...FILES], { cwd: root, stdio: 'inherit' });
console.log(`Packaged ${FILES.length} files into ${path.relative(root, out) || out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
