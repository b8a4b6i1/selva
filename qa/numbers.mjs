import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(process.env.URL || 'http://127.0.0.1:4190/index.html?t=1'); await p.waitForFunction(() => window.__dioramaReady, null, { timeout: 120000 });
const r = await p.evaluate(() => { let bad = 0, n = 0; const d = window.__diorama; for (const t of [-0.02, -5, ...Array.from({ length: 250 }, (_, i) => i * 0.37), 90, 95]) { d.freeze(t); d.scene.traverse((o) => { n++; const q = o.matrixWorld.elements; for (let i = 0; i < 16; i++) if (!Number.isFinite(q[i])) bad++; }); } return { bad, n }; });
console.log(JSON.stringify(r), 'errors:', errs.length ? errs : 'none'); await b.close();
