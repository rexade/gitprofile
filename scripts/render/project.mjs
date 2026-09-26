import { theme } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO, MONO_ADVANCE, esc, num, fmtInt, wrap, readableOn } from '../lib/svg.mjs';
import { sprite } from '../lib/pixel.mjs';
import { icons8, projectIcons } from '../lib/sprites.mjs';

const W = 600;
const H = 250;

const STATUS_COLORS = {
  sailing: theme.gold,
  active: theme.green,
  wip: theme.gold,
  tool: theme.aqua,
  toy: theme.violet,
  v1: theme.cyan,
  archived: theme.dim,
};

export function renderProject(project, repo) {
  const icon = projectIcons[project.icon] ?? projectIcons.anchor;
  const accent = Object.values(icon.palette)[0];
  const body = [];
  const defs = [];

  defs.push(`<radialGradient id="hi" cx="0" cy="0" r=".9"><stop offset="0" stop-color="${accent}" stop-opacity=".16"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="${theme.card}" stroke="${theme.border}" stroke-width="2"/>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="url(#hi)"/>`);

  // icon tile
  body.push(`<rect x="26" y="26" width="72" height="72" rx="14" fill="${theme.tile}" stroke="${theme.border}"/>`);
  body.push(`<g class="float">${sprite(icon.rows, icon.palette, { x: 38, y: 38, cell: 4 })}</g>`);

  // status pill
  const status = (project.status ?? '').toUpperCase();
  let titleMax = Math.floor((W - 116 - 28) / (26 * MONO_ADVANCE));
  if (status) {
    const color = STATUS_COLORS[project.status] ?? theme.cyan;
    const pw = status.length * 13 * MONO_ADVANCE + status.length * 2 + 38;
    body.push(
      `<rect x="${num(W - 26 - pw)}" y="30" width="${num(pw)}" height="28" rx="14" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-opacity=".45"/>` +
        `<circle class="pulse" cx="${num(W - 26 - pw + 16)}" cy="44" r="4.5" fill="${color}"/>` +
        `<text x="${num(W - 26 - pw + 28)}" y="49" font-size="13" font-weight="700" letter-spacing="2" fill="${color}">${esc(status)}</text>`,
    );
    titleMax = Math.floor((W - 116 - pw - 40) / (26 * MONO_ADVANCE));
  }

  const title = project.name.length > titleMax ? `${project.name.slice(0, titleMax - 1)}…` : project.name;
  body.push(`<text x="116" y="62" font-size="26" font-weight="700" fill="${theme.text}">${esc(title)}</text>`);
  if (project.tag) body.push(`<text x="116" y="90" font-size="16" fill="${theme.cyan}">${esc(project.tag)}</text>`);

  const desc = project.description ?? repo?.description ?? '';
  wrap(desc, 49, 3).forEach((line, i) => {
    body.push(`<text x="28" y="${140 + i * 28}" font-size="18" fill="${theme.soft}">${esc(line)}</text>`);
  });

  // footer: language, stars, forks
  const lang = repo?.language;
  let fx = 28;
  const fy = 226;
  if (lang?.name) {
    body.push(`<circle cx="${fx + 7}" cy="${fy - 6}" r="7" fill="${readableOn(lang.color ?? theme.dim, theme.card, 2.5)}"/>`);
    body.push(`<text x="${fx + 22}" y="${fy}" font-size="16" fill="${theme.muted}">${esc(lang.name)}</text>`);
    fx += 22 + lang.name.length * 16 * MONO_ADVANCE + 26;
  }
  const counter = (iconName, value) => {
    const svg =
      sprite(icons8[iconName], { '#': theme.muted }, { x: fx, y: fy - 14, cell: 2 }) +
      `<text x="${num(fx + 24)}" y="${fy}" font-size="16" fill="${theme.muted}">${fmtInt(value)}</text>`;
    fx += 24 + fmtInt(value).length * 16 * MONO_ADVANCE + 26;
    return svg;
  };
  body.push(counter('star', repo?.stars ?? 0), counter('fork', repo?.forks ?? 0));
  const room = Math.floor((W - 28 - fx) / (15 * MONO_ADVANCE)) - 2;
  const repoLabel = project.repo.length > room ? `${project.repo.slice(0, Math.max(0, room - 1))}…` : project.repo;
  if (room > 4) body.push(`<text x="${W - 28}" y="${fy}" text-anchor="end" font-size="15" fill="${theme.dim}">${esc(repoLabel)} ›</text>`);

  const css =
    `text{font-family:${MONO}}` +
    `.float{animation:float 3.6s ease-in-out infinite}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}` +
    `.pulse{animation:pulse 2.4s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}` +
    `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  return svgDoc({
    width: W,
    height: H,
    title: project.name,
    desc: `${project.tag ? `${project.tag}. ` : ''}${desc}`,
    css: fontFaces([400, 700]) + css,
    defs: defs.join(''),
    body: body.join('\n'),
  });
}
