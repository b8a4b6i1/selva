import * as THREE from 'three';
import { P } from '../palette.js';

const cache = new Map();
/** Material from a palette name. Throws on a colour that is not in the palette. */
export function M(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  if (cache.has(key)) return cache.get(key);
  if (!P[name]) throw new Error('not a palette colour: ' + name);
  const m = new THREE.MeshStandardMaterial({ color: P[name], roughness: opts.rough ?? 0.92, metalness: opts.metal ?? 0.0,
    emissive: opts.emit ? P[name] : 0x000000, emissiveIntensity: opts.emit ?? 0, side: opts.side ?? THREE.FrontSide });
  cache.set(key, m);
  return m;
}
export const hex = (name) => new THREE.Color(P[name]);

export function box(g, w, h, d, mat, x, y, z, rot) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
export function cyl(g, rt, rb, h, mat, x, y, z, rot, seg = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
export function sph(g, r, mat, x, y, z, s = [1, 1, 1], ws = 16, hs = 12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
  m.position.set(x, y, z); m.scale.set(s[0], s[1], s[2]);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
export function cone(g, r, h, mat, x, y, z, rot, seg = 10) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  m.position.set(x, y, z); if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
/** Capsule hanging down (-Y) from the joint origin. */
export function limb(g, len, r, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 4, 10), mat);
  m.position.y = -len / 2; m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
/** Beam between two points. */
export function beam(g, a, b, t, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}

let shadowTex;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  shadowTex = new THREE.CanvasTexture(c); return shadowTex;
}
export function contactShadow(r, y = 0.02, sx = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2 * sx, r * 2 * sz),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.85 }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 2; return m;
}
/** Deterministic canvas texture helper. */
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace; t.userData = { canvas: c, ctx }; return t;
}
