import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { markSVG } from '../src/ui/brand.js';

const root = new URL('../', import.meta.url);
// Start of the WhatsApp glyph path (phone inside a round bubble) the overlay used to ship
const WHATSAPP_GLYPH = 'M12 2C6.48 2 2 6.48 2 12c0 1.82';

function pngSize(file) {
  const buf = fs.readFileSync(new URL(file, root));
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', `${file} is a PNG`);
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

test('Brand: the Fuga mark is a chat bubble with a contact card breaking out', () => {
  const svg = markSVG();
  assert.match(svg, /^<svg[^>]*viewBox="0 0 200 200"/);
  assert.match(svg, /<mask /, 'the gap around the card is cut with a mask, so it works on any background');
  assert.match(svg, /#6A4FF5/, 'the card carries the accent');
});

test('Brand: tile and small-size variants exist for toolbar icons', () => {
  assert.match(markSVG({ tile: true }), /<rect[^>]*width="200" height="200"[^>]*rx=/);
  const small = markSVG({ tile: true, small: true });
  assert.doesNotMatch(small, /<circle/, 'the 16 px version drops the card details');
});

test('Brand: mask ids are unique per instance, so several marks can share a page', () => {
  const ids = [markSVG(), markSVG()].map(s => s.match(/<mask id="([^"]+)"/)[1]);
  assert.notEqual(ids[0], ids[1]);
});

test('Brand: the extension no longer ships the WhatsApp glyph', () => {
  const overlay = fs.readFileSync(new URL('src/ui/overlay.js', root), 'utf8');
  assert.ok(!overlay.includes(WHATSAPP_GLYPH), 'overlay.js still embeds the WhatsApp logo path');
  assert.ok(!fs.readFileSync(new URL('dist/overlay.js', root), 'utf8').includes(WHATSAPP_GLYPH));
});

test('Brand: manifest icons are generated from the brand at their declared sizes', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
  for (const [size, file] of Object.entries(manifest.icons)) {
    assert.deepEqual(pngSize(file), [Number(size), Number(size)]);
  }
  const pkg = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));
  assert.equal(pkg.scripts.icons, 'node scripts/build-icons.mjs');
  assert.ok(!fs.existsSync(new URL('generate-icons.js', root)), 'the old procedural icon generator is gone');
});
