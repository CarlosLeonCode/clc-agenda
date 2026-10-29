import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTabIndex, nextFocusIndex } from '../src/ui/a11y.js';

test('A11y: arrow keys move between tabs and wrap around', () => {
  assert.equal(nextTabIndex(0, 'ArrowRight', 4), 1);
  assert.equal(nextTabIndex(3, 'ArrowRight', 4), 0);
  assert.equal(nextTabIndex(0, 'ArrowLeft', 4), 3);
  assert.equal(nextTabIndex(2, 'Home', 4), 0);
  assert.equal(nextTabIndex(1, 'End', 4), 3);
  assert.equal(nextTabIndex(1, 'Enter', 4), null);
});

test('A11y: focus trap wraps Tab at the edges only', () => {
  assert.equal(nextFocusIndex(4, 5, false), 0, 'Tab on the last element goes to the first');
  assert.equal(nextFocusIndex(0, 5, true), 4, 'Shift+Tab on the first element goes to the last');
  assert.equal(nextFocusIndex(2, 5, false), null, 'inner elements keep native order');
  assert.equal(nextFocusIndex(-1, 5, false), 0, 'focus outside the dialog is pulled in');
  assert.equal(nextFocusIndex(0, 0, false), null);
});
