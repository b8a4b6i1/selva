import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 500, height: 300 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
for (const from of [0, 17, 50, 66, 84]) { await p.goto('http://127.0.0.1:4240/index.html?from=' + from); await p.waitForFunction(() => window.__dioramaReady === true, null, { timeout: 120000 }); await p.click('#snd'); await p.waitForTimeout(5000); }
console.log('running', await p.evaluate(() => window.__audio.running), 'errors', errs);
await b.close();
