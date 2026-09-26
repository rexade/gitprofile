import { theme } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO, MONO_ADVANCE, esc, num, rng } from '../lib/svg.mjs';
import { pixelCells, pixelText, measurePixelText, sprite, spriteSize } from '../lib/pixel.mjs';
import { lighthouse, house, gull } from '../lib/sprites.mjs';
import { waveLayer, starField, sparkle, sparkleCss, sailingShip } from '../lib/scene.mjs';

const W = 1200;
const H = 420;
const HORIZON = 292;

export function renderHeader(config) {
  const { greeting, title, tagline } = config.header;
  const css = [];
  const defs = [];
  const body = [];

  // --- sky -----------------------------------------------------------------
  defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${theme.sky0}"/><stop offset=".45" stop-color="${theme.sky1}"/><stop offset=".8" stop-color="${theme.sky2}"/><stop offset="1" stop-color="${theme.sky3}"/></linearGradient>`);
  defs.push(`<linearGradient id="sea" x1="0" y1="${HORIZON}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${theme.sea0}"/><stop offset="1" stop-color="${theme.sea1}"/></linearGradient>`);
  defs.push(`<radialGradient id="moonGlow"><stop offset="0" stop-color="#fef3c7" stop-opacity=".32"/><stop offset=".45" stop-color="#fde68a" stop-opacity=".1"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient>`);
  defs.push(`<radialGradient id="vignette" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`);
  defs.push(`<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>`);
  body.push(`<g clip-path="url(#frame)">`);
  body.push(`<rect width="${W}" height="${HORIZON + 4}" fill="url(#sky)"/>`);

  const titleText = title.toUpperCase();
  const titleCell = Math.min(13, Math.floor((W - 200) / (measurePixelText(titleText, 1) + 1)));
  const titleW = measurePixelText(titleText, titleCell);
  const titleY = 94;
  const stars = starField({
    seed: 11,
    count: 95,
    width: W,
    height: HORIZON - 30,
    avoid: [{ x: (W - titleW) / 2 - 20, y: titleY - 50, w: titleW + 40, h: 7 * titleCell + 60 }],
  });
  css.push(stars.css, sparkleCss);
  body.push(stars.svg);
  body.push(sparkle(118, 92, 3, '#fef9c3', 0), sparkle(292, 40, 3, '#a5f3fc', 1.3), sparkle(905, 58, 3, '#fef9c3', 2.1), sparkle(1150, 196, 3, '#a5f3fc', 0.7));

  // shooting star
  defs.push(`<linearGradient id="tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>`);
  body.push(`<g class="shoot"><rect x="-110" y="-1.5" width="110" height="3" fill="url(#tail)" transform="rotate(17)"/><rect x="-3" y="-3" width="6" height="6" fill="#fff" transform="rotate(17)"/></g>`);
  css.push(
    `.shoot{opacity:0;transform:translate(160px,36px);animation:shoot 13s linear 3s infinite}` +
      `@keyframes shoot{0%{opacity:0;transform:translate(160px,36px)}1%{opacity:1}7%{opacity:1}9%{opacity:0;transform:translate(560px,158px)}100%{opacity:0;transform:translate(560px,158px)}}`,
  );

  // --- moon ----------------------------------------------------------------
  const moon = { x: 1040, y: 96, cell: 4, r: 9.5 };
  body.push(`<circle class="mg" cx="${moon.x}" cy="${moon.y}" r="150" fill="url(#moonGlow)"/>`);
  css.push(`.mg{animation:mg 6s ease-in-out infinite}@keyframes mg{0%,100%{opacity:.75}50%{opacity:1}}`);
  body.push(pixelMoon(moon));

  // --- far land ------------------------------------------------------------
  body.push(`<path fill="#0b1b36" d="${steppedHills(700, W + 10, HORIZON, [8, 16, 12, 22, 14, 26, 18, 10, 20, 12, 6], 44)}"/>`);
  body.push(`<path fill="${theme.land}" d="${steppedHills(-10, 300, HORIZON, [18, 26, 34, 40, 44, 46, 44, 38, 30, 20, 10], 28)}"/>`);

  // lighthouse + beam
  const lh = { x: 196, cell: 4 };
  const lhSize = spriteSize(lighthouse.rows, lh.cell);
  lh.y = HORIZON - 44 - lhSize.height + 6;
  const lamp = { x: lh.x + lhSize.width / 2, y: lh.y + 4 * lh.cell };
  defs.push(`<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fde047" stop-opacity=".55"/><stop offset=".55" stop-color="#fde047" stop-opacity=".12"/><stop offset="1" stop-color="#fde047" stop-opacity="0"/></linearGradient>`);
  body.push(
    `<g class="beam"><path fill="url(#beam)" d="M${lamp.x} ${lamp.y - 3}L${lamp.x + 330} ${lamp.y - 44}L${lamp.x + 330} ${lamp.y + 40}L${lamp.x} ${lamp.y + 3}Z"/></g>`,
  );
  css.push(
    `.beam{transform-origin:${lamp.x}px ${lamp.y}px;animation:beam 8s ease-in-out infinite alternate}@keyframes beam{from{transform:rotate(-9deg)}to{transform:rotate(14deg)}}`,
  );
  body.push(sprite(lighthouse.rows, lighthouse.palette, lh));
  body.push(`<rect class="lamp" x="${lh.x + 4}" y="${lh.y + 12}" width="20" height="8" fill="#fffbeb"/>`);
  css.push(`.lamp{animation:lamp 2.6s ease-in-out infinite}@keyframes lamp{0%,100%{opacity:.2}50%{opacity:.95}}`);

  // harbour houses with lit windows
  [
    [34, 12],
    [74, 4],
    [118, 0],
  ].forEach(([x, dy], i) => {
    const y = HORIZON - 30 - dy - 24;
    body.push(`<g class="win" style="animation-delay:${num(-i * 1.7)}s">${sprite(house.rows, house.palette, { x, y, cell: 4 })}</g>`);
  });
  css.push(`.win{animation:win 7s steps(1) infinite}@keyframes win{0%,100%{opacity:1}38%{opacity:.82}41%{opacity:1}72%{opacity:.9}}`);

  // --- sea -----------------------------------------------------------------
  body.push(`<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#sea)"/>`);
  body.push(`<rect y="${HORIZON}" width="${W}" height="2" fill="#2a4f7f" opacity=".7"/>`);
  // moon reflection
  const rand = rng(5);
  for (let i = 0; i < 9; i++) {
    const y = HORIZON + 10 + i * 13;
    const w = 14 + Math.round(rand() * 46) + i * 3;
    const x = moon.x - w / 2 + Math.round((rand() - 0.5) * 16);
    body.push(`<rect class="rf" style="animation-delay:${num(-rand() * 3, 1)}s" x="${num(x)}" y="${y}" width="${w}" height="4" fill="#fde68a"/>`);
  }
  css.push(`.rf{opacity:.4;animation:rf 3.4s ease-in-out infinite}@keyframes rf{0%,100%{opacity:.18;transform:translateX(0)}50%{opacity:.6;transform:translateX(7px)}}`);

  const back = waveLayer({ id: 'wb', width: W, bottom: H + 10, base: 318, amp: 5, wavelength: 240, color: '#0d3257', foam: '#1d4e7a', duration: 16 });
  const ship = sailingShip({ width: W, waterline: 342, cell: 3, duration: 64, delay: -26 });
  const mid = waveLayer({ id: 'wm', width: W, bottom: H + 10, base: 352, amp: 6, wavelength: 200, color: '#092744', foam: '#2a6a9a', duration: 11, reverse: true });
  const front = waveLayer({ id: 'wf', width: W, bottom: H + 10, base: 392, amp: 5, wavelength: 160, color: '#061c34', foam: '#3b82b0', duration: 7 });
  css.push(back.css, ship.css, mid.css, front.css);
  body.push(back.svg, ship.svg, mid.svg);

  // gulls skimming the water
  css.push(gullCss());
  body.push(gullSvg('g1', 250, 3, 34, -8), gullSvg('g2', 266, 2, 46, -30));

  // --- greeting, title, tagline -------------------------------------------
  const greet = pixelText(greeting.toUpperCase(), { x: W / 2, y: 46, cell: 4, align: 'middle', fill: theme.gold, className: 'greet' });
  body.push(greet.svg);
  css.push(`.greet{animation:fade .8s ease-out .1s both}@keyframes fade{from{opacity:0}}`);

  const { cells } = pixelCells(titleText, { x: Math.round((W - titleW) / 2), y: titleY, cell: titleCell });
  const depth = Math.max(3, Math.round(titleCell * 0.42));
  const delay = (c) => num(0.25 + c.col * 0.028 + c.row * 0.012);
  // Cells overlap by a hair so no anti-aliasing seams show between them.
  const rect = (c, dx = 0, dy = 0) => `x="${num(c.x + dx)}" y="${num(c.y + dy)}" width="${titleCell + 0.6}" height="${titleCell + 0.6}"`;
  defs.push(`<linearGradient id="face" x1="0" y1="${titleY}" x2="0" y2="${titleY + 7 * titleCell}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#ecfeff"/><stop offset=".35" stop-color="#a5f3fc"/><stop offset=".7" stop-color="${theme.cyan}"/><stop offset="1" stop-color="${theme.teal}"/></linearGradient>`);
  defs.push(`<filter id="blur" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>`);
  defs.push(`<clipPath id="titleClip">${cells.map((c) => `<rect ${rect(c)}/>`).join('')}</clipPath>`);
  body.push(`<g class="glow" filter="url(#blur)" opacity=".45">${cells.map((c) => `<rect ${rect(c)} fill="${theme.teal}"/>`).join('')}</g>`);
  body.push(`<g fill="#0b3b4a">${cells.map((c) => `<rect class="c" style="animation-delay:${delay(c)}s" ${rect(c, depth, depth)}/>`).join('')}</g>`);
  body.push(`<g fill="url(#face)">${cells.map((c) => `<rect class="c" style="animation-delay:${delay(c)}s" ${rect(c)}/>`).join('')}</g>`);
  defs.push(`<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  const shineX = (W - titleW) / 2 - 140;
  body.push(
    `<g clip-path="url(#titleClip)"><rect class="shine" x="${num(shineX)}" y="${titleY - 20}" width="70" height="${7 * titleCell + 40}" fill="url(#shine)" transform="skewX(-18)"/></g>`,
  );
  css.push(
    `.c{animation:drop .7s cubic-bezier(.2,1.5,.45,1) both}@keyframes drop{from{transform:translateY(-40px);opacity:0}to{transform:none;opacity:1}}`,
    `.glow{animation:fade 1.2s ease-out 1.4s both}`,
    `.shine{animation:shine 7s ease-in-out 2.4s infinite}@keyframes shine{0%{transform:skewX(-18deg) translateX(0)}20%,100%{transform:skewX(-18deg) translateX(${num(titleW + 380)}px)}}`,
  );

  const tagW = tagline.length * 22 * MONO_ADVANCE + tagline.length * 1.5;
  body.push(
    `<text class="tag" x="${W / 2}" y="238" text-anchor="middle" font-family="${MONO}" font-size="22" letter-spacing="1.5" fill="#a9cdef">${esc(tagline)}</text>`,
  );
  body.push(pixelDiamond(W / 2 - tagW / 2 - 22, 229, theme.cyan), pixelDiamond(W / 2 + tagW / 2 + 12, 229, theme.cyan));
  css.push(`.tag{animation:fade 1s ease-out 1.1s both}`);

  body.push(front.svg);
  body.push(`<rect width="${W}" height="${H}" fill="url(#vignette)" pointer-events="none"/>`);
  body.push(`</g>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="${theme.border}" stroke-width="2"/>`);

  css.push(`text{font-family:${MONO}}`);
  css.push(`@media (prefers-reduced-motion:reduce){*{animation:none!important}}`);

  return svgDoc({
    width: W,
    height: H,
    title: `${greeting} ${title}`,
    desc: `${tagline}. A pixel-art night harbour: a pirate ship sails past a lighthouse under the moon.`,
    css: fontFaces([400]) + css.join(''),
    defs: defs.join(''),
    body: body.join('\n'),
  });
}

function pixelMoon({ x, y, cell, r }) {
  const cells = { lit: [], shade: [], crater: [] };
  const craters = new Set(['-3,-2', '-2,-2', '2,1', '3,1', '2,2', '-1,4', '0,4', '4,-4']);
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const key = `${dx},${dy}`;
      const bucket = craters.has(key) ? 'crater' : dx + dy > r * 0.55 ? 'shade' : 'lit';
      cells[bucket].push(`M${x + dx * cell - cell / 2} ${y + dy * cell - cell / 2}h${cell}v${cell}h-${cell}z`);
    }
  }
  return `<path fill="#fef9e7" d="${cells.lit.join('')}"/><path fill="#f2dfa7" d="${cells.shade.join('')}"/><path fill="#e7cf8f" d="${cells.crater.join('')}"/>`;
}

function steppedHills(x0, x1, base, heights, step) {
  let d = `M${x0} ${base}`;
  let x = x0;
  for (const h of heights) {
    d += `V${base - h}H${Math.min(x + step, x1)}`;
    x += step;
    if (x >= x1) break;
  }
  return `${d}V${base}Z`;
}

function pixelDiamond(x, y, color) {
  return `<path fill="${color}" d="M${x + 4} ${y}h4v4h4v4h-4v4h-4v-4h-4v-4h4z"/>`;
}

function gullSvg(id, y, cell, duration, delay) {
  const up = sprite(gull.up, { '#': '#e2e8f0' }, { cell });
  const down = sprite(gull.down, { '#': '#e2e8f0' }, { cell });
  return `<g class="gull" style="animation-duration:${duration}s;animation-delay:${delay}s"><g transform="translate(0 ${y})"><g class="fu">${up}</g><g class="fd">${down}</g></g></g>`;
}

function gullCss() {
  return (
    `.gull{transform:translateX(900px);animation:gull 40s linear infinite}@keyframes gull{from{transform:translateX(${W + 30}px)}to{transform:translateX(-40px)}}` +
    `.fu{animation:flap .5s steps(1) infinite}.fd{opacity:0;animation:flap .5s steps(1) -.25s infinite}@keyframes flap{0%{opacity:1}50%{opacity:0}}`
  );
}
