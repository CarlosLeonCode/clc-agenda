import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('launcher position clamps stale custom coordinates into the visible viewport', () => {
  const source = fs.readFileSync(new URL('../content/overlay.js', import.meta.url), 'utf8');
  const helper = source.match(/function clampLauncherPosition\([\s\S]*?\n  function setupDraggableLauncher/);
  assert.ok(helper, 'overlay should define a launcher position clamp helper');
  const context = {};
  vm.runInNewContext(`${helper[0].replace(/\n  function setupDraggableLauncher[\s\S]*$/, '')}\nresult = clampLauncherPosition(2010, 950, 222, 80, 1512, 900);`, context);
  assert.equal(context.result.x, 1280);
  assert.equal(context.result.y, 810);
});
