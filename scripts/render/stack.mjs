import * as simpleIcons from 'simple-icons';
import { theme } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO, MONO_ADVANCE, esc, num, readableOn } from '../lib/svg.mjs';
import { pixelText } from '../lib/pixel.mjs';

const W = 1200;
const MARGIN = 30;
const PANEL_GAP = 16;
const CHIP_H = 46;
const CHIP_GAP = 10;
const CHIP_FONT = 17;
const ICON = 24;

const iconsBySlug = new Map(
  Object.values(simpleIcons)
    .filter((i) => i && typeof i === 'object' && i.slug)
    .map((i) => [i.slug, i]),
);

export function iconFor(item) {
  if (item.text) return { title: item.label ?? item.text, hex: (item.color ?? theme.violet).replace('#', ''), text: item.text };
  const icon = iconsBySlug.get(item.icon);
  if (!icon) throw new Error(`Unknown simple-icons slug "${item.icon}" in profile.config.mjs (see https://simpleicons.org)`);
  return icon;
}

function chipWidth(label) {
  return 12 + ICON + 10 + label.length * CHIP_FONT * MONO_ADVANCE + 16;
}

function layoutPanel(group, width) {
  const inner = width - 40;
  const chips = [];
  let x = 0;
  let row = 0;
  for (const item of group.items) {
    const icon = iconFor(item);
    const label = item.label ?? icon.title;
    const w = chipWidth(label);
    if (x > 0 && x + w > inner) {
      x = 0;
      row++;
    }
    chips.push({ item, icon, label, x, row, w });
    x += w + CHIP_GAP;
  }
  const rows = row + 1;
  return { chips, height: 62 + rows * CHIP_H + (rows - 1) * CHIP_GAP + 22 };
}

function iconSvg(icon, x, y, color) {
  if (icon.text) {
    const hex = `M${x + 12} ${y + 1}L${x + 22} ${y + 6.5}V${y + 17.5}L${x + 12} ${y + 23}L${x + 2} ${y + 17.5}V${y + 6.5}Z`;
    return `<path d="${hex}" fill="${color}"/><text x="${x + 12}" y="${y + 16}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${esc(icon.text)}</text>`;
  }
  return `<path transform="translate(${num(x)} ${num(y)})" fill="${color}" d="${icon.path}"/>`;
}

export function renderStack(config) {
  const groups = config.stack;
  const panelW = (W - MARGIN * 2 - PANEL_GAP) / 2;
  const laid = groups.map((g) => ({ group: g, ...layoutPanel(g, panelW) }));

  const body = [];
  const css = [];
  const title = pixelText('TOOLBOX', { x: MARGIN + 6, y: 30, cell: 4, fill: theme.gold });
  body.push(title.svg);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  body.push(`<text x="${W - MARGIN - 6}" y="54" text-anchor="end" font-size="16" fill="${theme.muted}">~/toolbox · ${total} tools of the trade</text>`);

  let y = 82;
  let index = 0;
  for (let i = 0; i < laid.length; i += 2) {
    const pair = laid.slice(i, i + 2);
    const rowH = Math.max(...pair.map((p) => p.height));
    pair.forEach((panel, j) => {
      const px = MARGIN + j * (panelW + PANEL_GAP);
      body.push(`<rect x="${num(px)}" y="${y}" width="${num(panelW)}" height="${rowH}" rx="16" fill="${theme.cardHi}" fill-opacity=".55" stroke="${theme.border}"/>`);
      body.push(`<rect x="${num(px + 20)}" y="${y + 24}" width="8" height="8" fill="${theme.cyan}"/>`);
      body.push(
        `<text x="${num(px + 38)}" y="${y + 33}" font-size="15" font-weight="700" letter-spacing="3" fill="${theme.soft}">${esc(panel.group.group.toUpperCase())}</text>`,
      );
      for (const chip of panel.chips) {
        const cx = px + 20 + chip.x;
        const cy = y + 52 + chip.row * (CHIP_H + CHIP_GAP);
        const color = readableOn(`#${chip.icon.hex}`, theme.tile, 3.2);
        const delay = num(0.1 + index++ * 0.045);
        body.push(
          `<g class="chip" style="animation-delay:${delay}s">` +
            `<rect x="${num(cx)}" y="${cy}" width="${num(chip.w)}" height="${CHIP_H}" rx="12" fill="${theme.tile}" stroke="${theme.border}"/>` +
            `<rect x="${num(cx)}" y="${cy + CHIP_H - 3}" width="${num(chip.w)}" height="3" rx="1.5" fill="${color}" opacity=".55"/>` +
            iconSvg(chip.icon, cx + 12, cy + (CHIP_H - ICON) / 2, color) +
            `<text x="${num(cx + 12 + ICON + 10)}" y="${cy + CHIP_H / 2 + 6}" font-size="${CHIP_FONT}" font-weight="700" fill="${theme.text}">${esc(chip.label)}</text>` +
            `</g>`,
        );
      }
    });
    y += rowH + PANEL_GAP;
  }
  const H = y - PANEL_GAP + MARGIN;

  css.push(`text{font-family:${MONO}}`);
  css.push(`.chip{animation:pop .5s cubic-bezier(.2,1.4,.4,1) both}@keyframes pop{from{opacity:0;transform:translateY(10px)}}`);
  css.push(`@media (prefers-reduced-motion:reduce){*{animation:none!important}}`);

  const list = groups.map((g) => `${g.group}: ${g.items.map((it) => it.label ?? iconFor(it).title).join(', ')}`).join('; ');
  return svgDoc({
    width: W,
    height: H,
    title: 'Toolbox',
    desc: list,
    css: fontFaces([400, 700]) + css.join(''),
    body: `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${theme.card}" stroke="${theme.border}" stroke-width="2"/>\n${body.join('\n')}`,
  });
}
