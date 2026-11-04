import * as THREE from 'three';
import { P } from './palette.js';
import { T, LOOP, TAU, clamp, lerp, smooth, win, hash } from './config.js';
import { makeSloth, makeEagle, makeBeetle, makeMacaw, makeToucan, makeHowler, makeMorpho, makeResearcher, poseStand, poseSit, poseWalk, talk } from './scene/people.js';
import { keyPath, loopPath, lerpAngle } from './scene/paths.js';
import { createCollider } from './scene/collide.js';

const bump = (t, a, b, c, d) => smooth((t - a) / Math.max(1e-6, b - a)) * (1 - smooth((t - c) / Math.max(1e-6, d - c)));
const W = (hz) => TAU * Math.round(hz * LOOP) / LOOP;
const PI = Math.PI, V = (x, y, z) => new THREE.Vector3(x, y, z);
export function createStage(scene, parts, lights) {
  const root = new THREE.Group(); scene.add(root);
  const cast = []; const add = (p, upd, o = {}) => { root.add(p.root); cast.push({ p, upd, ...o }); return p; };
  const BY = parts.branchY, BZ = parts.branchZ, TIP = parts.tip, PIECE = parts.rotten;
  const ghostMat = new THREE.MeshBasicMaterial({ color: P.gold, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
  const ghostify = (o) => { o.traverse((m) => { if (m.isMesh) { m.material = ghostMat; m.castShadow = false; } }); return o; };

  // ======================================================= the sloth: it only ever gets to the right coordinate first
  const sloth = makeSloth(); root.add(sloth.root);
  const slothX = keyPath([[0, 1.6, BZ], [19, 4.0, BZ], [24, 4.0, BZ], [46, 2.2, BZ], [70, 2.2, BZ], [90, 1.6, BZ]]);
  const slothAt = (t) => { const k = slothX(t); return k.x; };
  const slothPos = (t, out) => out.set(slothAt(t), BY - 0.57 + 0.004 * Math.sin(t * W(0.3)), BZ);
  // ======================================================= the insect, its ghost, and the future branch ghost
  const beetle = makeBeetle(); root.add(beetle.root);
  const gBeetle = makeBeetle(); ghostify(gBeetle.root); root.add(gBeetle.root); gBeetle.root.scale.setScalar(2.1);
  const gBranch = ghostify(new THREE.Group()); { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.2, 8), ghostMat); m.rotation.z = PI / 2; gBranch.add(m); } root.add(gBranch);
  const HIT = V(3.25, 4.79, -2.12), G = 1.26;
  // ======================================================= the eagle
  const eagle = makeEagle(); root.add(eagle.root);
  const EA = parts.perch.clone().add(V(0, 0.42, 0)), EB = V(2.2, 3.7, -1.3), GR = V(6.4, 0.55, 0.2), OUT = V(17, 12.5, -9);
  const dive = (u, out) => out.copy(EA).lerp(EB, Math.pow(u, 1.15));
  const eagleState = (t) => {
    const EY = Math.atan2(EB.x - EA.x, EB.z - EA.z), s = { pos: EA.clone(), yaw: EY, pitch: 0, roll: 0, flap: 0, fold: 1, vis: true, head: 0, tumble: 0 };
    if (t < T.takeoff) { const lk = bump(t, T.eagleLook - 2, T.eagleLook, T.takeoff - 0.2, T.takeoff); s.head = lk; s.pos.y += -0.05 * bump(t, T.takeoff - 1.5, T.takeoff - 0.5, T.takeoff - 0.2, T.takeoff); }
    else if (t < T.hit) { const u = (t - T.takeoff) / (T.impact + 0.8 - T.takeoff); dive(u, s.pos); s.yaw = Math.atan2(EB.x - EA.x, EB.z - EA.z); s.pitch = 0.55 * smooth((t - T.takeoff) / 1.2); s.fold = smooth((t - T.takeoff) / 1.5); s.flap = (1 - s.fold) * 1.0; }
    else if (t < T.eagleGround) { const hp = dive((T.hit - T.takeoff) / (T.impact + 0.8 - T.takeoff), V(0, 0, 0)), tau = (t - T.hit) / (T.eagleGround - T.hit), e = smooth(tau); s.pos.set(lerp(hp.x, GR.x, e), lerp(hp.y, GR.y, tau * tau), lerp(hp.z, GR.z, e)); s.yaw = EY + tau * 5; s.pitch = 0.55 + tau * 9 * (1 - tau * 0.6); s.roll = tau * 7 * (1 - tau); s.fold = 0.4; s.flap = 0.7 * (1 - tau); }
    else if (t < T.eagleUp) { s.pos.copy(GR); s.yaw = 2.6 + 0.4 * Math.sin(t * W(0.5)); s.pitch = -0.1; s.fold = 0.55 + 0.3 * Math.sin(t * W(1.5)); s.head = Math.sin(t * W(3)) * 0.8; s.tumble = 1; }
    else if (t < T.eagleGone) { const k = smooth(win(t, T.eagleUp, T.eagleGone - T.eagleUp)); s.pos.copy(GR).lerp(OUT, k); s.pos.y += 1.6 * Math.sin(Math.min(1, k * 2) * PI / 2) * (1 - k); s.yaw = Math.atan2(OUT.x - GR.x, OUT.z - GR.z); s.pitch = -0.3 * (1 - k); s.fold = 0; s.flap = 1; }
    else if (t < T.eagleBack0) s.vis = false;
    else if (t < T.eagleBack1) { const k = smooth(win(t, T.eagleBack0, T.eagleBack1 - T.eagleBack0)); s.pos.copy(OUT).lerp(EA, k); s.pos.y += 1.2 * Math.sin(k * PI); s.yaw = Math.atan2(EA.x - OUT.x, EA.z - OUT.z) * (1 - smooth(win(t, T.eagleBack1 - 1.5, 1.5))) + EY * smooth(win(t, T.eagleBack1 - 1.5, 1.5)); s.pitch = 0.1 * (1 - k); s.fold = k > 0.85 ? (k - 0.85) / 0.15 : 0; s.flap = k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1; }
    return s;
  };
  // ======================================================= the rotten branch: creaks, drops ahead of the eagle, rots into gold dust, regrows
  const pieceState = (t) => {
    const home = PIECE.userData.home, s = { pos: home.clone(), rot: V(0, 0, 0), scale: 1, vis: true, glow: 0 };
    if (t < T.crack) { const sh = bump(t, T.crack - 1.4, T.crack - 0.1, T.crack - 0.05, T.crack); s.pos.y += 0.02 * Math.sin(t * W(9)) * sh; s.rot.z += 0.012 * Math.sin(t * W(7)) * sh; }
    else if (t < T.fall) { s.rot.z += -0.04 * smooth((t - T.crack) / (T.fall - T.crack)); s.pos.y -= 0.03; }
    else if (t < T.hit) { const d = t - T.fall; s.pos.y = home.y - 0.5 * G * d * d - 0.03; s.rot.z = -0.05 - 0.35 * d; s.pos.x -= 0.03 * d; }
    else if (t < T.impact) { const d = t - T.hit, y0 = home.y - 0.5 * G * (T.hit - T.fall) ** 2 - 0.03; s.pos.y = Math.max(0.22, y0 - 6 * d * d); s.rot.z = -0.05 - 0.35 * (T.hit - T.fall) - 1.3 * d; s.rot.y += 0.4 * d; }
    else if (t < T.rotDust0) { s.pos.y = 0.2 + 0.1 * Math.max(0, Math.sin((t - T.impact) * 14)) * Math.exp(-(t - T.impact) * 3); s.rot.z = 0.1; s.rot.y = 0.45; s.rot.x = 0.05; }
    else if (t < T.rotDust1) { const k = win(t, T.rotDust0, T.rotDust1 - T.rotDust0); s.pos.y = 0.2; s.rot.z = 0.1; s.rot.y = 0.45; s.scale = 1 - smooth(k); s.glow = Math.sin(k * PI); }
    else if (t < T.regrow0) s.vis = false;
    else if (t < T.regrow1) { const k = win(t, T.regrow0, T.regrow1 - T.regrow0); s.scale = smooth(k); s.glow = Math.sin(k * PI); }
    s.vis = s.vis && s.scale > 0.01; return s;
  };

  // ======================================================= researchers: Dr. Uribe writes on a stool, Dr. Acharya films the sloth and, once, walks up to it
  const HIDE = parts.hide, TRI = parts.tripod, TY = parts.tripodYaw;
  const stoolG = new THREE.Group(); stoolG.position.set(HIDE.x - 0.2, HIDE.y, HIDE.z - 0.2); root.add(stoolG); { const m = (c) => new THREE.MeshStandardMaterial({ color: P[c], roughness: 0.9 }); const sa = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.4), m('wood2')); sa.position.y = 0.4; stoolG.add(sa); for (const [a, b] of [[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), m('wood4')); l.position.set(a, 0.2, b); stoolG.add(l); } }
  const uribe = add(makeResearcher(true), (p, t) => {
    const yaw = Math.atan2(2.2 - HIDE.x, -1.5 - HIDE.z); p.root.position.set(HIDE.x - 0.2, HIDE.y - 0.02, HIDE.z - 0.2); p.root.rotation.y = yaw; poseSit(p, t, 0, 0.5, 0.46); p.shadow.visible = true;
    const react = bump(t, T.crack, T.crack + 0.3, T.crack + 3.5, T.crack + 4.5), watch = bump(t, T.ghostBeetle0 + 8, T.land - 1, T.snap + 3, T.snap + 5) + bump(t, T.eagleLook - 4, T.eagleLook, T.impact + 3, T.impact + 5) + bump(t, T.approach0 - 1, T.approach0 + 1, T.retreat, T.retreat + 2);
    const wr = Math.max(0, 1 - react - Math.min(1, watch)); p.torso.rotation.x = 0.35 * wr; p.head.rotation.x = 0.35 * wr - 0.1 * (1 - wr); p.head.rotation.y = 0.0;
    p.arms[1].sh.rotation.set(-0.95 * wr - 0.2, 0, 0.1); p.arms[1].el.rotation.set(-1.2 * wr + 0.09 * Math.sin(t * W(3)) * wr - 0.3, 0, 0); p.arms[0].sh.rotation.set(-0.5, 0, -0.1); p.arms[0].el.rotation.set(-0.9, 0, 0);
    if (react > 0.1 || watch > 0.1) { const k = Math.max(react, Math.min(1, watch)); p.head.rotation.y = 0.0 * k; p.torso.rotation.x = -0.05; p.arms[0].sh.rotation.set(-0.3, 0, -0.1); p.arms[0].el.rotation.set(-0.3, 0, 0); p.arms[1].sh.rotation.set(-0.9 * react - 0.3, 0, 0.3 + 0.4 * react); p.arms[1].el.rotation.set(-1.6 * react - 0.3, 0, 0); }
  }, { fixed: true });
  const AD = V(Math.sin(TY), 0, Math.cos(TY)), AST = V(TRI.x - AD.x * 1.15, 0, TRI.z - AD.z * 1.15);
  const wayA = keyPath([[0, AST.x, AST.z, 'f', TY], [T.approach0, AST.x, AST.z, 'f', TY], [T.approach0 + 1.8, -4.3, 1.0], [T.approach1, -0.2, 1.0, 'f', 2.38], [T.retreat, -0.2, 1.0, 'f', 2.38], [T.retreat + 4, -4.3, 1.0], [T.retreat + 6.5, AST.x, AST.z, 'f', TY], [90, AST.x, AST.z, 'f', TY]]);
  const acharya = add(makeResearcher(false), (p, t) => {
    const r = wayA(t); p.root.position.set(r.x, 0, r.z); p.root.rotation.y = r.yaw; p.shadow.visible = true;
    if (r.moving) { poseWalk(p, r.d * TAU / 1.1, 1, 0); return; }
    poseStand(p, t, 0, 1.1);
    const atCam = Math.hypot(r.x - AST.x, r.z - AST.z) < 0.3, react = bump(t, T.crack, T.crack + 0.3, T.crack + 3.5, T.crack + 4.5);
    if (atCam) { const lean = 0.35 * (1 - react); p.torso.rotation.x = lean; p.head.rotation.x = 0.2 * (1 - react); p.arms[0].sh.rotation.set(-1.1 * (1 - react), 0, -0.15); p.arms[0].el.rotation.set(-1.3 * (1 - react), 0, 0); p.arms[1].sh.rotation.set(-1.0 * (1 - react) - 0.3 * react, 0, 0.1 + 0.9 * react); p.arms[1].el.rotation.set(-1.0 * (1 - react) - 0.4 * react, 0, 0); if (react > 0.2) { p.arms[0].sh.rotation.set(-0.4, 0, -0.9 * react); p.torso.rotation.x = -0.1 * react; } }
    else { p.arms[1].sh.rotation.set(-0.6, 0, 0.2); p.arms[1].el.rotation.set(-1.0, 0, 0); p.head.rotation.x = 0.1; }               // up close: hands half raised, careful
  });

  // ======================================================= the rest of the forest: macaws, toucan, howler monkey, morphos
  const macaws = [[2, -3.2, 7.0, 3.4, 30, 0.0, 6.4], [1, -3.8, 6.0, 3.0, 45, 0.5, 7.2], [-1, -2, 5.4, 2.6, 22.5, 0.2, 5.9]].map(([cx, cz, rx, rz, per, ph, y], i) => {
    const pts = []; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); } const lp = loopPath(pts, per, ph), m = makeMacaw();
    add(m, (p, t) => { const r = lp(t), f = Math.sin(t * W(3.3) + i); p.root.position.set(r.x, y + 0.5 * Math.sin(t * W(0.2) + i), r.z); p.root.rotation.y = r.yaw; p.root.rotation.z = 0.2 * Math.sin(t * W(0.3)); p.wings[0].rotation.z = -0.6 * f; p.wings[1].rotation.z = 0.6 * f; p.shadow = { visible: false }; }, { fly: true }); return m; });
  const toucan = add(makeToucan(), (p, t) => { p.root.position.copy(parts.toucanPerch).add(V(0, 0.12, 0)); p.root.rotation.y = 1.0 + 0.6 * Math.sin(t * W(0.1)); p.body.rotation.x = -0.1 * Math.max(0, Math.sin(t * W(0.4))); p.beak.rotation.x = 0.2 * Math.max(0, Math.sin(t * W(0.8))); p.shadow = { visible: false }; }, { fly: true });
  const howler = add(makeHowler(), (p, t) => { p.root.position.copy(parts.monkeyPerch).add(V(0, 0, 0.05)); p.root.rotation.y = 0.7; const how = bump(t, T.approach0 - 0.5, T.approach0, T.approach0 + 3, T.approach0 + 3.5); p.head.rotation.x = -0.4 * how; p.head.rotation.y = 0.5 * Math.sin(t * W(0.15)) * (1 - how); p.tail.rotation.z = 0.2 * Math.sin(t * W(0.4)); p.shadow = { visible: false }; }, { fly: true });
  for (let i = 0; i < 4; i++) { const cx = [-2.5, 6.5, 3.5, -7][i], cz = [3.2, 0.5, -3.5, -1][i], pts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; pts.push([cx + Math.cos(a) * (1.4 + 0.5 * hash(i)), cz + Math.sin(a * 1) * (1.0 + 0.3 * hash(i + 3))]); } const lp = loopPath(pts, 22.5 + i * 7.5, i * 0.2), m = makeMorpho();
    add(m, (p, t) => { const r = lp(t), f = Math.sin(t * W(4) + i); p.root.position.set(r.x, 1.3 + 0.5 * Math.sin(t * W(0.5) + i) + 0.8 * hash(i), r.z); p.root.rotation.y = r.yaw; p.wings[0].rotation.z = 0.9 * f; p.wings[1].rotation.z = -0.9 * f; }, { fly: true }); }

  // ======================================================= solid bodies: the researchers; flyers have none
  const bodies = cast.filter((c) => !c.fly).map((c, i) => ({ root: c.p.root, r: 0.29, mass: 1, rig: c.p, name: 'c' + i, fixedAlways: !!c.fixed }));
  const collider = createCollider(bodies, parts.rects);

  // ======================================================= effects: gold filaments, spores and dust, feather bursts
  const NS = 420, sparks = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), NS), sd = new THREE.Object3D(); sparks.frustumCulled = false; root.add(sparks);
  const pc = ((m) => (n) => m[n] || (m[n] = new THREE.Color(P[n])))({}), nv = (a, i) => hash(a * 1.7 + i * 13.3);
  const events = [], burst = (t0, o, cols, n = 50, life = 1.8, v = 1.6, up = 1.0, size = 0.1, g = 1.2) => events.push({ t0, life, n, o, v, up, g, size, cols });
  burst(T.hit, [HIT.x, HIT.y, HIT.z], ['white', 'grey0', 'ink', 'hairG', 'grey1'], 70, 2.4, 2.4, 1.0, 0.1, 2.2);
  burst(T.impact, [PIECE.userData.home.x - 0.1, 0.3, PIECE.userData.home.z], ['wood3', 'leaf', 'earth', 'wood4', 'green2'], 40, 1.6, 1.8, 1.8, 0.1, 6);
  burst(T.snap, [TIP.x, TIP.y, TIP.z], ['lime', 'green', 'lamp', 'gold'], 16, 1.0, 0.5, 0.8, 0.05, 1.5);
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), sp = V(0, 0, 0);
  const trail = (a, b, t, n, col, s0, speed) => { for (let j = 0; j < n; j++) { const u = ((j / n) + t * speed) % 1; tmp2.lerpVectors(a, b, u); const f = Math.sin(u * PI); put(tmp2.x + 0.06 * Math.sin(j * 7 + t * 3), tmp2.y + 0.06 * Math.cos(j * 5 + t * 2), tmp2.z, s0 * (0.4 + f), col); } };
  let k = 0; const put = (x, y, z, s, c) => { if (k >= NS) return; sd.position.set(x, y, z); sd.scale.setScalar(s); sd.rotation.set(0, 0, 0); sd.updateMatrix(); sparks.setMatrixAt(k, sd.matrix); sparks.setColorAt(k, pc(c)); k++; };
  const BEETLE_FROM = V(11.5, 6.4, 6.5);

  function update(t) {
    t = clamp(t, 0, LOOP);
    collider.restore();
    for (const c of cast) c.upd(c.p, t);
    for (const b of bodies) b.fixed = b.fixedAlways || !!b.rig.sitting;
    collider.resolve();
    // ---- sloth
    slothPos(t, tmp); sloth.root.position.copy(tmp); sloth.root.rotation.y = PI / 2;
    const sk = slothX(t), crawl = (tmp.x * 3.2) % TAU, mv = sk.moving ? 1 : 0, ap = bump(t, T.approach0, T.approach1, T.retreat, T.retreat + 3);
    sloth.arms.forEach((a, i) => { const ph = crawl + i * PI / 2, lift = mv * Math.max(0, Math.sin(ph)); a.sh.rotation.z = (i % 2 ? 1 : -1) * 0.12 * lift; a.sh.rotation.x = 0.35 * lift * (i < 2 ? 1 : -1) * 0.5; });
    const eat = bump(t, T.snap - 0.35, T.snap, T.snap + 0.2, T.snap + 0.9), watchBeetle = bump(t, T.beetleIn, T.land, T.snap, T.snap + 1);
    sloth.neck.position.z = 0.5 + 0.25 * eat; sloth.neck.rotation.x = 0.0; sloth.head.rotation.x = -0.1 + 0.15 * eat; sloth.head.rotation.y = 0.12 * Math.sin(t * W(0.2)) * (1 - ap) + 0.7 * ap * 0 + 0.0;
    sloth.head.rotation.z = 0.05 * Math.sin(t * W(0.15)); sloth.jaw.rotation.x = 0.5 * eat + 0.12 * Math.max(0, Math.sin(t * W(0.35)));
    const front = sloth.arms[1]; front.sh.rotation.x = -0.9 * eat; front.el.rotation.x = 0;
    sloth.root.scale.set(1.3, 1.3, 1.3 * (1 + 0.01 * Math.sin(t * W(0.33))));
    // the mould: its veins pulse like slow thinking; when someone steps close they flicker red
    const think = bump(t, T.ghostBeetle0, T.ghostBeetle0 + 2, T.land, T.land + 2) + bump(t, T.ghostHit0, T.ghostHit0 + 2, T.impact - 0.5, T.impact + 1.2), wave = 0.5 + 0.5 * Math.sin(t * W(1.0));
    sloth.setGlow(ap > 0.05 && hash(Math.floor(t * 9)) > 0.4 ? P.fire : P.gold, ap > 0.05 ? 0.35 : 0.04 + 0.1 * Math.min(1, 0.4 * wave + think));
    lights.glow.position.set(tmp.x, tmp.y + 0.9, tmp.z + 1.6); lights.glow.intensity = 0.25 * (0.5 + 0.5 * Math.min(1, think + ap * 0.6 + 0.3 * wave));
    // ---- beetle: it is already there in the mould's picture before it exists
    const gv = bump(t, T.ghostBeetle0, T.ghostBeetle0 + 2, T.land - 0.5, T.land + 0.3);
    gBeetle.root.visible = gv > 0.01; gBeetle.root.position.set(TIP.x, TIP.y + 0.08, TIP.z); gBeetle.root.rotation.y = -0.5; ghostMat.opacity = 0.0; gBeetle.root.userData.o = 0.4 * gv * (0.6 + 0.4 * Math.sin(t * W(2)));
    const bVis = t >= T.beetleIn && t < T.snap; beetle.root.visible = bVis;
    if (bVis) { const u = clamp((t - T.beetleIn) / (T.land - T.beetleIn), 0, 1), e = smooth(u); beetle.root.position.set(lerp(BEETLE_FROM.x, TIP.x, e) + 0.4 * Math.sin(u * 12) * (1 - e), lerp(BEETLE_FROM.y, TIP.y + 0.1, e) + 0.35 * Math.sin(u * 9) * (1 - e), lerp(BEETLE_FROM.z, TIP.z, e) + 0.3 * Math.cos(u * 8) * (1 - e)); beetle.root.rotation.y = Math.atan2(TIP.x - BEETLE_FROM.x, TIP.z - BEETLE_FROM.z) * (1 - e) - 0.5 * e; const fl = u < 1 ? Math.sin(t * W(14)) : 0.05 * Math.sin(t * W(1)); beetle.wings[0].rotation.z = 0.9 * fl; beetle.wings[1].rotation.z = -0.9 * fl; }
    // ---- the eagle
    const es = eagleState(t); eagle.root.visible = es.vis; if (es.vis) { eagle.root.position.copy(es.pos); eagle.root.rotation.set(es.pitch, es.yaw, es.roll, 'YXZ'); eagle.root.scale.setScalar(1.9); eagle.head.rotation.y = es.head * 1.0 * (t < T.takeoff ? 0.0 : 1) + (t < T.takeoff ? Math.sin(t * W(0.15)) * 0.4 * (1 - es.head) : 0); if (t < T.takeoff) eagle.head.rotation.x = 0.1 * es.head + 0.05 * Math.sin(t * W(0.3));
      const fl = Math.sin(t * W(4.4)); for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; eagle.wings[i].rotation.z = s * (-1.35 * es.fold + 0.9 * es.flap * fl * -1 * (1 - 0.0)); eagle.wings[i].rotation.y = s * 0.3 * es.fold; } eagle.tail.rotation.x = 0.2 * es.fold; for (const l of eagle.legs) l.rotation.x = 0.7 * (t >= T.takeoff && t < T.eagleGround ? 1 : 0); }
    // ---- the rotten branch
    const ps = pieceState(t); PIECE.visible = ps.vis; PIECE.position.copy(ps.pos); PIECE.rotation.set(ps.rot.x, ps.rot.y, ps.rot.z); PIECE.scale.setScalar(ps.scale);
    const gb = bump(t, T.ghostHit0, T.ghostHit0 + 2.5, T.crack, T.crack + 0.4); gBranch.visible = gb > 0.01; gBranch.position.set(HIT.x - 0.2, HIT.y + 0.05, HIT.z); gBranch.rotation.set(0, -0.12, -0.5); gBranch.userData.o = 0.35 * gb * (0.6 + 0.4 * Math.sin(t * W(2)));
    ghostMat.opacity = Math.max(gBeetle.root.visible ? gBeetle.root.userData.o : 0, gBranch.visible ? gBranch.userData.o : 0);
    // ---- sparkles: the mould's threads to the future, spores, feather bursts
    k = 0;
    
    
    if (ps.glow > 0.02) { const home = PIECE.userData.home; for (let j = 0; j < 40; j++) { const a = nv(7, j), b = nv(9, j), c = nv(13, j), age = (t * 0.6 + b) % 1; put((t < T.regrow0 ? 0.85 : home.x) + (a - 0.5) * 3 * (t < T.regrow0 ? 1 : 1), (t < T.regrow0 ? 0.3 : home.y) + age * 2.4 - (t < T.regrow0 ? 0 : 0), (t < T.regrow0 ? -2.05 : home.z) + (c - 0.5) * 0.6, 0.06 * ps.glow * (1 - age), j % 3 ? 'gold' : 'yellow'); } }
    for (const E of events) { const age = t - E.t0; if (age < 0 || age > E.life) continue; const f = 1 - age / E.life; for (let j = 0; j < E.n; j++) { const a = nv(E.t0, j), b = nv(E.t0 + 9, j), c = nv(E.t0 + 19, j); put(E.o[0] + (a - 0.5) * E.v * 2 * age, Math.max(0.05, E.o[1] + E.up * (0.4 + b) * age - E.g * age * age), E.o[2] + (c - 0.5) * E.v * 2 * age, E.size * (0.4 + b) * f, E.cols[j % E.cols.length]); } }
    for (let i = k; i < NS; i++) { sd.position.set(0, -50, 0); sd.scale.setScalar(0.0001); sd.updateMatrix(); sparks.setMatrixAt(i, sd.matrix); }
    sparks.instanceMatrix.needsUpdate = true; if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
    parts.pool.scale.set(1 + 0.01 * Math.sin(t * W(1)), 1, 1);
  }
  return { update, cast, collider, actors: { sloth, eagle, uribe, acharya } };
}
