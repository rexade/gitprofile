import { theme, markup } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO, MONO_ADVANCE, esc, num, tspans, plainLength } from '../lib/svg.mjs';
import { sprite, spriteSize } from '../lib/pixel.mjs';
import { bigAnchor } from '../lib/sprites.mjs';

const W = 1200;
const FONT = 22;
const CH = FONT * MONO_ADVANCE; // advance of one character
const LINE = 36;
const BAR = 46;
const PAD_X = 36;
const TYPE_SPEED = 0.055; // seconds per typed character

/** Fill {since}/{repos}/... placeholders from live data. */
export function fillPlaceholders(text, data) {
  const values = {
    since: data.since ?? '…',
    repos: data.publicRepos ?? '…',
    year: data.year ?? new Date().getUTCFullYear(),
    yearContributions: data.yearContributions != null ? data.yearContributions.toLocaleString('en-US') : '…',
    followers: data.followers ?? '…',
    stars: data.stars ?? '…',
  };
  return text.replace(/\{(since|repos|year|yearContributions|followers|stars)\}/g, (_, k) => String(values[k]));
}

export function renderTerminal(config, data) {
  const { host, session } = config.terminal;
  const prompt = `{cyanBold:${host}}{muted::}{aqua:~}{muted:$} `;
  const promptLen = plainLength(prompt);

  // Build the timeline: which line shows up when.
  const lines = [];
  let t = 0.5;
  for (const step of session) {
    const cmd = fillPlaceholders(step.cmd, data);
    const typeAt = t + 0.5;
    const typedAt = typeAt + (cmd.length + 1) * TYPE_SPEED;
    lines.push({ kind: 'cmd', at: t, typeAt, typedAt, cmd });
    t = typedAt + 0.35;
    for (const out of step.out) {
      lines.push({ kind: 'out', at: t, text: fillPlaceholders(out, data) });
      t += 0.09;
    }
    t += 0.55;
  }
  lines.push({ kind: 'prompt', at: t });

  const top = BAR + 46;
  const H = top + (lines.length - 1) * LINE + 32;
  const defs = [];
  const body = [];

  defs.push(`<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1731"/><stop offset="1" stop-color="${theme.card}"/></linearGradient>`);
  defs.push(`<radialGradient id="glow" cx=".15" cy="0" r=".9"><stop offset="0" stop-color="${theme.teal}" stop-opacity=".10"/><stop offset="1" stop-color="${theme.teal}" stop-opacity="0"/></radialGradient>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#bg)" stroke="${theme.border}" stroke-width="2"/>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#glow)"/>`);
  body.push(`<path d="M1 ${BAR}V15a14 14 0 0 1 14-14h${W - 30}a14 14 0 0 1 14 14V${BAR}z" fill="#0e1b38"/>`);
  body.push(`<rect x="1" y="${BAR}" width="${W - 2}" height="1.5" fill="${theme.border}"/>`);
  [theme.coral, theme.gold, theme.green].forEach((c, i) => body.push(`<circle cx="${28 + i * 24}" cy="${BAR / 2 + 1}" r="7" fill="${c}"/>`));
  body.push(`<text x="${W / 2}" y="${BAR / 2 + 6}" text-anchor="middle" font-size="16" fill="${theme.muted}">${esc(host)}: ~</text>`);
  body.push(`<text x="${W - 28}" y="${BAR / 2 + 6}" text-anchor="end" font-size="14" fill="${theme.dim}">bash · 120×${lines.length}</text>`);

  lines.forEach((line, i) => {
    const y = top + i * LINE;
    const show = `<set attributeName="opacity" to="1" begin="${num(line.at)}s" fill="freeze"/>`;
    if (line.kind === 'out') {
      body.push(`<g opacity="0">${show}<text x="${PAD_X}" y="${y}" font-size="${FONT}" xml:space="preserve">${tspans(line.text, markup, theme.soft)}</text></g>`);
      return;
    }
    const cmdX = PAD_X + promptLen * CH;
    const cursorY = y - FONT * 0.8;
    const parts = [`<g opacity="0">${show}`, `<text x="${PAD_X}" y="${y}" font-size="${FONT}" xml:space="preserve">${tspans(prompt, markup, theme.soft)}</text>`];
    if (line.kind === 'cmd') {
      const n = line.cmd.length;
      const steps = Array.from({ length: n + 1 }, (_, k) => num(k * CH));
      const xs = Array.from({ length: n + 1 }, (_, k) => num(cmdX + k * CH));
      const dur = num((n + 1) * TYPE_SPEED);
      defs.push(
        `<clipPath id="type${i}"><rect x="${num(cmdX)}" y="${num(y - FONT)}" width="0" height="${FONT + 8}"><animate attributeName="width" values="${steps.join(';')}" calcMode="discrete" begin="${num(line.typeAt)}s" dur="${dur}s" fill="freeze"/></rect></clipPath>`,
      );
      parts.push(`<text x="${num(cmdX)}" y="${y}" font-size="${FONT}" fill="${theme.text}" clip-path="url(#type${i})" xml:space="preserve">${esc(line.cmd)}</text>`);
      parts.push(
        `<rect x="${num(cmdX)}" y="${num(cursorY)}" width="${num(CH)}" height="${FONT + 2}" fill="${theme.cyan}" opacity=".85">` +
          `<animate attributeName="opacity" values=".85;0" calcMode="discrete" dur=".9s" begin="${num(line.at)}s" end="${num(line.typeAt)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="x" values="${xs.join(';')}" calcMode="discrete" begin="${num(line.typeAt)}s" dur="${dur}s" fill="freeze"/>` +
          `<set attributeName="opacity" to="0" begin="${num(line.typedAt + 0.3)}s" fill="freeze"/></rect>`,
      );
    } else {
      parts.push(
        `<rect x="${num(cmdX)}" y="${num(cursorY)}" width="${num(CH)}" height="${FONT + 2}" fill="${theme.cyan}" opacity=".85">` +
          `<animate attributeName="opacity" values=".85;0" calcMode="discrete" dur="1.1s" begin="${num(line.at)}s" repeatCount="indefinite"/></rect>`,
      );
    }
    parts.push('</g>');
    body.push(parts.join(''));
  });

  // A big pixel anchor keeps the right-hand side company.
  const cell = 7;
  const art = spriteSize(bigAnchor.rows, cell);
  const ax = W - 70 - art.width;
  const ay = Math.round(BAR + (H - BAR - art.height) / 2);
  body.push(
    `<g class="anchor"><g opacity=".9">${sprite(bigAnchor.rows, { o: '#0b3b4a' }, { x: ax + 6, y: ay + 6, cell })}</g>${sprite(bigAnchor.rows, { o: 'url(#gold)' }, { x: ax, y: ay, cell })}</g>`,
  );
  defs.push(`<linearGradient id="gold" x1="0" y1="${ay}" x2="0" y2="${ay + art.height}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fde68a"/><stop offset=".55" stop-color="${theme.gold}"/><stop offset="1" stop-color="#d97706"/></linearGradient>`);
  const css = `.anchor{animation:bob 4.5s ease-in-out infinite}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  const transcript = lines
    .map((l) => (l.kind === 'cmd' ? `$ ${l.cmd}` : l.kind === 'out' ? l.text.replace(/\{\w+:([^}]*)\}/g, '$1') : ''))
    .filter(Boolean)
    .join(' / ');

  return svgDoc({
    width: W,
    height: H,
    title: `${host} terminal`,
    desc: transcript,
    css: fontFaces([400, 700]) + `text{font-family:${MONO}}` + css,
    defs: defs.join(''),
    body: body.join('\n'),
  });
}
