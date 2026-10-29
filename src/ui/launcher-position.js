/**
 * Keeps the floating launcher inside the visible viewport
 */

export function clampLauncherPosition(x, y, buttonWidth, buttonHeight, viewportWidth, viewportHeight) {
  const margin = 10;
  const maxX = Math.max(margin, viewportWidth - buttonWidth - margin);
  const maxY = Math.max(margin, viewportHeight - buttonHeight - margin);
  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y))
  };
}
