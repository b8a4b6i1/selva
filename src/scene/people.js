import * as THREE from 'three';
import { M, box, cyl, sph, cone, limb, beam, contactShadow } from './common.js';
import { P } from '../palette.js';
import { TAU, clamp, smooth } from '../config.js';

const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

/** Human rig: faces +z; arms[0] at -x, arms[1] at +x; negative x rotation swings an arm forward. */
export function makePerson(top = 'red', bottom = 'navy', o = {}) {
  const root = new THREE.Group(); const SK = M(o.skin || 'skin1');
  const pel = J(root, 0, 0.86, 0); cyl(pel, 0.15, 0.17, 0.3, M(bottom), 0, -0.02, 0, null, 14); sph(pel, 0.17, M(bottom), 0, -0.05, 0, [1, 0.7, 0.8]);
  const torso = J(pel, 0, 0.12, 0); cyl(torso, 0.17, 0.2, 0.55, M(top), 0, 0.28, 0, null, 14); sph(torso, 0.2, M(top), 0, 0.5, 0, [1.05, 0.5, 0.75]);
  const neck = J(torso, 0, 0.6, 0); cyl(neck, 0.05, 0.06, 0.1, SK, 0, 0.03, 0); const head = J(neck, 0, 0.08, 0);
  sph(head, 0.11, SK, 0, 0.1, 0, [0.95, 1.12, 1]); const hair = sph(head, 0.115, M(o.hair || 'wood5'), 0, 0.14, -0.02, [1, 1, 1.05]); box(head, 0.02, 0.03, 0.02, M('skin2'), 0, 0.1, 0.11);
  for (const s of [-1, 1]) sph(head, 0.014, M('ink'), s * 0.04, 0.13, 0.105);
  const arms = [-1, 1].map((s) => { const sh = J(torso, s * 0.2, 0.52, 0); sph(sh, 0.065, M(top), 0, 0, 0); limb(sh, 0.3, 0.05, M(top)); const el = J(sh, 0, -0.3, 0); sph(el, 0.05, SK, 0, 0, 0); limb(el, 0.27, 0.042, SK); const w = J(el, 0, -0.27, 0); sph(w, 0.05, SK, 0, -0.02, 0, [1, 1.2, 0.8]); return { sh, el, w }; });
  const legs = [-1, 1].map((s) => { const hip = J(pel, s * 0.1, -0.1, 0); limb(hip, 0.42, 0.075, M(bottom)); const kn = J(hip, 0, -0.42, 0); sph(kn, 0.065, M(bottom), 0, 0, 0); limb(kn, 0.4, 0.06, M(bottom)); const an = J(kn, 0, -0.4, 0); box(an, 0.11, 0.08, 0.25, M(o.shoes || 'ink'), 0, -0.02, 0.06); return { hip, kn, an }; });
  const shadow = contactShadow(0.5); root.add(shadow); return { root, pel, torso, head, arms, legs, shadow, hair };
}
const longSkirt = (p, c, len = 0.92, r = 0.42, trim) => { const sk = J(p.pel, 0, 0, 0); cone(sk, r, len, M(c), 0, -len / 2 + 0.06, 0, null, 16); if (trim) cyl(sk, r + 0.01, r + 0.02, 0.07, M(trim), 0, -len + 0.1, 0, null, 16); p.skirt = sk;
  // seated: a lap over the thighs and a drape over the knees and shins, so the legs never show as trousers
  const lap = sph(sk, 0.32, M(c), 0, -0.1, 0.3, [0.95, 0.5, 1.45], 10, 8), drape = cyl(sk, 0.22, 0.29, 0.62, M(c), 0, -0.4, 0.5, null, 12); lap.visible = drape.visible = false; if (trim) { const tr = cyl(sk, 0.285, 0.3, 0.06, M(trim), 0, -0.68, 0.5, null, 12); tr.visible = false; p.skirtSit = [lap, drape, tr]; } else p.skirtSit = [lap, drape]; };
const bustle = (p, c) => { sph(p.pel, 0.2, M(c), 0, -0.1, -0.24, [1.2, 1.1, 0.9], 10, 8); sph(p.pel, 0.22, M(c), 0, -0.4, -0.3, [1.3, 1.5, 0.9], 10, 8); };
const brimHat = (p, crown, brim, ch, br, cy = 0.28) => { cyl(p.head, 0.11, 0.115, ch, M(crown), 0, cy, 0, null, 12); cyl(p.head, br, br, 0.025, M(brim || crown), 0, cy - ch / 2, 0, null, 14); };

/** Vera Vilaluz, after the Parker carte de visite (New York, 1875): centre parting, a thick crown of plaits, black dress with a high collar and a lace jabot, long drop earrings. */
export function makeVera() {
  const p = makePerson('cloth', 'cloth', { skin: 'skin0', hair: 'wood5', shoes: 'ink' });
  longSkirt(p, 'cloth', 0.95, 0.4, 'grey1'); bustle(p, 'cloth');
  cyl(p.torso, 0.1, 0.12, 0.14, M('cloth'), 0, 0.64, 0, null, 12);                                        // high collar
  for (let i = 0; i < 5; i++) sph(p.torso, 0.05 - i * 0.004, M(i % 2 ? 'grey1' : 'cloth'), 0, 0.58 - i * 0.07, 0.17, [1.3, 0.8, 0.5]);   // lace jabot
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; sph(p.head, 0.035, M(i % 2 ? 'wood5' : 'wood4'), Math.cos(a) * 0.1, 0.23, Math.sin(a) * 0.09, [1, 0.8, 1], 6, 5); }        // crown of plaits
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3; sph(p.head, 0.038, M(i % 2 ? 'wood4' : 'wood5'), Math.cos(a) * 0.065, 0.27, Math.sin(a) * 0.055, [1, 0.8, 1], 6, 5); }
  box(p.head, 0.012, 0.04, 0.1, M('skin1'), 0, 0.245, 0.04);                                              // centre parting
  for (const s of [-1, 1]) { box(p.head, 0.012, 0.09, 0.012, M('steel0'), s * 0.112, 0.04, 0.0); sph(p.head, 0.022, M('ink'), s * 0.112, -0.015, 0.0, [0.8, 1.3, 0.8], 6, 5); }   // drop earrings
  return p;
}
export function makeFoote() {
  const p = makePerson('grey1', 'grey1', { skin: 'skin0', hair: 'hairG', shoes: 'ink' });
  longSkirt(p, 'grey1', 0.95, 0.4, 'grey0'); bustle(p, 'grey1'); sph(p.torso, 0.24, M('lilac'), 0, 0.5, -0.02, [1.2, 0.5, 0.95]); cyl(p.torso, 0.1, 0.12, 0.1, M('cream'), 0, 0.64, 0, null, 12);
  sph(p.head, 0.07, M('hairG'), 0, 0.27, -0.06, [1, 0.8, 1]);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 4, 10), M('steel2')); r.position.set(s * 0.045, 0.13, 0.112); p.head.add(r); }
  return p;
}
export function makeGentleman(kind) {
  const a = kind === 0, p = makePerson('cloth', a ? 'grey1' : 'navy', { skin: a ? 'skin0' : 'skin1', hair: a ? 'hairG' : 'wood5', shoes: 'ink' });
  box(p.torso, 0.14, 0.4, 0.02, M('cream'), 0, 0.3, 0.19); box(p.torso, 0.1, 0.06, 0.03, M(a ? 'wine' : 'gold'), 0, 0.52, 0.2); cyl(p.torso, 0.09, 0.1, 0.06, M('cream'), 0, 0.62, 0, null, 10);
  if (a) { sph(p.head, 0.085, M('hairG'), 0, 0.0, 0.04, [1.1, 1.0, 0.8]); box(p.head, 0.14, 0.04, 0.04, M('hairG'), 0, 0.05, 0.1); }   // white beard
  else { box(p.head, 0.12, 0.025, 0.03, M('wood5'), 0, 0.07, 0.115); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 4, 10), M('steel2')); r.position.set(s * 0.045, 0.13, 0.112); p.head.add(r); } }
  for (const l of p.legs) box(l.kn, 0.02, 0.4, 0.02, M('wood5'), 0, -0.2, 0.065);
  return p;
}
export function makeMaid() {
  const p = makePerson('cloth', 'cloth', { skin: 'skin1', hair: 'wood5', shoes: 'ink' }); longSkirt(p, 'cloth', 0.92, 0.36); box(p.pel, 0.34, 0.6, 0.03, M('white'), 0, -0.2, 0.2); box(p.torso, 0.3, 0.32, 0.02, M('white'), 0, 0.3, 0.2);
  cyl(p.head, 0.1, 0.1, 0.04, M('white'), 0, 0.26, 0, null, 10); const tray = J(p.arms[1].w, 0, -0.05, 0.1); box(tray, 0.3, 0.02, 0.22, M('steel0'), 0, 0, 0); cyl(tray, 0.05, 0.04, 0.09, M('ice'), 0, 0.06, 0, null, 8); p.tray = tray; return p;
}
export function makePolice() {
  const p = makePerson('navy', 'navy', { skin: 'skin1', hair: 'wood5', shoes: 'ink' });
  for (let i = 0; i < 4; i++) sph(p.torso, 0.022, M('gold'), 0.05, 0.12 + i * 0.12, 0.2, [1, 1, 0.5], 6, 5); box(p.pel, 0.5, 0.05, 0.3, M('ink'), 0, 0.02, 0);
  cyl(p.head, 0.12, 0.125, 0.12, M('navy'), 0, 0.27, 0, null, 12); cyl(p.head, 0.14, 0.14, 0.02, M('ink'), 0, 0.21, 0.02, null, 12); box(p.head, 0.05, 0.05, 0.02, M('gold'), 0, 0.28, 0.125);
  const club = J(p.pel, -0.2, -0.1, 0.02); cyl(club, 0.02, 0.025, 0.4, M('wood2'), 0, -0.2, 0, null, 6); p.club = club; return p;
}
export function makeReporter() {
  const p = makePerson('earth', 'grey1', { skin: 'skin1', hair: 'wood5', shoes: 'wood5' });
  // bowler hat with a band, waistcoat and tie, a pencil behind the ear, a leather satchel across the chest
  sph(p.head, 0.13, M('cloth'), 0, 0.22, 0, [1, 0.82, 1.08], 10, 7); cyl(p.head, 0.185, 0.185, 0.025, M('cloth'), 0, 0.165, 0.01, null, 14); cyl(p.head, 0.125, 0.128, 0.04, M('wine'), 0, 0.185, 0, null, 12);
  box(p.head, 0.012, 0.09, 0.012, M('yellow'), 0.118, 0.13, -0.01, [0, 0, 0.3]);
  box(p.torso, 0.22, 0.34, 0.02, M('wood5'), 0, 0.3, 0.19); box(p.torso, 0.06, 0.22, 0.02, M('cream'), 0, 0.34, 0.2); box(p.torso, 0.035, 0.2, 0.02, M('red'), 0, 0.3, 0.215); sph(p.torso, 0.02, M('gold'), 0.07, 0.2, 0.21);
  beam(p.torso, [0.22, 0.58, 0.0], [-0.2, 0.05, 0.02], 0.035, M('wood3')); box(p.torso, 0.3, 0.24, 0.12, M('wood3'), -0.22, 0.05, 0.1); box(p.torso, 0.3, 0.05, 0.13, M('wood4'), -0.22, 0.15, 0.1);
  const nb = J(p.arms[0].w, 0, -0.06, 0.08); box(nb, 0.17, 0.23, 0.03, M('wood5'), 0, 0, 0); box(nb, 0.15, 0.2, 0.012, M('cream'), 0.0, 0.0, 0.02); cyl(nb, 0.008, 0.008, 0.12, M('yellow'), 0.1, 0.0, 0.02, null, 4); p.notebook = nb;
  return p;
}
export function makePetronila() {
  const p = makePerson('cream', 'grey1', { skin: 'skin1', hair: 'ink', shoes: 'wood5' }); longSkirt(p, 'grey1', 0.95, 0.36); sph(p.torso, 0.24, M('grey0'), 0, 0.5, -0.02, [1.2, 0.5, 0.95]);
  sph(p.head, 0.07, M('ink'), 0, 0.27, -0.06, [1, 0.8, 1]); return p;
}
/** Villagers of 1880: undyed or earth-coloured wool, a plain poncho, straw hats, bare feet or hide sandals. */
export function makeHuaso(kind) {
  const c = ['wood2', 'earth', 'grey1'][kind % 3], p = makePerson(c, kind === 1 ? 'grey0' : 'wood4', { skin: kind === 1 ? 'skin2' : 'skin1', hair: 'ink', shoes: kind === 0 ? 'skin2' : 'wood5' });
  cone(p.torso, 0.3, 0.8, M(c), 0, 0.35, 0, null, 12); cyl(p.torso, 0.26, 0.28, 0.05, M('adobe1'), 0, 0.22, 0, null, 12);
  cyl(p.head, 0.1, 0.12, 0.12, M('sand'), 0, 0.26, 0, null, 10); cyl(p.head, 0.25, 0.25, 0.02, M('sand'), 0, 0.2, 0, null, 14); return p;
}
export function makeVillagerWoman() { const p = makePerson('adobe1', 'wood3', { skin: 'skin2', hair: 'ink', shoes: 'skin2' }); longSkirt(p, 'wood3', 0.9, 0.38); sph(p.torso, 0.25, M('grey0'), 0, 0.5, -0.02, [1.25, 0.6, 1]); return p; }
export function makeChild() { const p = makePerson('adobe1', 'wood4', { skin: 'skin1', hair: 'ink', shoes: 'skin1' }); p.root.scale.setScalar(0.62); return p; }
export function makeTelegrapher() {
  const p = makePerson('cream', 'grey1', { skin: 'skin1', hair: 'ink', shoes: 'wood5' }); box(p.torso, 0.4, 0.3, 0.3, M('wood4'), 0, 0.25, 0.02); cyl(p.head, 0.13, 0.13, 0.02, M('green2'), 0, 0.22, 0.03, null, 12); box(p.head, 0.2, 0.04, 0.1, M('green2'), 0, 0.2, 0.12);
  for (const a of p.arms) cyl(a.sh, 0.055, 0.055, 0.03, M('steel1'), 0, -0.2, 0, null, 8); return p;
}

// ---------------------------------------------------------------- poses
const rot = (g, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);
export function poseStand(p, t, look = 0, ph = 0) {
  const b = Math.sin(TAU * t / 5 + ph); p.sitting = false; if (p.skirt) { p.skirt.scale.set(1, 1, 1); p.skirt.position.z = 0; for (const m of p.skirtSit) m.visible = false; }
  p.pel.position.y = 0.86 + 0.004 * b; rot(p.pel); rot(p.torso, 0.03 * b, 0, 0); rot(p.head, 0, look, 0);
  for (const l of p.legs) { rot(l.hip); rot(l.kn); rot(l.an); }
  rot(p.arms[0].sh, 0.05, 0, -0.1); rot(p.arms[0].el, -0.15); rot(p.arms[1].sh, 0.05, 0, 0.1); rot(p.arms[1].el, -0.15);
}
/** Seated on a chair or bench: seat height 0.46. */
export function poseSit(p, t, look = 0, ph = 0, seatY = 0.46) {
  const b = Math.sin(TAU * t / 6 + ph); p.sitting = true; if (p.skirt) { p.skirt.scale.set(1, 1, 1); p.skirt.position.z = 0; for (const m of p.skirtSit) m.visible = true; }    // the skirt covers thighs, knees and shins
  p.pel.position.y = seatY + 0.2; rot(p.pel); rot(p.torso, 0.05 + 0.02 * b, 0, 0); rot(p.head, 0, look, 0);
  for (const l of p.legs) { rot(l.hip, -1.5, 0, 0); rot(l.kn, 1.5, 0, 0); rot(l.an, 0.05); }
  rot(p.arms[0].sh, -0.4, 0, -0.1); rot(p.arms[0].el, -1.0); rot(p.arms[1].sh, -0.4, 0, 0.1); rot(p.arms[1].el, -1.0);
}
/** Animated conversation: hands gesture, head nods toward the others. */
export function talk(p, t, ph, amt = 1) {
  const a = Math.sin(TAU * t / 1.7 + ph), b = Math.sin(TAU * t / 2.3 + ph * 1.7), c = Math.max(0, Math.sin(TAU * t / 5.2 + ph * 0.6));
  p.arms[1].sh.rotation.x = -0.7 - 0.45 * a * amt - 0.4 * c * amt; p.arms[1].el.rotation.x = -1.0 - 0.4 * b * amt; p.arms[0].sh.rotation.x = -0.4 - 0.15 * b * amt; p.head.rotation.x = 0.08 * a * amt;
}
export function poseWalk(p, phase, amt, look = 0) {
  const sw = Math.sin(phase), cs = Math.cos(phase); p.sitting = false; if (p.skirt) { p.skirt.scale.set(1, 1, 1); p.skirt.position.z = 0; for (const m of p.skirtSit) m.visible = false; }
  const kL = 0.05 + 0.46 * Math.max(0, -cs) + 0.22 * Math.max(0, sw), kR = 0.05 + 0.46 * Math.max(0, cs) + 0.22 * Math.max(0, -sw);
  p.pel.position.y = 0.86 + Math.abs(cs) * 0.03 * amt; rot(p.pel); rot(p.torso, 0.05 * amt, sw * 0.05, 0); rot(p.head, 0, look, 0);
  p.legs[0].hip.rotation.set(sw * 0.34 * amt, 0, 0.03); p.legs[1].hip.rotation.set(-sw * 0.34 * amt, 0, -0.03);
  p.legs[0].kn.rotation.set(kL * amt, 0, 0); p.legs[1].kn.rotation.set(kR * amt, 0, 0); p.legs[0].an.rotation.set(-kL * 0.32 * amt, 0, 0); p.legs[1].an.rotation.set(-kR * 0.32 * amt, 0, 0);
  p.arms[0].sh.rotation.set(-sw * 0.38 * amt, 0, -0.09); p.arms[1].sh.rotation.set(sw * 0.38 * amt, 0, 0.09); p.arms[0].el.rotation.set(-0.16 - Math.max(0, sw) * 0.28 * amt, 0, 0); p.arms[1].el.rotation.set(-0.16 - Math.max(0, -sw) * 0.28 * amt, 0, 0);
}

/** A saddled bay horse tied at the palenque: barrel, chest and rump as rounded masses, arched neck with mane, tapered head, jointed legs, flowing tail. */
export function makeHorse(o = {}) {
  const root = new THREE.Group(), body = J(root, 0, 0.98, 0), coat = o.coat || 'wood2', dark = o.dark || 'wood4', earS = o.mule ? 1.9 : 1;
  sph(body, 0.4, M(coat), 0, 0.0, 0.0, [0.85, 0.92, 1.9], 12, 9); sph(body, 0.33, M(coat), 0, 0.08, 0.58, [0.95, 1.1, 1.0], 10, 8); sph(body, 0.39, M(coat), 0, 0.1, -0.55, [1.0, 1.05, 1.0], 10, 8); box(body, 0.14, 0.05, 0.4, M(dark), 0, 0.37, 0.12);
  const neck = J(body, 0, 0.3, 0.72); neck.rotation.x = -0.72; cyl(neck, 0.095, 0.17, 0.8, M(coat), 0, 0.4, 0.0, null, 8); for (let i = 0; i < 7; i++) box(neck, 0.06, 0.16, 0.1, M('ink'), 0, 0.12 + i * 0.1, -0.16 + i * 0.012);          // mane along the crest
  const head = J(neck, 0, 0.8, 0.02); head.rotation.x = 1.0; cyl(head, 0.1, 0.15, 0.5, M(coat), 0, 0.06, 0.16, [Math.PI / 2 - 0.12, 0, 0], 8); cyl(head, 0.07, 0.1, 0.34, M(dark), 0, -0.04, 0.52, [Math.PI / 2 - 0.12, 0, 0], 8); sph(head, 0.075, M(dark), 0, -0.07, 0.7, [1, 0.85, 0.9], 7, 6); box(head, 0.035, 0.03, 0.3, M('cream'), 0, 0.1, 0.4, [-0.12, 0, 0]);
  for (const s of [-1, 1]) { sph(head, 0.026, M('ink'), s * 0.105, 0.1, 0.16, [0.6, 1, 1], 5, 4); cone(head, 0.035, 0.14 * earS, M(coat), s * 0.07, 0.17 + 0.03 * (earS - 1), -0.07, [-0.1, 0, -s * 0.15 * (earS > 1 ? 2.2 : 1)], 4); sph(head, 0.014, M('ink'), s * 0.035, -0.06, 0.76, [1, 1, 1], 4, 4); } box(head, 0.06, 0.1, 0.05, M('ink'), 0, 0.15, 0.02);   // eyes, ears, nostrils, forelock
  const tail = J(body, 0, 0.18, -0.9); tail.rotation.x = 0.45; cone(tail, 0.07, 0.85, M('ink'), 0, -0.4, 0, [Math.PI, 0, 0], 6); sph(tail, 0.07, M('ink'), 0, 0.0, 0.0);
  const legs = []; for (const [x, z, rear] of [[-0.2, 0.52, 0], [0.2, 0.52, 0], [-0.2, -0.55, 1], [0.2, -0.55, 1]]) {
    const l = J(body, x, -0.2, z); cyl(l, 0.075, 0.11, 0.5, M(coat), 0, -0.2, 0, null, 7); const kn = J(l, 0, -0.45, 0); if (rear) kn.rotation.x = 0.2; sph(kn, 0.065, M(coat), 0, 0, 0, [1, 1, 1], 6, 5); cyl(kn, 0.05, 0.04, 0.38, M(dark), 0, -0.2, 0, null, 6); cyl(kn, 0.06, 0.06, 0.04, M('cream'), 0, -0.37, 0, null, 6); box(kn, 0.1, 0.07, 0.13, M('ink'), 0, -0.42, 0.015);
    l.userData.kn = kn; legs.push(l); }
  if (!o.noSaddle) { sph(body, 0.38, M('wine2'), 0, 0.3, 0.02, [1.0, 0.18, 1.25], 9, 6); sph(body, 0.22, M('wood5'), 0, 0.4, -0.02, [1.0, 0.5, 1.2], 8, 6); box(body, 0.04, 0.2, 0.04, M('steel2'), 0.38, 0.0, -0.02); box(body, 0.04, 0.2, 0.04, M('steel2'), -0.38, 0.0, -0.02); }
  if (o.packs) { for (const s of [-1, 1]) { box(body, 0.22, 0.5, 0.5, M('wood0'), s * 0.42, 0.0, 0.0); box(body, 0.2, 0.06, 0.46, M('wood4'), s * 0.42, 0.28, 0.0); } box(body, 0.5, 0.1, 0.6, M('wood4'), 0, 0.36, 0); }   // blanket, saddle, stirrups
  const shadow = contactShadow(0.9, 0.02, 0.8, 1.4); root.add(shadow); return { root, body, neck, head, tail, legs, shadow };
}

// ======================================================= BAPHOMET (La Serena, 1947)
/** Stella Aguirre: a young redhead of 1947 in a green day dress with a white collar and a woollen cardigan. */
export function makeStella() {
  const p = makePerson('green2', 'green2', { skin: 'skin0', hair: 'fire', shoes: 'wood5' });
  longSkirt(p, 'green2', 0.62, 0.3, 'cream'); cyl(p.torso, 0.15, 0.17, 0.05, M('cream'), 0, 0.6, 0, null, 12);                     // white collar
  box(p.pel, 0.4, 0.04, 0.3, M('wood4'), 0, 0.03, 0);                                                                              // belt
  for (const s of [-1, 1]) { sph(p.head, 0.07, M('fire'), s * 0.1, 0.07, -0.02, [1, 1.5, 1], 8, 6); sph(p.head, 0.05, M('orange'), s * 0.1, -0.05, -0.02, [1, 1.2, 1], 7, 5); }   // red waves down to the shoulders
  sph(p.head, 0.12, M('fire'), 0, 0.15, -0.07, [1.1, 1.1, 1.2], 9, 7); box(p.head, 0.1, 0.045, 0.03, M('fire'), 0, 0.22, 0.09);       // fringe
  return p;
}
/** Hugo Miranda: Santiago, 1947: grey suit, tie, round glasses, thinning hair. */
export function makeHugo() {
  const p = makePerson('steel2', 'steel2', { skin: 'skin1', hair: 'hairG', shoes: 'ink' });
  box(p.torso, 0.1, 0.4, 0.02, M('white'), 0, 0.33, 0.2); box(p.torso, 0.045, 0.34, 0.02, M('wine'), 0, 0.31, 0.215);                // shirt and tie
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 5, 10), M('ink')); r.position.set(s * 0.045, 0.13, 0.108); p.head.add(r); }   // glasses
  box(p.head, 0.1, 0.008, 0.008, M('ink'), 0, 0.13, 0.11); box(p.head, 0.07, 0.02, 0.02, M('hairG'), 0, 0.07, 0.11);                     // bridge, moustache
  const hat = J(p.head, 0, 0.0, 0); cyl(hat, 0.115, 0.12, 0.13, M('grey1'), 0, 0.27, 0, null, 12); cyl(hat, 0.2, 0.2, 0.02, M('grey1'), 0, 0.21, 0, null, 14); cyl(hat, 0.118, 0.118, 0.035, M('ink'), 0, 0.235, 0, null, 12); hat.visible = false; p.hat = hat;
  return p;
}
/** The old woman of the stall: black shawl, headscarf, long wine skirt. Seated. */
export function makeVieja() {
  const p = makePerson('cloth', 'wine2', { skin: 'skin2', hair: 'hairG', shoes: 'ink' });
  longSkirt(p, 'wine2', 0.9, 0.38); sph(p.torso, 0.27, M('cloth'), 0, 0.5, -0.02, [1.25, 0.65, 1.05]); cone(p.torso, 0.3, 0.55, M('cloth'), 0, 0.2, -0.1, [0.2, 0, 0], 12);
  sph(p.head, 0.125, M('grey1'), 0, 0.15, -0.02, [1.05, 1.0, 1.15], 10, 8); box(p.head, 0.06, 0.02, 0.02, M('grey1'), 0, 0.21, 0.11);  // headscarf
  p.arms[1].sh.userData.k = 1; return p;
}
/** Market vendors: kind decides apron, headgear and tools. */
export function makeVendor(kind) {
  const C = { baker: ['cream', 'wood3', 'skin1'], butcher: ['cream', 'cloth', 'skin1'], fish: ['steel2', 'ink', 'skin2'], farmer: ['wood2', 'earth', 'skin2'], potter: ['tile1', 'wood4', 'skin2'], grocer: ['mustard', 'wood3', 'skin1'], smith: ['wood4', 'steel3', 'skin2'] }[kind];
  const p = makePerson(C[0], C[1], { skin: C[2], hair: 'ink', shoes: kind === 'fish' ? 'ink' : 'wood5' });
  if (kind === 'baker') { cyl(p.head, 0.11, 0.1, 0.1, M('white'), 0, 0.26, 0, null, 10); box(p.pel, 0.42, 0.55, 0.05, M('white'), 0, -0.2, 0.2); }
  if (kind === 'butcher') { box(p.pel, 0.42, 0.7, 0.05, M('white'), 0, -0.15, 0.2); box(p.pel, 0.2, 0.3, 0.06, M('red'), 0, -0.3, 0.205); cyl(p.head, 0.12, 0.13, 0.06, M('cloth'), 0, 0.25, 0, null, 10); }
  if (kind === 'fish') { cone(p.head, 0.15, 0.1, M('yellow'), 0, 0.28, 0, null, 10); cyl(p.head, 0.2, 0.2, 0.02, M('yellow'), 0, 0.22, 0, null, 12); box(p.pel, 0.45, 0.65, 0.05, M('cyan2'), 0, -0.2, 0.2); }
  if (kind === 'farmer') { cyl(p.head, 0.1, 0.12, 0.12, M('sand'), 0, 0.26, 0, null, 10); cyl(p.head, 0.26, 0.26, 0.02, M('sand'), 0, 0.2, 0, null, 14); }
  if (kind === 'potter') { box(p.pel, 0.42, 0.6, 0.05, M('sand'), 0, -0.2, 0.2); }
  if (kind === 'grocer') { cyl(p.head, 0.1, 0.1, 0.05, M('ink'), 0, 0.25, 0, null, 10); box(p.pel, 0.42, 0.55, 0.05, M('cream'), 0, -0.2, 0.2); }
  if (kind === 'smith') { box(p.pel, 0.44, 0.75, 0.06, M('wood5'), 0, -0.25, 0.2); const h = J(p.arms[1].w, 0, -0.08, 0.05); cyl(h, 0.02, 0.02, 0.4, M('wood4'), 0, 0, 0.1, [Math.PI / 2, 0, 0], 5); box(h, 0.1, 0.1, 0.16, M('steel3'), 0, 0, 0.32); p.hammer = h; }
  return p;
}
/** hen / duck / turkey: { root, head, body, kind } */
export function makeBird(kind, v = 0) {
  const root = new THREE.Group(), body = J(root, 0, 0.17, 0);
  const col = kind === 'hen' ? ['wood1', 'cream', 'fire', 'wood4'][v % 4] : kind === 'duck' ? 'cream' : 'wood5', s = kind === 'turkey' ? 1.7 : kind === 'duck' ? 0.95 : 1;
  sph(body, 0.13 * s, M(col), 0, 0, 0, [0.8, 0.85, 1.25], 8, 6); cone(body, 0.07 * s, 0.2 * s, M(kind === 'hen' ? 'wood4' : col), 0, 0.06 * s, -0.17 * s, [-2.0, 0, 0], 5);
  const head = J(body, 0, 0.1 * s, 0.13 * s); sph(head, 0.06 * s, M(kind === 'duck' ? 'green2' : col === 'cream' ? 'cream' : col), 0, 0.04 * s, 0.02 * s, [1, 1, 1], 7, 5);
  cone(head, 0.02 * s, 0.07 * s, M(kind === 'duck' ? 'orange' : 'yellow'), 0, 0.03 * s, 0.1 * s, [Math.PI / 2, 0, 0], 4);
  if (kind === 'hen') cone(head, 0.02, 0.05, M('red'), 0, 0.11, 0.0, null, 4);
  if (kind === 'turkey') { cone(head, 0.02, 0.1, M('red'), 0, -0.05, 0.08, [Math.PI, 0, 0], 4); box(body, 0.34, 0.3, 0.02, M('wood4'), 0, 0.12, -0.2, [-0.5, 0, 0]); }
  for (const x of [-1, 1]) box(root, 0.025, 0.14 * s, 0.025, M('orange'), x * 0.05, 0.07 * s, 0.0);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return { root, head, body, kind };
}
/** The figure: a seated goat-headed idol in pale carved stone (horns, beard, breasts, folded wings, one hand up, one down). Heavy: ~0.5 m tall. */
export function makeStone() {
  const root = new THREE.Group(), g = J(root, 0, 0, 0); g.scale.setScalar(1.3); const ST = 'stone0', SD = 'stone1', SS = 'stone2';
  box(g, 0.36, 0.06, 0.3, M(SS), 0, 0.03, 0); box(g, 0.3, 0.05, 0.24, M(SD, { emit: 0.3 }), 0, 0.085, 0);
  sph(g, 0.12, M(ST, { emit: 0.38 }), -0.1, 0.17, 0.06, [1.3, 0.6, 1.5], 8, 6); sph(g, 0.12, M(ST, { emit: 0.38 }), 0.1, 0.17, 0.06, [1.3, 0.6, 1.5], 8, 6);              // crossed legs
  cyl(g, 0.1, 0.13, 0.26, M(ST, { emit: 0.38 }), 0, 0.3, 0, null, 10); sph(g, 0.1, M(ST, { emit: 0.38 }), 0, 0.28, 0.03, [1.1, 1, 0.9], 8, 6);
  for (const s of [-1, 1]) sph(g, 0.045, M('stone0', { emit: 0.38 }), s * 0.055, 0.38, 0.09, [1, 1, 0.8], 7, 5);                                       // breasts
  box(g, 0.03, 0.2, 0.03, M(SD, { emit: 0.3 }), 0, 0.24, 0.11);                                                                                      // caduceus stem
  for (const s of [-1, 1]) { const w = J(g, s * 0.12, 0.45, -0.1); w.rotation.set(0.3, s * 0.2, s * 0.3); box(w, 0.06, 0.36, 0.14, M(SD, { emit: 0.3 }), 0, -0.12, 0); box(w, 0.04, 0.24, 0.1, M(ST, { emit: 0.38 }), s * 0.04, -0.12, -0.02); p_(w); }   // folded wings
  const arms = [-1, 1].map((s) => { const a = J(g, s * 0.13, 0.4, 0.02); a.rotation.set(s < 0 ? -0.1 : 0.0, 0, s * 0.5 + (s < 0 ? 0 : 0.0)); cyl(a, 0.035, 0.03, 0.2, M(ST, { emit: 0.38 }), 0, -0.1, 0.05, [0.5, 0, 0], 6); return a; });
  arms[1].rotation.set(-2.6, 0, -0.3); arms[0].rotation.set(-0.5, 0, 0.2);                                                              // the right hand raised, the left points down
  const head = J(g, 0, 0.5, 0.03); sph(head, 0.075, M(ST, { emit: 0.38 }), 0, 0.04, 0, [1, 1.1, 1], 8, 6); cone(head, 0.05, 0.14, M(ST, { emit: 0.38 }), 0, -0.01, 0.1, [Math.PI / 2 + 0.2, 0, 0], 6);   // skull and muzzle
  const jaw = J(head, 0, -0.04, 0.06); box(jaw, 0.06, 0.02, 0.1, M(SD, { emit: 0.3 }), 0, 0, 0.04);
  for (const s of [-1, 1]) { const h = J(head, s * 0.05, 0.1, -0.01); h.rotation.set(0, 0, -s * 0.5); cone(h, 0.022, 0.2, M('white', { emit: 0.5 }), 0, 0.1, 0, null, 5); const ear = cone(head, 0.02, 0.1, M(ST, { emit: 0.38 }), s * 0.09, 0.07, -0.02, [0, 0, -s * 1.2], 4); void ear; }
  const eyes = [-1, 1].map((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 5, 4), new THREE.MeshBasicMaterial({ color: P.ink })); e.position.set(s * 0.045, 0.07, 0.065); head.add(e); return e; });
  cone(head, 0.03, 0.12, M(ST, { emit: 0.38 }), 0, -0.06, 0.08, [0.2, 0, 0], 5);                                                                       // beard
  const fire = cone(head, 0.04, 0.16, new THREE.MeshBasicMaterial({ color: P.fire }), 0, 0.22, 0, null, 5); fire.visible = false; fire.castShadow = false;   // torch between the horns
  const shadow = contactShadow(0.22); root.add(shadow); root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, g, head, jaw, eyes, fire, arms, shadow };
}
function p_() {}
/** Small cream envelope with a red seal. */
export function makeLetter() { const g = new THREE.Group(); box(g, 0.26, 0.015, 0.17, M('white'), 0, 0, 0); box(g, 0.05, 0.02, 0.05, M('red'), 0, 0.01, 0.0); return g; }

// ======================================================= LA SELVA DEL PEREZOSO
const SLK = { fur: 'wood1', fur2: 'grey1', back: 'wood4', face: 'cream' };
/** Three-toed sloth hanging by four hooked claws under a branch, belly toward the branch. Faces +z. The mould's gold veins are a separate, animated material. */
export function makeSloth() {
  const root = new THREE.Group(), g = J(root, 0, 0, 0);
  // fur in distinct patches: a grey rump, a brown middle, golden shoulders and a tan chest, with a dark dorsal stripe and a few flat algae patches
  for (const [z, c, r] of [[-0.4, 'grey1', 0.26], [-0.14, 'wood2', 0.3], [0.13, 'mustard', 0.3], [0.38, 'wood1', 0.27]]) sph(g, r, M(c), 0, 0, z, [1, 0.84, 0.95], 11, 8);
  sph(g, 0.2, M('wood5'), 0, -0.17, -0.02, [0.9, 0.5, 2.3], 9, 6);
  for (const [x, y, z] of [[-0.2, -0.12, -0.3], [0.2, -0.14, 0.05], [-0.18, -0.1, 0.3]]) sph(g, 0.07, M('lime'), x, y, z, [1.3, 0.45, 1.4], 6, 4);
  const veinMat = new THREE.MeshBasicMaterial({ color: P.gold, transparent: true, opacity: 0.95 }); const veins = new THREE.Group(); g.add(veins);
  const vein = (x0, y0, z0, x1, y1, z1) => { const A = new THREE.Vector3(x0, y0, z0), B = new THREE.Vector3(x1, y1, z1), len = A.distanceTo(B), m = new THREE.Mesh(new THREE.BoxGeometry(0.022, len, 0.022), veinMat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); veins.add(m); };
  for (const s of [-1, 1]) { vein(s * 0.3, -0.05, -0.3, s * 0.31, -0.1, 0.0); vein(s * 0.31, -0.1, 0.0, s * 0.28, -0.04, 0.35); vein(s * 0.31, -0.1, 0.0, s * 0.3, -0.25, 0.12); vein(s * 0.3, -0.05, -0.3, s * 0.27, -0.2, -0.5); vein(s * 0.28, -0.04, 0.35, s * 0.2, -0.2, 0.5); vein(s * 0.3, -0.25, 0.12, s * 0.22, -0.32, 0.3); }
  vein(0, -0.34, -0.45, 0, -0.38, -0.05); vein(0, -0.38, -0.05, 0, -0.3, 0.4); vein(0, -0.38, -0.05, 0.1, -0.42, 0.1); vein(0, -0.38, -0.05, -0.1, -0.42, 0.15);
  // head: face upright (the sloth turns its head half round), pale mask with dark eye stripes
  const neck = J(g, 0, 0.0, 0.5), head = J(neck, 0, 0.05, 0.12); sph(head, 0.16, M(SLK.fur), 0, 0, 0, [1.05, 1, 0.95], 10, 8); sph(head, 0.13, M(SLK.face), 0, -0.01, 0.07, [1.1, 0.95, 0.8], 10, 8);
  for (const s of [-1, 1]) { box(head, 0.05, 0.12, 0.03, M('ink'), s * 0.065, 0.01, 0.15, [0, 0, s * 0.45]); sph(head, 0.018, M('black'), s * 0.055, 0.02, 0.165, [1, 1, 0.5], 5, 4); } sph(head, 0.03, M('ink'), 0, -0.04, 0.18, [1.3, 1, 0.8], 5, 4); box(head, 0.1, 0.012, 0.02, M('wood4'), 0, -0.085, 0.16, [0, 0, 0.05]);
  const jaw = J(head, 0, -0.08, 0.1); box(jaw, 0.08, 0.016, 0.06, M('wood3'), 0, 0, 0.03);
  // four limbs reaching up to the branch (y +0.5 above the body); claws hook over it
  const arms = [[-0.23, 0.32], [0.23, 0.32], [-0.23, -0.34], [0.23, -0.34]].map(([x, z], i) => { const sh = J(g, x, 0.22, z), el = J(sh, 0, 0.0, 0); limb(el, 0.22, 0.055, M(i < 2 ? 'mustard' : 'wood2')); el.rotation.x = Math.PI; sh.position.y = 0.22; const wr = J(el, 0, -0.22, 0); for (const c of [-1, 0, 1]) { box(wr, 0.02, 0.09, 0.02, M('wood5'), c * 0.035, -0.03, 0, [0, 0, -c * 0.12]); } void i; return { sh, el, wr }; });
  const shadow = contactShadow(0.4); shadow.visible = false; root.add(shadow);
  return { root, g, neck, head, jaw, arms, veins, veinMat };
}
function hash2(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
/** Harpy eagle: grey back, white chest with a black band, split crest, huge talons. Faces +z. */
export function makeEagle() {
  const root = new THREE.Group(), body = J(root, 0, 0, 0);
  sph(body, 0.26, M('grey1'), 0, 0, 0, [0.85, 0.95, 1.6], 10, 8); sph(body, 0.22, M('white'), 0, -0.04, 0.2, [0.85, 0.9, 1.1], 9, 7); box(body, 0.34, 0.07, 0.12, M('ink'), 0, 0.14, 0.34, [0.4, 0, 0]);
  const head = J(body, 0, 0.2, 0.42); sph(head, 0.14, M('hairG'), 0, 0.04, 0, [1, 1, 1.05], 9, 7); cone(head, 0.04, 0.1, M('yellow'), 0, -0.02, 0.17, [Math.PI / 2 + 0.5, 0, 0], 5); sph(head, 0.02, M('black'), -0.07, 0.06, 0.1, [1, 1, 1], 5, 4); sph(head, 0.02, M('black'), 0.07, 0.06, 0.1, [1, 1, 1], 5, 4);
  for (let i = 0; i < 5; i++) cone(head, 0.02, 0.18, M(i % 2 ? 'ink' : 'grey1'), (i - 2) * 0.05, 0.2, -0.06, [-0.5, 0, (i - 2) * 0.35], 4);                      // crest
  const wings = [-1, 1].map((s) => { const w = J(body, s * 0.2, 0.08, 0.1); for (let k = 0; k < 4; k++) box(w, 0.5, 0.025, 0.28 - k * 0.04, M(k % 2 ? 'grey1' : 'ink'), s * (0.3 + k * 0.5), -0.01 * k, -0.05 * k); return w; });
  const tail = J(body, 0, 0, -0.45); for (let k = -2; k <= 2; k++) box(tail, 0.07, 0.02, 0.5, M(k % 2 ? 'white' : 'ink'), k * 0.07, 0, -0.25, [0, k * 0.1, 0]);
  const legs = [-1, 1].map((s) => { const l = J(body, s * 0.1, -0.2, 0.15); cyl(l, 0.04, 0.05, 0.28, M('yellow'), 0, -0.14, 0, null, 5); for (const c of [-1, 0, 1]) cone(l, 0.015, 0.09, M('ink'), c * 0.035, -0.3, 0.05, [Math.PI / 2 + 0.4, 0, 0], 4); return l; });
  const shadow = contactShadow(0.3); shadow.visible = false; root.add(shadow);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, body, head, wings, tail, legs };
}
/** Emerald chafer: the insect that lands on the empty tip. Scaled up so it reads. */
export function makeBeetle() {
  const root = new THREE.Group(), body = J(root, 0, 0, 0); sph(body, 0.09, M('green'), 0, 0, 0, [1, 0.7, 1.5], 8, 6); sph(body, 0.06, M('lime'), 0, 0.03, -0.02, [1, 0.5, 1.3], 6, 5); sph(body, 0.045, M('ink'), 0, 0, 0.14, [1, 0.8, 1], 5, 4);
  const wings = [-1, 1].map((s) => { const w = J(body, s * 0.06, 0.05, -0.02); box(w, 0.2, 0.008, 0.1, M('ice'), s * 0.1, 0, 0); return w; });
  for (const s of [-1, 1]) for (const z of [-0.06, 0, 0.06]) box(body, 0.1, 0.01, 0.01, M('ink'), s * 0.08, -0.06, z, [0, 0, s * 0.5]);
  root.scale.setScalar(1.8); root.traverse((o) => { if (o.isMesh) o.castShadow = false; }); return { root, body, wings };
}
export function makeMacaw() {
  const root = new THREE.Group(), body = J(root, 0, 0, 0); sph(body, 0.12, M('red'), 0, 0, 0, [0.8, 1, 1.5], 8, 6); sph(body, 0.08, M('red'), 0, 0.1, 0.18, [1, 1, 1], 7, 5); cone(body, 0.03, 0.08, M('white'), 0, 0.09, 0.3, [Math.PI / 2, 0, 0], 4); cone(body, 0.03, 0.1, M('ink'), 0, 0.04, 0.3, [Math.PI / 2 + 0.7, 0, 0], 4);
  for (let k = 0; k < 3; k++) box(body, 0.05, 0.015, 0.32, M(['blue', 'yellow', 'red'][k]), (k - 1) * 0.05, -0.02, -0.38, [0, (k - 1) * 0.08, 0]);
  const wings = [-1, 1].map((s) => { const w = J(body, s * 0.1, 0.05, 0.02); box(w, 0.34, 0.02, 0.2, M('blue'), s * 0.17, 0, 0); box(w, 0.3, 0.02, 0.07, M('yellow'), s * 0.17, 0, 0.12); return w; });
  return { root, body, wings };
}
export function makeToucan() {
  const root = new THREE.Group(), body = J(root, 0, 0, 0); sph(body, 0.1, M('ink'), 0, 0, 0, [0.8, 1, 1.4], 8, 6); sph(body, 0.07, M('white'), 0, 0.02, 0.1, [1, 1, 0.7], 6, 5); sph(body, 0.065, M('ink'), 0, 0.12, 0.14, [1, 1, 1], 7, 5);
  const beak = J(body, 0, 0.1, 0.2); cone(beak, 0.05, 0.3, M('orange'), 0, 0, 0.14, [Math.PI / 2, 0, 0], 5); cone(beak, 0.025, 0.12, M('yellow'), 0, 0.03, 0.05, [Math.PI / 2, 0, 0], 4);
  box(body, 0.08, 0.02, 0.22, M('ink'), 0, -0.05, -0.28, [0.2, 0, 0]); return { root, body, beak };
}
export function makeHowler() {
  const root = new THREE.Group(), body = J(root, 0, 0, 0); sph(body, 0.22, M('wine2'), 0, 0.28, 0, [1, 1.2, 0.9], 9, 7); const head = J(body, 0, 0.62, 0.05); sph(head, 0.13, M('wine2'), 0, 0, 0, [1, 1, 1], 8, 6); sph(head, 0.09, M('ink'), 0, -0.03, 0.09, [1, 0.9, 0.7], 6, 5); sph(head, 0.075, M('wood4'), 0, -0.16, 0.0, [0.9, 1.2, 0.8], 6, 5);
  for (const s of [-1, 1]) { const a = J(body, s * 0.2, 0.42, 0.05); limb(a, 0.3, 0.05, M('wine2')); a.rotation.x = -0.2; const l = J(body, s * 0.15, 0.05, 0.1); limb(l, 0.3, 0.06, M('wine2')); l.rotation.x = -1.3; }
  const tail = J(body, 0, 0.1, -0.2); for (let i = 0; i < 7; i++) sph(tail, 0.05, M('wine2'), 0, -0.08 * i, -0.06 * i - 0.05, [1, 1, 1], 5, 4); return { root, body, head, tail };
}
export function makeMorpho() { const root = new THREE.Group(), body = J(root, 0, 0, 0); box(body, 0.015, 0.015, 0.1, M('ink'), 0, 0, 0); const w = [-1, 1].map((s) => { const q = J(body, 0, 0, 0); box(q, 0.16, 0.006, 0.12, M('cyan'), s * 0.08, 0, 0); box(q, 0.1, 0.006, 0.05, M('blue'), s * 0.07, 0, -0.07); return q; }); root.scale.setScalar(1.5); return { root, body, wings: w }; }
/** A field researcher: wide-brimmed hat, vest, boots. */
export function makeResearcher(woman) {
  const p = makePerson(woman ? 'sand' : 'adobe1', woman ? 'wood2' : 'wood3', { skin: woman ? 'skin1' : 'skin3', hair: woman ? 'wood5' : 'ink', shoes: 'wood5' });
  box(p.torso, 0.4, 0.38, 0.28, M(woman ? 'leaf' : 'green2'), 0, 0.33, 0, null);                                                        // vest
  cyl(p.head, 0.11, 0.115, 0.1, M('cream'), 0, 0.27, 0, null, 12); cyl(p.head, 0.26, 0.26, 0.02, M('cream'), 0, 0.21, 0, null, 14);       // hat
  if (woman) sph(p.head, 0.05, M('wood5'), 0, 0.08, -0.12, [1, 1.3, 1], 6, 5);
  else { for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 5, 10), M('ink')); r.position.set(s * 0.045, 0.13, 0.108); p.head.add(r); } }
  const nb = J(p.arms[1].w, 0, -0.06, 0.06); box(nb, 0.16, 0.02, 0.11, M('white'), 0, 0, 0); p.notebook = nb;
  return p;
}
