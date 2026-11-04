import * as THREE from 'three';
import { PALETTE_RGB } from '../palette.js';
import { CLOUD } from './cloud-sprite.js';

const VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tScene;
uniform vec2 uResolution;
uniform vec3 uPalette[64];
uniform float uDither;
uniform float uPrint;
uniform float uTime;
uniform float uLoop;

float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// value noise that wraps in x with integer period px, so a cloud layer can drift one whole period per loop
float vnoise(vec2 p, float px) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h21(vec2(mod(i.x, px), i.y)), b = h21(vec2(mod(i.x + 1.0, px), i.y));
  float c = h21(vec2(mod(i.x, px), i.y + 1.0)), d = h21(vec2(mod(i.x + 1.0, px), i.y + 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p, float px) { float v = 0.0, a = 0.5; for (int o = 0; o < 4; o++) { v += a * vnoise(p, px); p *= 2.0; px *= 2.0; a *= 0.5; } return v; }
// Sky: pale blue with the user's pixel clouds (sprite sheet traced cell by cell from the reference image), drifting one full wrap per loop.
uniform sampler2D tSprite;
uniform vec4 uBox[3];
uniform vec2 uSheet;
int spriteAt(int t, vec2 p) {
  vec4 b = uBox[t];
  if (p.x < 0.0 || p.y < 0.0 || p.x >= b.z || p.y >= b.w) return 0;
  float v = texelFetch(tSprite, ivec2(int(b.x + p.x), int(b.y + (b.w - 1.0 - p.y))), 0).r;
  return int(v * 255.0 / 80.0 + 0.5);
}
// x0, y fraction, sprite, wrap length
const vec4 CLOUDS[32] = vec4[32](vec4(66., 0.38, 1., 700.), vec4(162., 0.73, 2., 700.), vec4(291., 0.17, 0., 700.), vec4(376., 0.52, 0., 700.), vec4(530., 0.86, 0., 700.), vec4(586., 0.30, 0., 700.), vec4(12., 0.65, 2., 480.), vec4(51., 0.09, 0., 480.), vec4(98., 0.43, 2., 480.), vec4(171., 0.78, 0., 480.), vec4(209., 0.22, 0., 480.), vec4(241., 0.57, 2., 480.), vec4(289., 0.91, 0., 480.), vec4(344., 0.35, 0., 480.), vec4(400., 0.70, 0., 480.), vec4(448., 0.14, 1., 480.), vec4(1., 0.48, 1., 380.), vec4(33., 0.83, 1., 380.), vec4(49., 0.27, 2., 380.), vec4(79., 0.62, 0., 380.), vec4(98., 0.06, 1., 380.), vec4(125., 0.40, 1., 380.), vec4(149., 0.75, 2., 380.), vec4(171., 0.19, 2., 380.), vec4(201., 0.53, 1., 380.), vec4(215., 0.88, 1., 380.), vec4(245., 0.32, 2., 380.), vec4(272., 0.67, 2., 380.), vec4(294., 0.11, 2., 380.), vec4(310., 0.45, 0., 380.), vec4(335., 0.80, 2., 380.), vec4(358., 0.24, 2., 380.));
vec3 skyDay(vec2 uv) {
  float ph = uTime / uLoop;
  float cs = uResolution.x / 240.0, Hc = 240.0 * uResolution.y / uResolution.x;
  vec2 cell = floor(uv * uResolution / cs);
  float hy = 0.55; vec3 c, dark = vec3(0.529, 0.839, 0.988), body = vec3(0.718, 0.902, 0.988), hi = vec3(0.886, 0.965, 0.996);
  if (uv.y >= hy) { float k = (uv.y - hy) / (1.0 - hy); c = mix(vec3(1.0, 0.76, 0.42), vec3(0.95, 0.47, 0.4), smoothstep(0.0, 0.3, k)); c = mix(c, vec3(0.4, 0.32, 0.64), smoothstep(0.28, 0.95, k)); }
  else { float d = hy - uv.y; c = mix(vec3(0.96, 0.62, 0.4), vec3(0.14, 0.2, 0.46), smoothstep(0.0, 0.34, d)); }
  for (int i = 0; i < 0; i++) {
    vec4 q = CLOUDS[i]; int t = int(q.z + 0.5);
    float sc = q.w >= 600.0 ? 2.0 : (q.w >= 450.0 ? 1.0 : 0.5);          // near clouds are drawn 2x, intermediate 1x (exact sprite), far 0.5x
    float speed = q.w;                                                        // cells per loop: near clouds drift faster, far ones slower
    float ox = mod(q.x + floor(ph * speed), q.w) - 64.0 * sc;
    vec2 p = floor((cell - vec2(ox, floor(q.y * Hc))) / sc);
    int k = spriteAt(t, p);
    if (k == 0) continue;
    if (sc < 1.0) { c = (k == 3) ? hi : body; }                               // far clouds: flat and pale
    else if (k == 1) c = dark; else if (k == 2) c = body; else c = hi;
  }
  vec2 uc = (cell + 0.5) * cs / uResolution; vec2 dv = (uc - vec2(0.80, 0.60)) * vec2(uResolution.x / uResolution.y, 1.0); float sr = length(dv) / clamp(uResolution.x / uResolution.y, 0.55, 1.0);       // the sun, a blocky disc with stepped glare
  if (sr < 0.05) c = vec3(1.0, 0.99, 0.9); else if (sr < 0.062) c = vec3(1.0, 0.94, 0.62); else if (sr < 0.09) c = mix(c, vec3(1.0, 0.9, 0.6), 0.55); else if (sr < 0.13) c = mix(c, vec3(1.0, 0.92, 0.75), 0.3);
  float ray = abs(sin(atan(dv.y, dv.x) * 8.0 + uTime / uLoop * 6.2831853 * 2.0)); if (sr > 0.13 && sr < 0.24 && ray > 0.92) c = mix(c, vec3(1.0, 0.95, 0.8), 0.28 * (1.0 - (sr - 0.13) / 0.11));
  if (uv.y < hy) { c = mix(c, (sr < 0.2) ? vec3(1.0, 0.9, 0.6) : c, 0.0); float d = hy - uv.y, dx = abs(uc.x - 0.80) * uResolution.x / uResolution.y / clamp(uResolution.x / uResolution.y, 0.55, 1.0); float gl = h21(cell * 1.3 + floor(uTime * 3.0 + cell.y * 0.5)); if (dx < 0.035 + 0.5 * d && gl > 0.62 + 2.0 * d) c = vec3(1.0, 0.88, 0.55); else if (h21(vec2(cell.y, 5.0)) > 0.7 && h21(floor(cell / vec2(6.0, 1.0))) > 0.55) c = mix(c, vec3(0.62, 0.45, 0.68), 0.7); }
  float hh = 0.05 * smoothstep(0.50, 0.58, uv.x) * (1.0 - smoothstep(0.64, 0.74, uv.x)) + 0.012 * vnoise(vec2(cell.x * 0.05, 2.0), 1000.0);
  if (uv.y >= hy - 0.003 && uv.y < hy + hh) c = vec3(0.36, 0.26, 0.46);
  return c;
}

vec3 skyNight(vec2 uv) {
  float cs = uResolution.x / 240.0, Hc = 240.0 * uResolution.y / uResolution.x;
  vec2 cell = floor(uv * uResolution / cs);
  vec3 c = mix(vec3(0.105, 0.125, 0.31), vec3(0.036, 0.047, 0.16), smoothstep(0.1, 0.9, uv.y));
  float h = h21(cell + 7.0), tw = 0.5 + 0.5 * sin(uTime / uLoop * 6.2831853 * 43.0 + h * 40.0);
  if (h > 0.9955) c = mix(c, vec3(0.85, 0.9, 1.0), 0.5 + 0.5 * tw); else if (h > 0.99) c = mix(c, vec3(0.6, 0.7, 0.95), 0.4);
  // Santiago de Chile by night: the snow-capped Andes under the moon and the low city lights at their foot
  float xs = cell.x / 38.0, rg = (0.40 + 0.14 * vnoise(vec2(xs * 1.1, 4.0), 1000.0) + 0.07 * vnoise(vec2(xs * 3.7, 8.0), 1000.0) + 0.02 * vnoise(vec2(xs * 11.0, 2.0), 1000.0)) * Hc;
  if (cell.y < rg) { c = vec3(0.07, 0.085, 0.2); if (cell.y > rg - 3.0 - 4.0 * vnoise(vec2(xs * 9.0, 1.0), 1000.0) && rg > 0.47 * Hc) c = vec3(0.3, 0.36, 0.6); }
  float r2 = (0.18 + 0.05 * vnoise(vec2(xs * 2.0 + 5.0, 3.0), 1000.0) + 0.02 * vnoise(vec2(xs * 8.0, 6.0), 1000.0)) * Hc; if (cell.y < r2) c = vec3(0.04, 0.05, 0.12);
  if (cell.y < 0.16 * Hc) { c = vec3(0.03, 0.035, 0.09); if (h21(cell * 1.7 + 3.0) > 0.93) c = vec3(0.9, 0.7, 0.32); }
  return c;
}
vec3 skyAt(vec2 uv) {
  if (uPrint > 0.5) return vec3(1.0);
  float cs = uResolution.x / 240.0, Hc = 240.0 * uResolution.y / uResolution.x;
  vec2 cell = floor(uv * uResolution / cs);
  vec3 c = mix(vec3(0.86, 0.95, 0.98), vec3(0.5, 0.82, 0.94), smoothstep(0.25, 1.0, uv.y));      // humid, hazy morning light
  vec2 dv = (uv - vec2(0.3, 0.86)) * vec2(uResolution.x / uResolution.y, 1.0); float sr = length(dv) / clamp(uResolution.x / uResolution.y, 0.55, 1.0);
  if (sr < 0.06) c = vec3(1.0, 0.99, 0.88); else if (sr < 0.1) c = mix(c, vec3(1.0, 0.97, 0.75), 0.55); else if (sr < 0.16) c = mix(c, vec3(1.0, 0.98, 0.82), 0.3);
  float xs = cell.x / 45.0;
  float r1 = (0.25 + 0.04 * vnoise(vec2(xs * 1.4, 2.0), 1000.0) + 0.03 * vnoise(vec2(xs * 5.0, 5.0), 1000.0)) * Hc, r2 = (0.15 + 0.04 * vnoise(vec2(xs * 1.9 + 7.0, 9.0), 1000.0) + 0.025 * vnoise(vec2(xs * 7.0, 1.0), 1000.0)) * Hc;
  if (cell.y < r1) c = vec3(0.37, 0.54, 0.23);
  if (cell.y < r2) c = vec3(0.114, 0.43, 0.23);
  return c;
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}
float bayer8(vec2 a) {
  return bayer4(0.5 * a) * 0.25 + bayer4(a);
}
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}
vec3 fetch(vec2 uv) {
  return texture(tScene, uv).rgb;
}
float fetchA(vec2 uv) {
  return texture(tScene, uv).a;
}

void main() {
  vec2 px = 1.0 / uResolution;
  vec4 centre = texture(tScene, vUv);

  // Gather a small disc of coverage for the cut-out rim. The alpha buffer is
  // opaque everywhere inside the diorama, so this only bites at the silhouette.
  float weights = 0.0;
  float cov = 0.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float ang = float(i) * 2.399963 + 0.4;
    float rad = 1.0 + float(i % 3) * 1.15;
    vec2 off = vec2(cos(ang), sin(ang)) * rad * px;
    vec2 uv = vUv + off;
    float a = fetchA(uv);
    float w = 1.0 - rad / 5.4;
    cov += a * w;
    acc += fetch(uv) * a * w;
    weights += w;
  }
  cov /= weights;
  vec3 gathered = acc / max(cov * weights, 0.00001);

  float centreCov = centre.a;
  cov = max(cov, centreCov);
  vec3 c = mix(gathered, centre.rgb, smoothstep(0.62, 0.92, centreCov));

  // Composite the model onto paper white before grading.
  vec3 sky = skyAt(vUv);
  c = mix(pow(sky, vec3(2.2)), c, smoothstep(0.26, 0.72, cov));

  // Linear render target -> display sRGB.
  c = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));

  // Gentle grade, then the crisp ink contour.
  float l = luma(c);
  c = mix(vec3(l), c, 1.07);
  c = clamp((c - 0.5) * 1.028 + 0.5, 0.0, 1.0);

  float l0 = luma(texture(tScene, vUv).rgb);
  float l1 = luma(texture(tScene, vUv + vec2(px.x, 0.0)).rgb);
  float l2 = luma(texture(tScene, vUv - vec2(px.x, 0.0)).rgb);
  float l3 = luma(texture(tScene, vUv + vec2(0.0, px.y)).rgb);
  float l4 = luma(texture(tScene, vUv - vec2(0.0, px.y)).rgb);
  float edge = max(max(abs(l0 - l1), abs(l0 - l2)), max(abs(l0 - l3), abs(l0 - l4)));
  // Neighbour luminance is linear; bring it into the same scale.
  edge = pow(edge, 0.4545);
  float ink = smoothstep(0.13, 0.34, edge) * smoothstep(0.20, 0.55, cov) * (1.0 - smoothstep(0.86, 0.985, cov));
  c = mix(c, vec3(0.085, 0.082, 0.076), ink * 0.62);

  // 8x8 ordered dither, then nearest palette snap.
  float d = bayer8(gl_FragCoord.xy) - 0.5;
  float sparkle = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  // Dither hardest where tones are actually transitioning; flat areas stay calm.
  float gate = smoothstep(0.004, 0.055, edge);
  c += (d * (0.0012 + 0.019 * gate) + sparkle * 0.0012) * uDither;

  vec3 bgSnap = sky; { float bd0 = 1e9; for (int j = 0; j < 64; j++) { vec3 pj = uPalette[j]; vec3 dj = (sky - pj) * vec3(1.0, 1.12, 0.93); float dd = dot(dj, dj); if (dd < bd0) { bd0 = dd; bgSnap = pj; } } }
  vec3 best = uPalette[0];
  float bestD = 1e9;
  for (int i = 0; i < 64; i++) {
    vec3 p = uPalette[i];
    vec3 diff = (c - p) * vec3(1.0, 1.12, 0.93);
    float dd = dot(diff, diff);
    if (dd < bestD) {
      bestD = dd;
      best = p;
    }
  }
  c = best;

  // Fragment the outer silhouette with the same ordered matrix.
  float rim = 1.0 - smoothstep(0.78, 0.995, cov);
  float threshold = bayer4(gl_FragCoord.xy * 1.0) * 0.92 + 0.018;
  if (rim > 0.002 && cov < threshold) {
    c = bgSnap;
  }
  if (cov < 0.02) c = bgSnap;

  fragColor = vec4(c, 1.0);
}
`;

function spriteTexture() {
  const d = new Uint8Array(CLOUD.data.length); for (let i = 0; i < d.length; i++) d[i] = CLOUD.data[i] * 80;
  const t = new THREE.DataTexture(d, CLOUD.w, CLOUD.h, THREE.RedFormat, THREE.UnsignedByteType); t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
}

export class PixelPost {
  constructor(renderer, maxDim = 1600, renderScale = 1) {
    this.renderer = renderer;
    this.maxDim = maxDim;
    this.renderScale = renderScale;

    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      stencilBuffer: false,
      samples: 0,
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.LinearSRGBColorSpace,
    });
    this.rt.texture.generateMipmaps = false;

    this.uniforms = {
      tScene: { value: this.rt.texture },
      uResolution: { value: new THREE.Vector2(2, 2) },
      uPalette: { value: PALETTE_RGB.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
      uDither: { value: 1.0 }, uPrint: { value: 0.0 },
      uTime: { value: 0.0 },
      tSprite: { value: spriteTexture() },
      uBox: { value: CLOUD.boxes.map((b) => new THREE.Vector4(b[0], b[1], b[2], b[3])) },
      uSheet: { value: new THREE.Vector2(CLOUD.w, CLOUD.h) },
      uLoop: { value: 90.0 },
    };

    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);

    this.size = new THREE.Vector2(2, 2);
  }

  setSize(w, h) {
    // Default one target pixel per CSS pixel. `renderScale` 1.2–1.5 supersamples
    // a subject that is small on the page so the palette and dither keep detail
    // after the CSS downscale; `maxDim` is a hard ceiling for 4K displays.
    const scale = Math.min(this.renderScale, this.maxDim / Math.max(w, h));
    const iw = Math.max(2, Math.round(w * scale));
    const ih = Math.max(2, Math.round(h * scale));
    if (iw === this.size.x && ih === this.size.y) return;
    this.size.set(iw, ih);
    this.rt.setSize(iw, ih);
    this.uniforms.uResolution.value.set(iw, ih);
    this.renderer.setSize(iw, ih, false);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.clippingPlanes = this.clipPlanes || [];
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, true);
    r.render(scene, camera);
    r.clippingPlanes = [];
    r.setRenderTarget(null);
    r.setClearColor(0x000000, 1);
    r.clear(true, true, true);
    r.render(this.scene, this.camera);
  }
}
