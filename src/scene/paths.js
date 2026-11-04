import { lerp, smooth, clamp, TAU } from '../config.js';

/** Keyed route: keys [t, x, z, mode, yaw?]. Mode of a stationary key: 's' sits, 'f' stands, 'w' idle-walk-in-place never used. Moving segments are walks ('r' as the start key makes it a run). */
export function keyPath(keys) {
  const K = keys.map((k) => ({ t: k[0], x: k[1], z: k[2], m: k[3] || 'f', yaw: k[4] }));
  const seg = []; let cum = 0, last = 0;
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[i], b = K[i + 1], d = Math.hypot(b.x - a.x, b.z - a.z); const mv = d > 0.02;
    if (a.yaw === undefined) a.yaw = last; if (mv) { last = Math.atan2(b.x - a.x, b.z - a.z); }
    seg.push({ a, b, d, mv, cum, h: last }); cum += d;
    if (b.yaw === undefined) b.yaw = last; else last = b.yaw;
  }
  return (t) => {
    t = clamp(t, K[0].t, K[K.length - 1].t); let i = 0; while (i < seg.length - 1 && t > seg[i].b.t) i++;
    const s = seg[i], u = clamp((t - s.a.t) / Math.max(1e-6, s.b.t - s.a.t), 0, 1);
    if (!s.mv) return { x: s.a.x, z: s.a.z, yaw: u < 1 || !s.b.yaw ? s.a.yaw : s.b.yaw, mode: s.a.m, moving: false, run: false, d: s.cum };
    const e = smooth(u), sp = s.d / (s.b.t - s.a.t);
    return { x: lerp(s.a.x, s.b.x, e), z: lerp(s.a.z, s.b.z, e), yaw: s.h, mode: 'f', moving: true, run: s.a.m === 'r' || sp > 2.6, d: s.cum + s.d * e, speed: sp };
  };
}
/** Closed loop at constant speed, one lap per `period` seconds; at(t) is periodic. */
export function loopPath(pts, period = 90, phase = 0) {
  const n = pts.length, L = []; let tot = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]); L.push(d); tot += d; }
  return (t) => {
    let s = ((((t / period + phase) % 1) + 1) % 1) * tot, i = 0; while (s > L[i]) { s -= L[i]; i = (i + 1) % n; }
    const a = pts[i], b = pts[(i + 1) % n], u = s / Math.max(1e-6, L[i]); let d = 0; for (let k = 0; k < i; k++) d += L[k];
    return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), d: d + s, moving: true };
  };
}
export const lerpAngle = (a, b, k) => { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; };
