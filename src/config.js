export const LOOP = 90;
export const X0 = -10, X1 = 10, CX = 0;
export const SLAB = { w: X1 - X0, d: 14, h: 1.0 };
export const HX = SLAB.w / 2, HZ = SLAB.d / 2, WALL_H = 11;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
export const win = (t, t0, dur) => clamp((t - t0) / dur, 0, 1);
export const bell = (t, a, b, c, d) => smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)));
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const TAU = Math.PI * 2;
/** One 90 s loop. Everything is a pure function of these times. The mould sees where things will be; the sloth only arrives there first. */
export const T = {
  ghostBeetle0: 6.0, beetleIn: 13.0, land: 19.0, snap: 20.2,                 // the insect lands exactly on the empty tip; the sloth eats it
  ghostHit0: 40.0, eagleLook: 46.0, takeoff: 51.5, crack: 55.6, fall: 56.2, hit: 57.4, impact: 58.6,   // the eagle dives; the rotten branch falls first and hits it
  eagleGround: 60.2, eagleUp: 62.5, eagleGone: 66.5, eagleBack0: 80.0, eagleBack1: 86.5,
  rotDust0: 68.0, rotDust1: 74.0, regrow0: 84.0, regrow1: 88.5,
  approach0: 65.0, approach1: 70.5, retreat: 76.0,                            // a researcher walks up to the tree and the sloth looks through him
};
