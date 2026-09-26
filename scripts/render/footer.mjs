import { theme } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO, esc } from '../lib/svg.mjs';
import { pixelText, measurePixelText } from '../lib/pixel.mjs';
import { waveLayer, starField, sailingShip } from '../lib/scene.mjs';

const W = 1200;
const H = 230;

export function renderFooter(config) {
  const { title, line } = config.footer;
  const css = [];
  const defs = [];
  const body = [];

  defs.push(`<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>`);
  defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.sky0}"/><stop offset=".7" stop-color="${theme.sky1}"/><stop offset="1" stop-color="${theme.sky2}"/></linearGradient>`);
  body.push(`<g clip-path="url(#frame)"><rect width="${W}" height="${H}" fill="url(#sky)"/>`);

  const text = title.toUpperCase();
  const cell = Math.min(7, Math.floor((W - 160) / measurePixelText(text, 1)));
  const tw = measurePixelText(text, cell);
  const stars = starField({ seed: 3, count: 40, width: W, height: 140, avoid: [{ x: (W - tw) / 2 - 30, y: 20, w: tw + 60, h: 110 }] });
  css.push(stars.css);
  body.push(stars.svg);

  const x = Math.round((W - tw) / 2);
  body.push(pixelText(text, { x: x + 4, y: 38, cell, fill: '#7c4a03' }).svg);
  body.push(pixelText(text, { x, y: 34, cell, fill: theme.gold }).svg);
  body.push(`<text x="${W / 2}" y="${34 + 7 * cell + 42}" text-anchor="middle" font-size="20" fill="${theme.muted}">${esc(line)}</text>`);

  const back = waveLayer({ id: 'fb', width: W, bottom: H + 10, base: 176, amp: 4, wavelength: 200, color: '#0d3257', foam: '#1d4e7a', duration: 14 });
  const ship = sailingShip({ id: 'boat', width: W, waterline: 200, cell: 2, duration: 48, delay: -30 });
  const front = waveLayer({ id: 'ff', width: W, bottom: H + 10, base: 204, amp: 5, wavelength: 160, color: '#061c34', foam: '#3b82b0', duration: 8, reverse: true });
  css.push(back.css, ship.css, front.css);
  body.push(back.svg, ship.svg, front.svg, '</g>');
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="${theme.border}" stroke-width="2"/>`);

  css.push(`text{font-family:${MONO}}`, `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`);
  return svgDoc({ width: W, height: H, title, desc: line, css: fontFaces([400]) + css.join(''), defs: defs.join(''), body: body.join('\n') });
}
