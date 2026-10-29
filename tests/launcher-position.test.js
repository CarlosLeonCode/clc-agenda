import test from 'node:test';
import assert from 'node:assert/strict';
import { clampLauncherPosition } from '../src/ui/launcher-position.js';

test('launcher position clamps stale custom coordinates into the visible viewport', () => {
  const result = clampLauncherPosition(2010, 950, 222, 80, 1512, 900);
  assert.equal(result.x, 1280);
  assert.equal(result.y, 810);
});
