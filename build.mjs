import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const minify = process.argv.includes('--minify');

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  outfile: 'dist/app.js',
  minify,
  sourcemap: minify ? false : 'inline',
  legalComments: 'none',
  logLevel: 'info',
});

const js = await readFile('dist/app.js', 'utf8');
const safeJs = js.replace(/<\/script/gi, '<\\/script');

const css = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #1a2050;
  }
  body { -webkit-tap-highlight-color: transparent; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
  #frame {
    position: fixed;
    left: 50%;
    top: 50%;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    transform: translate(-50%, -50%);
    background: #1a2050;
  }
  @media (max-width: 620px) {
    #frame { width: 100vw; height: 100vh; height: 100dvh; }
  }
  #stage {
    display: block;
    width: 100%;
    height: 100%;
    background: #1a2050;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    outline: none;
  }
  #sndwrap { position: fixed; left: 50%; top: 80%; display: flex; flex-direction: column; align-items: center; gap: 9px; z-index: 5; }
  #snd { width: 48px; height: 48px; border: 3px solid #1a1816; background: #ffffff; padding: 4px; cursor: pointer; box-shadow: 3px 3px 0 #1a1816; image-rendering: pixelated; }
  #snd:hover, #snd:focus-visible { background: #fff6c8; outline: none; }
  #snd:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #1a1816; }
  #snd.muted { animation: sndhop 0.9s steps(2, end) infinite; }
  @keyframes sndhop { 0% { transform: translateY(0); } 50% { transform: translateY(-3px); } 100% { transform: translateY(0); } }
  #snd svg { width: 100%; height: 100%; display: block; }
  #hint { position: fixed; left: 50%; bottom: calc(22px + env(safe-area-inset-bottom)); transform: translateX(-50%); display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border: 3px solid #1a1816; box-shadow: 3px 3px 0 #1a1816; font: 700 12px/1 ui-monospace, Menlo, monospace; letter-spacing: 0.06em; color: #1a1816; z-index: 4; pointer-events: none; opacity: 0; transition: opacity 0.4s steps(4, end); white-space: nowrap; }
  #hint.on { opacity: 1; animation: hinthop 1s steps(2, end) infinite; }
  #hint svg { width: 22px; height: 22px; }
  @keyframes hinthop { 0% { transform: translateX(-50%); } 50% { transform: translateX(calc(-50% + 4px)); } 100% { transform: translateX(-50%); } }
  #boot { position: fixed; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; color: #bfeaff; font: 700 14px/1.6 ui-monospace, Menlo, monospace; letter-spacing: 0.08em; z-index: 3; pointer-events: none; white-space: pre-wrap; word-break: break-word; }
  #boot.err { color: #ffb4a8; pointer-events: auto; }
  #boot.done { display: none; }
  #fallback {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: #ffffff;
    color: #333a3d;
    font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.02em;
    text-align: center;
    padding: 2rem;
  }
  #fallback[hidden] { display: none; }
`;

const BUILD_ID = 'v' + new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '');
function page(scriptTag) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="icon" href="data:," />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow, noarchive" />
<meta name="theme-color" content="#1a2050" />
<meta name="description" content="Un perezoso espera frente a una rama vacía. Un insecto aterriza justo ahí. Un águila arpía baja en picada y una rama podrida cae antes del impacto." />
<meta property="og:title" content="La selva del perezoso" />
<meta property="og:description" content="Un perezoso espera frente a una rama vacía. Un insecto aterriza justo ahí. Un águila arpía baja en picada y una rama podrida cae antes del impacto." />
<meta property="og:type" content="website" />
${process.env.SITE_URL ? `<meta property="og:image" content="${process.env.SITE_URL}/preview.png" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<title>La selva del perezoso</title>
<style>${css}</style>
</head>
<body>
<div id="frame"><canvas id="stage" aria-label="A real-time rendered miniature diorama of a sloth waiting on a rainforest branch" tabindex="-1"></canvas></div>
<div id="sndwrap"><button id="snd" type="button" aria-label="Activar sonido" title="Sonido"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#1a1816" d="M2 6h3V5h1V4h1V3h1v10H7v-1H6v-1H5v-1H2z"/><g id="snd-on"><path fill="#1a1816" d="M10 6h1v4h-1zM12 4h1v8h-1zM14 3h1v10h-1z"/></g><g id="snd-off"><path fill="#d93a2b" d="M10 5h1v1h-1zM11 6h1v1h-1zM12 7h1v2h-1zM13 9h1v1h-1zM14 10h1v1h-1zM14 5h1v1h-1zM13 6h1v1h-1zM11 8h1v1h-1zM10 10h1v1h-1zM10 11h1v1h-1zM14 4h1v1h-1zM10 4h1v1h-1zM14 11h1v1h-1zM10 12h1v1h-1zM14 12h1v1h-1z"/></g></svg></button></div>
<div id="hint" aria-hidden="true"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#1a1816" d="M6 1h2v6h1V5h2v2h1V6h2v6h-1v2H6v-1H5v-1H4V9H3V8h2V7H6z"/><path fill="#fff" d="M7 2v7H6V8H5v1h1v1h1v1h1v1h4v-1h1V8h-1V7h-1V6h-1v2H9V2z"/></svg><span>ARRASTRA · PELLIZCA</span></div>
<div id="fallback" hidden>This diorama needs a browser with WebGL2 enabled.</div>
<div id="boot">CARGANDO…</div>
<script>(function(){var V='${BUILD_ID}',b=document.getElementById('boot');function show(m){b.className='err';b.textContent='ERROR ('+V+')\\n'+m;}
window.addEventListener('error',function(e){show((e&&e.message)||'error');});window.addEventListener('unhandledrejection',function(e){show(String(e&&e.reason&&e.reason.message||e.reason));});
var n=0,iv=setInterval(function(){if(window.__dioramaReady){b.className='done';clearInterval(iv);}else if(++n>240&&b.className!=='err'){b.textContent='Sigue cargando… ('+V+')';}},250);})();</script>
${scriptTag}
</body>
</html>
`;
}

await writeFile('index.html', page('<script src="./dist/app.js"></script>'));
await writeFile('selva.html', page(`<script>${safeJs}</script>`));

console.log(`built dist/app.js (${(js.length / 1024).toFixed(0)} kB), index.html, selva.html`);
