import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (file) => JSON.parse(fs.readFileSync(new URL(file, root), 'utf8'));

test('Metadata: package.json and manifest share one version', () => {
  assert.equal(readJson('package.json').version, readJson('manifest.json').version);
});

test('Metadata: the package is private so it is never published to npm by accident', () => {
  assert.equal(readJson('package.json').private, true);
});

test('Metadata: shipped code uses the current product name only', () => {
  for (const file of ['dist/inject.js', 'dist/overlay.js', 'dist/content.js', 'popup/popup.js']) {
    const code = fs.readFileSync(new URL(file, root), 'utf8');
    assert.doesNotMatch(code, /Extractor Pro|Engine v\d/, `${file} still uses the old name`);
  }
});

test('Metadata: CI runs the test suite on pushes and pull requests', () => {
  const workflow = fs.readFileSync(new URL('.github/workflows/ci.yml', root), 'utf8');
  assert.match(workflow, /pull_request/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
});

test('Metadata: tagging a version publishes a release with the installable zip', () => {
  const workflow = fs.readFileSync(new URL('.github/workflows/release.yml', root), 'utf8');
  assert.match(workflow, /tags:\s*\n\s*-\s*['"]?v\*/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run package/);
  assert.match(workflow, /softprops\/action-gh-release@v2/);
  assert.match(workflow, /files:\s*clc-agenda\.zip/);
  assert.match(workflow, /contents:\s*write/);
  assert.match(workflow, /manifest\.json/, 'the tag is checked against the manifest version');
});
