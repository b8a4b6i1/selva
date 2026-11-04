import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 500, height: 300 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(process.env.URL || 'http://127.0.0.1:4240/index.html?t=2'); await p.waitForFunction(() => window.__dioramaReady === true, null, { timeout: 120000 });
const r = await p.evaluate(() => { const d = window.__diorama, C = d.stage.collider; let maxDisp = 0, maxPen = 0, whoD = '', whoP = '', nan = 0, prev = null, maxStep = 0, stepWho = '';
  for (let t = 0; t <= 90; t += 0.1) { d.stage.update(t); for (const it of C.items) { const dx = it.root.position.x - it.bx, dz = it.root.position.z - it.bz, m = Math.hypot(dx, dz); if (m > maxDisp) { maxDisp = m; whoD = it.name + '@' + t.toFixed(1); } if (!isFinite(it.root.position.x + it.root.position.z)) nan++; }
    const pen = C.penetration(); if (pen.m > maxPen) { maxPen = pen.m; whoP = pen.who + '@' + t.toFixed(1); }
    const cur = C.items.map((it) => [it.root.position.x, it.root.position.z, it.root.visible]); if (prev) cur.forEach((c, i) => { if (c[2] && prev[i][2]) { const s = Math.hypot(c[0] - prev[i][0], c[1] - prev[i][1]); if (s > maxStep) { maxStep = s; stepWho = C.items[i].name + '@' + t.toFixed(1); } } }); prev = cur; }
  return { maxDisp, whoD, maxPen, whoP, nan, maxStep, stepWho }; });
console.log(JSON.stringify(r), errs); await b.close();
