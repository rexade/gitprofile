import { readFileSync } from 'node:fs';

const FONT_DIR = new URL('../fonts/', import.meta.url);
const fontCache = new Map();

export const MONO =
  "'JBM', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/** Advance width of JetBrains Mono, in em. Used to measure monospace text. */
export const MONO_ADVANCE = 0.6;

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** @font-face rules with the subsetted JetBrains Mono inlined as data URIs. */
export function fontFaces(weights = [400, 700]) {
  return weights
    .map((w) => {
      if (!fontCache.has(w)) {
        fontCache.set(w, readFileSync(new URL(`jetbrains-mono-${w}.woff2`, FONT_DIR)).toString('base64'));
      }
      return `@font-face{font-family:'JBM';font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${fontCache.get(w)}) format('woff2')}`;
    })
    .join('');
}

/** Wrap a body in a standalone, accessible SVG document. */
export function svgDoc({ width, height, title, desc = '', css = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${css}</style>
<defs>${defs}</defs>
${body}
</svg>
`;
}

/** Deterministic PRNG (mulberry32) so builds are reproducible. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const num = (v, digits = 2) => {
  const s = v.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};

export const fmtInt = (v) => (v == null || Number.isNaN(v) ? '–' : Math.round(v).toLocaleString('en-US'));

/** Greedy word wrap for monospace text. */
export function wrap(text, maxChars, maxLines = Infinity) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = (last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last).replace(/[\s.,;:]+$/, '') + '…';
  }
  return lines;
}

/**
 * Tiny markup for coloured spans: "plain {cyan:highlighted} plain".
 * Returns tspans; colours are looked up in `palette`.
 */
export function spans(text, palette, fallback) {
  const out = [];
  const re = /\{(\w+):([^}]*)\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), color: fallback });
    const bold = m[1].endsWith('Bold');
    out.push({ text: m[2], color: palette[bold ? m[1].slice(0, -4) : m[1]] ?? fallback, bold });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), color: fallback });
  return out;
}

export const plainLength = (text) => text.replace(/\{\w+:([^}]*)\}/g, '$1').length;

export function tspans(text, palette, fallback) {
  return spans(text, palette, fallback)
    .map((s) => `<tspan fill="${s.color}"${s.bold ? ' font-weight="700"' : ''}>${esc(s.text)}</tspan>`)
    .join('');
}

/** Lighten a hex colour until it has enough contrast against `bg`. */
export function readableOn(hex, bg, minRatio = 3) {
  let [r, g, b] = rgb(hex);
  for (let i = 0; i < 20 && contrast([r, g, b], rgb(bg)) < minRatio; i++) {
    r += (255 - r) * 0.15;
    g += (255 - g) * 0.15;
    b += (255 - b) * 0.15;
  }
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function rgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
