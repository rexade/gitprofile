// Shared scenery for the header and footer: pixel waves, stars, the ship.
import { num, rng } from './svg.mjs';
import { sprite, spriteSize } from './pixel.mjs';
import { ship } from './sprites.mjs';

/**
 * A stepped (pixel-art) sine wave filled down to `bottom`. The pattern repeats
 * every `wavelength` px, so translating it by exactly one wavelength loops
 * seamlessly.
 */
export function wavePath({ width, base, amp, wavelength, step = 8, phase = 0, bottom, grid = 4 }) {
  const start = -step * 2;
  const end = width + wavelength + step * 2;
  let d = `M${start} ${bottom}`;
  for (let x = start; x < end; x += step) {
    const y = base + amp * Math.sin((2 * Math.PI * x) / wavelength + phase);
    d += `V${Math.round(y / grid) * grid}H${x + step}`;
  }
  return `${d}V${bottom}Z`;
}

/**
 * A wave layer: a light foam band on top of the body colour. Returns markup
 * plus the keyframes that make it drift.
 */
export function waveLayer({ id, width, bottom, base, amp, wavelength, color, foam, duration, reverse = false, phase = 0, opacity = 1 }) {
  const d = wavePath({ width, base, amp, wavelength, bottom, phase });
  const from = reverse ? -wavelength : 0;
  const to = reverse ? 0 : -wavelength;
  const css = `.${id}{animation:${id} ${duration}s linear infinite}@keyframes ${id}{from{transform:translateX(${from}px)}to{transform:translateX(${to}px)}}`;
  const svg = `<g class="${id}" opacity="${opacity}"><path fill="${foam}" d="${d}"/><path fill="${color}" transform="translate(0 4)" d="${d}"/></g>`;
  return { svg, css };
}

/** Twinkling pixel stars scattered over a rectangle. */
export function starField({ seed = 7, count = 80, x0 = 0, y0 = 0, width, height, avoid = [] }) {
  const rand = rng(seed);
  const colors = ['#ffffff', '#cfe8ff', '#fde68a', '#a5f3fc'];
  let svg = '';
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < count * 20) {
    const x = Math.round(x0 + rand() * width);
    const y = Math.round(y0 + Math.pow(rand(), 1.35) * height);
    if (avoid.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)) continue;
    const roll = rand();
    const size = roll < 0.7 ? 2 : roll < 0.95 ? 3 : 4;
    const color = colors[Math.floor(rand() * colors.length)];
    const twinkle = rand() < 0.55;
    const dur = num(2 + rand() * 4, 1);
    const delay = num(-rand() * 6, 1);
    const style = twinkle ? ` class="tw" style="animation-duration:${dur}s;animation-delay:${delay}s"` : '';
    svg += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" opacity="${num(0.55 + rand() * 0.45)}"${style}/>`;
    placed++;
  }
  const css = `.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.15}}`;
  return { svg, css };
}

/** A 4-point pixel sparkle. */
export function sparkle(x, y, cell, color, delay = 0) {
  const c = cell;
  const d = `M${x} ${y - 2 * c}h${c}v${c}h-${c}zM${x} ${y + 2 * c}h${c}v${c}h-${c}zM${x - 2 * c} ${y}h${c}v${c}h-${c}zM${x + 2 * c} ${y}h${c}v${c}h-${c}zM${x - c} ${y}h${3 * c}v${c}h-${3 * c}zM${x} ${y - c}h${c}v${3 * c}h-${c}z`;
  return `<path class="sp" style="animation-delay:${delay}s" fill="${color}" d="${d}"/>`;
}

export const sparkleCss = `.sp{animation:sp 4s ease-in-out infinite}@keyframes sp{0%,100%{opacity:.25}50%{opacity:1}}`;

/**
 * The pirate ship, sailing left to right across `width` and bobbing on the
 * swell. `waterline` is where the bottom of the hull sits.
 */
export function sailingShip({ id = 'ship', width, waterline, cell = 3, duration = 60, delay = 0 }) {
  const { width: w, height: h } = spriteSize(ship.rows, cell);
  const top = waterline - h + cell * 2;
  const art = sprite(ship.rows, ship.palette, { x: 0, y: 0, cell });
  const css =
    `.${id}{transform:translate(${Math.round(width * 0.62)}px,${top}px);animation:${id}-sail ${duration}s linear infinite;animation-delay:${delay}s}` +
    `@keyframes ${id}-sail{from{transform:translate(${-w - 20}px,${top}px)}to{transform:translate(${width + 20}px,${top}px)}}` +
    `.${id}-bob{transform-box:fill-box;transform-origin:50% 90%;animation:${id}-bob 3.2s ease-in-out infinite}` +
    `@keyframes ${id}-bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(${cell}px) rotate(2deg)}}`;
  return { svg: `<g class="${id}"><g class="${id}-bob">${art}</g></g>`, css, width: w, height: h };
}
