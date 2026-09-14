// Shared by the preview and its deterministic geometry tests.
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export function coverRect(vw, vh, w, h) {
  if (![vw, vh, w, h].every(n => Number.isFinite(n) && n > 0)) return null;
  const scale = Math.max(w / vw, h / vh);
  return { width: vw * scale, height: vh * scale, x: (w - vw * scale) / 2, y: (h - vh * scale) / 2 };
}
export function screenPoint(p, rect, w, h) {
  return { x: rect.x + p.x * rect.width - w / 2, y: h / 2 - rect.y - p.y * rect.height };
}
export function trackingState(hasPose, lastSeen, now) {
  if (!hasPose) return "searching";
  if (now - lastSeen < 350) return "tracking";
  if (now - lastSeen < 1400) return "holding";
  return "lost";
}
export function smoothingAlpha(dt, response = 90) {
  return 1 - Math.exp(-Math.max(0, dt) / response);
}
