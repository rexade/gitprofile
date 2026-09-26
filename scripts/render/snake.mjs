import { theme } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO } from '../lib/svg.mjs';
import { pixelText } from '../lib/pixel.mjs';

const W = 1200;
const PAD = 30;

/**
 * Frames the contribution snake from Platane/snk in a card that matches the
 * rest of the profile. `raw` is snk's SVG output (or null for a placeholder).
 */
export function renderSnake(config, raw) {
  const body = [];
  let innerH = 150;
  let snake = '';
  if (raw) {
    const open = raw.match(/<svg\b[^>]*>/);
    const viewBox = open?.[0].match(/viewBox="([^"]+)"/)?.[1];
    if (!open || !viewBox) throw new Error('Unexpected snake SVG: no <svg viewBox>');
    const [, , vw, vh] = viewBox.split(/[\s,]+/).map(Number);
    const inner = raw.slice(open.index + open[0].length, raw.lastIndexOf('</svg>'));
    const width = W - PAD * 2;
    innerH = Math.round((width * vh) / vw);
    snake = `<svg x="${PAD}" y="84" width="${width}" height="${innerH}" viewBox="${viewBox}">${inner}</svg>`;
  }
  const H = 84 + innerH + 26;

  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${theme.card}" stroke="${theme.border}" stroke-width="2"/>`);
  body.push(pixelText('SEA SERPENT', { x: 36, y: 30, cell: 4, fill: theme.gold }).svg);
  body.push(
    `<text x="${W - 36}" y="54" text-anchor="end" font-size="16" fill="${theme.muted}" font-family="${MONO}">devours the contribution graph · daily</text>`,
  );
  body.push(`<rect x="36" y="78" width="${W - 72}" height="1.5" fill="${theme.border}"/>`);
  if (snake) {
    body.push(snake);
  } else {
    body.push(
      `<text x="${W / 2}" y="${84 + innerH / 2 + 6}" text-anchor="middle" font-size="18" fill="${theme.muted}" font-family="${MONO}">the serpent surfaces after the first daily refresh ~</text>`,
    );
  }

  return svgDoc({
    width: W,
    height: H,
    title: 'Sea serpent',
    desc: `A snake eating ${config.login}'s GitHub contribution graph.`,
    css: fontFaces([400]),
    body: body.join('\n'),
  });
}
