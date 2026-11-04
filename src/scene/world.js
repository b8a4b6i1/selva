import * as THREE from 'three';
import { P } from '../palette.js';
import { M, box, cyl, sph, cone, beam } from './common.js';
import { SLAB, HZ, X0, X1, hash, TAU } from '../config.js';

const col = (n) => new THREE.Color(P[n]);
const STD = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 });
function instG(parent, geo, items, cast = true) {
  const m = new THREE.InstancedMesh(geo, STD(), items.length), d = new THREE.Object3D();
  items.forEach((it, i) => { d.position.set(it.x, it.y, it.z); d.scale.set(it.sx, it.sy, it.sz ?? it.sx); d.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, col(it.c)); });
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
const boxG = new THREE.BoxGeometry(1, 1, 1), sphG = new THREE.SphereGeometry(1, 7, 5), coneG = new THREE.ConeGeometry(1, 1, 5);
const LEAF = ['green', 'green2', 'leaf', 'lime', 'green2', 'green'];

export function buildWorld(scene) {
  const world = new THREE.Group(); scene.add(world); const parts = { flames: [], rects: [], lampSpots: [] };
  const R = (x0, x1, z0, z1) => parts.rects.push({ x0, x1, z0, z1 });
  // ---------------------------------------------------------------- the slab: a block of forest floor, cut so the soil layers show
  box(world, SLAB.w, 0.5, SLAB.d, M('wood5'), 0, -0.75, 0).castShadow = false; box(world, SLAB.w, 0.3, SLAB.d, M('wood4'), 0, -0.35, 0).castShadow = false; box(world, SLAB.w, 0.16, SLAB.d, M('earth'), 0, -0.12, 0).castShadow = false; box(world, SLAB.w, 0.06, SLAB.d, M('wood5'), 0, -0.01, 0).castShadow = false;
  for (let i = 0; i < 26; i++) { const x = X0 + 0.6 + hash(i * 2.3) * (SLAB.w - 1.2), y = -0.9 + hash(i * 5.1) * 0.7; sph(world, 0.12 + hash(i) * 0.12, M(i % 3 ? 'stone2' : 'stone1'), x, y, HZ - 0.02, [1, 0.8, 0.3], 6, 4).castShadow = false; }          // pebbles in the cut face
  for (let i = 0; i < 12; i++) { const x = X0 + 0.5 + hash(i * 7.7) * (SLAB.w - 1); beam(world, [x, -0.1, HZ - 0.02], [x + (hash(i) - 0.5) * 0.8, -0.8, HZ - 0.02], 0.05, M('wood3')); }       // fine roots in the front cut
  R(X0 - 3, X0, -8, 8); R(X1, X1 + 3, -8, 8); R(X0, X1, HZ, HZ + 3); R(X0, X1, -HZ - 3, -HZ);
  const litter = []; for (let i = 0; i < 160; i++) litter.push({ x: X0 + 0.4 + hash(i * 3.3) * (SLAB.w - 0.8), y: 0.04, z: -HZ + 0.4 + hash(i * 4.9) * (SLAB.d - 0.8), sx: 0.3 + hash(i) * 0.9, sy: 0.02, sz: 0.2 + hash(i + 7) * 0.6, ry: hash(i * 2) * 3, c: ['wood3', 'wood4', 'leaf', 'earth', 'green2', 'wood2'][i % 6] }); instG(world, boxG, litter, false);
  { const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.05, 14), new THREE.MeshBasicMaterial({ color: P.teal })); pool.position.set(5.6, 0.04, 3.4); world.add(pool); parts.pool = pool; R(4.0, 7.2, 1.9, 5.0); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; sph(world, 0.2, M('stone1'), 5.6 + Math.cos(a) * 1.55, 0.1, 3.4 + Math.sin(a) * 1.55, [1, 0.6, 1], 6, 4); } }

  // ---------------------------------------------------------------- big trees
  const trunk = (x, z, r0, r1, h, bark = 'wood3') => { const n = 8; for (let i = 0; i < n; i++) { const y0 = h * i / n, y1 = h * (i + 1) / n, r = r0 + (r1 - r0) * (i + 0.5) / n; cyl(world, r1 + (r0 - r1) * (1 - (i + 1) / n), r1 + (r0 - r1) * (1 - i / n), y1 - y0 + 0.02, M(i % 2 ? bark : 'wood4'), x, (y0 + y1) / 2, z, null, 10); void r; } };
  // the kapok: a buttressed giant; the sloth's branch grows from it at 4.6 m and a rotten one at 7.6 m
  const KX = -1.5, KZ = -1.5; trunk(KX, KZ, 1.0, 0.62, 8.4, 'wood3');
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; const g = new THREE.Group(); g.position.set(KX, 0, KZ); g.rotation.y = a; world.add(g); box(g, 1.6, 2.2, 0.16, M('wood4'), 0.9, 1.1, 0, [0, 0, -0.55]); box(g, 1.0, 1.0, 0.14, M('wood3'), 1.5, 0.45, 0, [0, 0, -0.4]); }
  for (let i = 0; i < 18; i++) { const a = hash(i) * TAU, y = 0.5 + i * 0.55; sph(world, 0.16, M(i % 4 === 0 ? 'lime' : 'green2'), KX + Math.cos(a) * 0.78, y, KZ + Math.sin(a) * 0.78, [1.4, 0.7, 1.4], 6, 4); }   // moss and epiphytes on the bark
  R(KX - 1.5, KX + 1.5, KZ - 1.5, KZ + 1.5);
  parts.kapok = new THREE.Vector3(KX, 0, KZ);
  // the sloth's branch: from the trunk out to a tip nobody is on yet
  const BY = 3.4, BZ = -1.5, BX0 = -0.7, TIP = 5.6; parts.branchY = BY; parts.branchZ = BZ; parts.tip = new THREE.Vector3(TIP - 0.5, BY + 0.14, BZ);
  { const segs = [[BX0, 1.6, 0.26, 0.21], [1.6, 3.6, 0.21, 0.17], [3.6, TIP, 0.17, 0.1]]; for (const [a, b, r0, r1] of segs) { cyl(world, r1, r0, b - a + 0.04, M('wood3'), (a + b) / 2, BY, BZ, [0, 0, Math.PI / 2], 8); }
    for (let i = 0; i < 9; i++) sph(world, 0.1, M(i % 3 ? 'green2' : 'lime'), BX0 + 0.8 + i * 0.55, BY + 0.2, BZ + (hash(i) - 0.5) * 0.2, [1.6, 0.6, 1], 6, 4);
    for (let k = 0; k < 4; k++) { cone(world, 0.1, 0.4, M(k % 2 ? 'red' : 'orange'), 0.4 + k * 0.1, BY + 0.38, BZ + (k - 1.5) * 0.06, [0.3 * (k - 1.5), 0, 0.2 * (k - 1.5)], 5); }                // a bromeliad
    box(world, 0.05, 1.8, 0.05, M('wood4'), 3.9, BY + 0.9, BZ, [0, 0, 0.3]); }       // a thin side twig
  // the rotten branch (it will break): a stub stays, the long piece is a group the stage moves
  { const stub = new THREE.Group(); stub.position.set(KX + 0.55, 5.7, KZ - 0.35); world.add(stub); cyl(stub, 0.15, 0.2, 0.9, M('wood5'), 0.4, 0, 0, [0, 0, Math.PI / 2], 7); cone(stub, 0.08, 0.2, M('wood5'), 0.92, 0, 0, [0, 0, -Math.PI / 2], 5);
    const piece = new THREE.Group(); world.add(piece); parts.rotten = piece; cyl(piece, 0.13, 0.17, 3.2, M('wood5'), 0, 0, 0, [0, 0, Math.PI / 2], 7);
    for (let i = 0; i < 4; i++) { cyl(piece, 0.2, 0.2, 0.05, M(i % 2 ? 'cream' : 'purple2'), -1.1 + i * 0.7, 0.06, 0.15, [0.6, 0, 0], 8); }                       // shelf fungus
    for (let i = 0; i < 5; i++) sph(piece, 0.08, M('wood4'), -1.2 + i * 0.6, -0.08, -0.1, [1.4, 1, 1], 5, 4);
    piece.userData.home = new THREE.Vector3(KX + 2.35, 5.7, KZ - 0.55); piece.position.copy(piece.userData.home); piece.rotation.set(0, -0.12, -0.03); }
  // the eagle's tree: tall, at the back left
  trunk(-8.0, -5.2, 0.7, 0.4, 9.6, 'wood4'); beam(world, [-7.6, 7.7, -5.2], [-6.0, 7.9, -5.2], 0.2, M('wood3')); beam(world, [-6.0, 7.9, -5.2], [-5.4, 8.3, -5.0], 0.12, M('wood3')); parts.perch = new THREE.Vector3(-6.8, 7.95, -5.2); R(-8.9, -7.1, -6.1, -4.3);
  // slimmer trunks and palms
  for (const [x, z, h, b] of [[4.0, -5.8, 8.2, 'wood4'], [7.2, -4.6, 7.2, 'wood3'], [9.0, -1.8, 6, 'wood4'], [-9.2, 1.5, 6.8, 'wood3']]) { trunk(x, z, 0.4, 0.28, h, b); R(x - 0.6, x + 0.6, z - 0.6, z + 0.6); }
  const palm = (x, z, h) => { trunk(x, z, 0.2, 0.14, h, 'wood2'); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; const f = new THREE.Group(); f.position.set(x, h, z); f.rotation.y = a; world.add(f); for (let k = 0; k < 4; k++) box(f, 0.5, 0.04, 0.3, M(k % 2 ? 'green' : 'leaf'), 0.45 + k * 0.5, 0.2 - k * 0.14, 0, [0, 0, -0.35 * k * 0.4]); } R(x - 0.3, x + 0.3, z - 0.3, z + 0.3); };
  palm(7.6, 0.8, 2.4); palm(-5.0, -4.2, 6.0); palm(2.4, 5.6, 2.2); palm(9.2, 4.4, 2.8);

  // ---------------------------------------------------------------- foliage: canopy blobs high up, a leafy backdrop on the back and left, ferns on the floor
  const leaves = [];
  for (const [cx, cz, ch] of [[4.0, -5.8, 8.2], [7.2, -4.6, 7.2], [9.0, -1.8, 6], [-9.2, 1.5, 6.8]]) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; leaves.push({ x: cx + Math.cos(a) * 0.8, y: ch + 0.1 + 0.25 * (k % 2), z: cz + Math.sin(a) * 0.8, sx: 1.3, sy: 0.6, sz: 1.2, c: LEAF[(k + 2) % LEAF.length], ry: a }); }
  const blob = (x, y, z, s) => { if (z < -HZ + 4 && x > -4.2 && x < 8.5 && y > 1.2) return; if (z < -1 && z > -4 && y > 7 && x > -2.5 && x < 1.5) { /* kapok crown, kept low and small */ } leaves.push({ x, y, z, sx: s * 1.6, sy: s * 0.7, sz: s * 1.5, c: LEAF[Math.floor(hash(x * 3 + y + z * 5) * LEAF.length)], ry: hash(x + z) * 3 }) };;
  for (let i = 0; i < 46; i++) blob(X0 + hash(i * 1.3) * 20, 6.6 + hash(i * 2.9) * 2.8, -HZ + 0.3 + hash(i * 4.7) * 3.2, 0.7 + hash(i) * 0.6);                  // upper canopy, behind
  for (let i = 0; i < 44; i++) blob(X0 + 0.5 + hash(i * 6.1) * 2.5, 1 + hash(i * 3.7) * 6.5, -HZ + hash(i * 1.9) * 9, 0.6 + hash(i) * 0.6);                           // left wall of foliage
  for (let i = 0; i < 70; i++) blob(X0 + hash(i * 5.3) * 20, 0.6 + hash(i * 2.1) * 7, -HZ + 0.2 + hash(i * 8.3) * 1.5, 0.6 + hash(i) * 0.7);                       // back wall
  for (let i = 0; i < 0; i++) blob(KX - 2.2 + hash(i * 9.1) * 4.4, 7.6 + hash(i * 3.1) * 1.8, KZ - 1.6 + hash(i * 7.7) * 2.4, 0.9 + hash(i) * 0.6);                  // the kapok's crown (above the story)
  for (let i = 0; i < 30; i++) blob(-8.6 + hash(i * 2.2) * 3.4, 8.8 + hash(i * 4.6) * 1.8, -5.2 + (hash(i * 6.6) - 0.5) * 3, 0.8 + hash(i) * 0.6);                       // the eagle's tree crown
  for (let i = 0; i < 12; i++) blob(6.5 + hash(i * 3.3) * 3.5, 6.4 + hash(i * 1.1) * 1.8, -6.2 + hash(i * 5.9) * 1.6, 0.8 + hash(i) * 0.5);
  for (let k = 0; k < 4; k++) leaves.push({ x: KX + (k - 1.5) * 0.35, y: 8.7 + 0.15 * (k % 2), z: KZ - 0.2 * (k % 2), sx: 0.8, sy: 0.4, sz: 0.8, c: LEAF[k], ry: k });    // a small cap of leaves where the trunk ends
  instG(world, sphG, leaves);
  const ferns = []; for (let i = 0; i < 60; i++) { const x = X0 + 0.6 + hash(i * 3.9) * (SLAB.w - 1.2), z = -HZ + 0.6 + hash(i * 7.3) * (SLAB.d - 1.2); if (Math.hypot(x - KX, z - KZ) < 1.9 || (x > -9 && x < -3.6 && z > 1.2 && z < 5.3) || (x > 3.8 && x < 7.4 && z > 1.7 && z < 5.2) || (z > -2.4 && z < 0.8 && x > -0.5 && x < 6.5)) continue; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + hash(i) * 6; ferns.push({ x: x + Math.cos(a) * 0.28, y: 0.28, z: z + Math.sin(a) * 0.28, sx: 0.5, sy: 0.04, sz: 0.16, ry: -a, rz: 0.55, c: LEAF[(i + k) % LEAF.length] }); } }
  instG(world, boxG, ferns, false);
  for (let i = 0; i < 14; i++) { const x = X0 + 0.5 + hash(i * 8.8) * 19, z = -HZ + 0.5 + hash(i * 6.2) * 13; if (Math.hypot(x - KX, z - KZ) < 1.8 || (x > 4 && x < 7.2 && z > 1.8 && z < 5)) continue; cyl(world, 0.03, 0.04, 0.16, M('cream'), x, 0.1, z, null, 5); sph(world, 0.1, M(i % 2 ? 'red' : 'orange'), x, 0.2, z, [1, 0.5, 1], 6, 4); }
  { const log = new THREE.Group(); log.position.set(2.4, 0.3, -5.0); log.rotation.y = 0.2; world.add(log); cyl(log, 0.3, 0.32, 3.6, M('wood4'), 0, 0, 0, [0, 0, Math.PI / 2], 8); for (let i = 0; i < 5; i++) sph(log, 0.16, M(i % 2 ? 'purple2' : 'cream'), -1.2 + i * 0.6, 0.28, 0.1, [1.5, 0.4, 1], 6, 4); R(0.6, 4.2, -5.6, -4.4); }
  // vines and orchids
  for (const [x, y, z, len] of [[1.2, 5.6, -2.8, 2.2], [4.4, 5.3, -2.3, 2.6], [-3.2, 7, -2.2, 3.4], [6.2, 6.5, -3.8, 3.8], [-0.5, 4.2, -1.0, 1.2], [-5.5, 7.5, -4.0, 4.6]]) { box(world, 0.05, len, 0.05, M('green2'), x, y - len / 2, z); for (let k = 0; k < 4; k++) sph(world, 0.12, M(k % 2 ? 'leaf' : 'lime'), x, y - 0.3 - k * len / 4.5, z, [1.5, 0.8, 1], 5, 4); }
  for (const [x, y, z, c] of [[0.1, BYo(), -1.7, 'pink'], [2.9, BYo() + 0.2, -1.75, 'purple2'], [4.6, BYo() + 0.2, -1.4, 'white']]) { for (let k = 0; k < 4; k++) sph(world, 0.07, M(c), x + (k - 1.5) * 0.08, y + 0.24, z + (k % 2) * 0.05, [1, 1, 0.6], 5, 4); }
  function BYo() { return BY; }

  // ---------------------------------------------------------------- the research hide: a platform and tarp at the front left, a camera on a tripod aimed at the sloth
  { const hx = -6.5, hz = 3.2; box(world, 3.4, 0.14, 2.6, M('wood2'), hx, 0.22, hz); for (const [a, b] of [[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]]) box(world, 0.12, 0.2, 0.12, M('wood4'), hx + a, 0.1, hz + b);
    for (const [a, b] of [[-1.55, -1.15], [-1.55, 1.15]]) box(world, 0.08, 2.2, 0.08, M('wood4'), hx + a, 1.3, hz + b); box(world, 0.08, 1.8, 0.08, M('wood4'), hx + 1.55, 1.1, hz - 1.15);
    box(world, 3.6, 0.04, 2.8, M('green2'), hx - 0.1, 2.35, hz, [0.06, 0, -0.04]);
    box(world, 1.2, 0.05, 0.7, M('wood3'), hx - 1.0, 0.95, hz - 0.8); for (const a of [-0.5, 0.5]) box(world, 0.05, 0.7, 0.05, M('wood4'), hx - 1.0 + a, 0.6, hz - 0.8); box(world, 0.5, 0.03, 0.34, M('steel1'), hx - 1.1, 1.0, hz - 0.8); box(world, 0.5, 0.3, 0.02, M('steel2'), hx - 1.1, 1.14, hz - 0.96, [-0.3, 0, 0]); box(world, 0.3, 0.02, 0.22, M('white'), hx - 0.6, 1.0, hz - 0.8, [0, 0.2, 0]);
    box(world, 0.34, 0.26, 0.34, M('steel3'), hx + 0.8, 0.4, hz + 0.8); R(hx - 1.8, hx + 1.7, hz - 1.4, hz + 1.4);   // the hide itself is a low solid
    parts.hide = new THREE.Vector3(hx, 0.3, hz); parts.stool = new THREE.Vector3(hx - 0.2, 0.3, hz - 0.2); }
  { const tx = -3.3, tz = 2.3, y0 = 0.02, yaw = Math.atan2(2.2 - tx, -1.5 - tz); const g = new THREE.Group(); g.position.set(tx, 0, tz); world.add(g); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + yaw; beam(g, [0, 1.35, 0], [Math.cos(a) * 0.45, y0, Math.sin(a) * 0.45], 0.03, M('steel2')); } box(g, 0.2, 0.18, 0.28, M('steel3'), 0, 1.45, 0, [0, -yaw + Math.PI / 2, 0]);
    const lens = new THREE.Group(); lens.position.set(0, 1.5, 0); lens.rotation.set(0, yaw, 0); lens.rotation.x = 0; g.add(lens); cyl(lens, 0.08, 0.1, 0.7, M('ink'), 0, 0.02, 0.4, [Math.PI / 2 + 0.28, 0, 0], 8); R(tx - 0.5, tx + 0.5, tz - 0.5, tz + 0.5); parts.tripod = new THREE.Vector3(tx, 0, tz); parts.tripodYaw = yaw; }

  // butterflies' and birds' perches: macaw branch and a howler monkey's fork on the back tree
  beam(world, [9.8, 4.9, -4.8], [6.8, 5.1, -4.5], 0.12, M('wood3')); parts.macawPerch = new THREE.Vector3(8.0, 5.2, -4.6); beam(world, [-9.8, 4.6, 0.8], [-7.6, 4.4, 0.6], 0.13, M('wood3')); parts.toucanPerch = new THREE.Vector3(-8.2, 4.6, 0.7); beam(world, [3.9, 4.7, -5.5], [6.4, 4.9, -5.3], 0.14, M('wood3')); parts.monkeyPerch = new THREE.Vector3(5.0, 4.85, -5.4);
  return parts;
}
