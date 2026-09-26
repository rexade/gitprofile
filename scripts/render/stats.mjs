import { theme } from '../lib/theme.mjs';
import { svgDoc, fontFaces, MONO, esc, num, fmtInt, readableOn } from '../lib/svg.mjs';
import { pixelText, sprite } from '../lib/pixel.mjs';
import { icons8 } from '../lib/sprites.mjs';
import { wavePath } from '../lib/scene.mjs';

const W = 1200;
const H = 440;

const shortDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';

/** "SEP 4 – TODAY", "TODAY", "SEP 4 – SEP 25" … for the current streak. */
export function streakLabel(streak, today) {
  if (!streak?.days) return null;
  const day = (iso) => (iso === today ? 'TODAY' : shortDate(iso).toUpperCase());
  return streak.start === streak.end ? day(streak.end) : `${day(streak.start)} – ${day(streak.end)}`;
}

function sectionLabel(x, y, text) {
  return `<rect x="${x}" y="${y - 9}" width="8" height="8" fill="${theme.cyan}"/><text x="${x + 18}" y="${y}" font-size="15" font-weight="700" letter-spacing="3" fill="${theme.soft}">${esc(text)}</text>`;
}

export function renderStats(config, data) {
  const has = data && data.fetchedAt;
  const year = data?.year ?? new Date().getUTCFullYear();
  const body = [];
  const defs = [];
  const css = [];

  defs.push(`<radialGradient id="hi" cx=".08" cy="0" r=".8"><stop offset="0" stop-color="${theme.teal}" stop-opacity=".12"/><stop offset="1" stop-color="${theme.teal}" stop-opacity="0"/></radialGradient>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${theme.card}" stroke="${theme.border}" stroke-width="2"/>`);
  body.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="url(#hi)"/>`);
  body.push(pixelText("SHIP'S LOG", { x: 36, y: 30, cell: 4, fill: theme.gold }).svg);
  body.push(
    `<text x="${W - 36}" y="54" text-anchor="end" font-size="16" fill="${theme.muted}">${has ? `github.com/${esc(data.login)} · refreshed daily` : 'charting the seas… waiting for the first refresh'}</text>`,
  );
  body.push(`<rect x="36" y="78" width="${W - 72}" height="1.5" fill="${theme.border}"/>`);
  [410, 790].forEach((x) => body.push(`<path d="M${x} 104V${H - 30}" stroke="${theme.border}" stroke-dasharray="4 7"/>`));

  // --- voyage stats ---------------------------------------------------------
  body.push(sectionLabel(36, 118, 'VOYAGE STATS'));
  const rows = [
    ['anchor', `Contributions ${year}`, data?.yearContributions],
    ['commit', `Commits ${year}`, data?.commitsThisYear],
    ['pr', 'Pull requests', data?.prs],
    ['issue', 'Issues', data?.issues],
    ['crate', 'Public repos', data?.publicRepos],
    ['star', 'Stars earned', data?.stars],
  ];
  const iconColors = [theme.cyan, theme.green, theme.aqua, theme.coral, theme.sand, theme.gold];
  rows.forEach(([icon, label, value], i) => {
    const y = 162 + i * 44;
    body.push(
      `<g class="row" style="animation-delay:${num(0.15 + i * 0.08)}s">` +
        sprite(icons8[icon], { '#': iconColors[i] }, { x: 36, y: y - 19, cell: 3 }) +
        `<text x="76" y="${y}" font-size="19" fill="${theme.soft}">${esc(label)}</text>` +
        `<text x="390" y="${y}" text-anchor="end" font-size="22" font-weight="700" fill="${theme.text}">${fmtInt(value)}</text></g>`,
    );
  });
  css.push(`.row{animation:rise .6s ease-out both}@keyframes rise{from{opacity:0;transform:translateY(8px)}}`);

  // --- streak buoy ------------------------------------------------------------
  const cx = 600;
  const cy = 232;
  const r = 78;
  const circ = 2 * Math.PI * r;
  body.push(sectionLabel(430, 118, 'CURRENT STREAK'));
  // a fixed mask fades the water strip out at both ends while the waves drift
  defs.push(`<linearGradient id="fadeX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".22" stop-color="#fff"/><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>`);
  defs.push(`<mask id="pond" maskUnits="userSpaceOnUse" x="440" y="280" width="320" height="60"><rect x="440" y="280" width="320" height="60" fill="url(#fadeX)"/></mask>`);
  body.push(`<g class="rope"><circle cx="${cx}" cy="${cy}" r="${r + 20}" fill="none" stroke="#c9a46a" stroke-width="3" stroke-dasharray="7 6" opacity=".7"/></g>`);
  body.push(
    `<g class="buoy"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f8fafc" stroke-width="28"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.red}" stroke-width="28" stroke-dasharray="${num(circ / 8)} ${num(circ / 8)}"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r - 14}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1.5"/></g>`,
  );
  // the buoy floats: a strip of water across its lower edge
  const water = wavePath({ width: 360, base: 300, amp: 3, wavelength: 40, step: 5, bottom: 340, grid: 3 });
  body.push(
    `<g mask="url(#pond)"><g class="ripple"><path fill="#2a6a9a" transform="translate(440 0)" d="${water}"/><path fill="#0c2a4d" transform="translate(440 4)" d="${water}"/></g></g>`,
  );
  const streak = data?.streak?.current?.days;
  const size = String(streak ?? '–').length >= 3 ? 42 : 54;
  body.push(`<text x="${cx}" y="${cy + size * 0.28}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${theme.text}">${fmtInt(streak)}</text>`);
  body.push(`<text x="${cx}" y="${cy + 40}" text-anchor="middle" font-size="15" fill="${theme.muted}">${streak === 1 ? 'day' : 'days'}</text>`);
  const cur = data?.streak?.current;
  const longest = data?.streak?.longest;
  body.push(
    `<text x="${cx}" y="370" text-anchor="middle" font-size="16" font-weight="700" letter-spacing="2" fill="${theme.gold}">${esc(streakLabel(cur, data?.fetchedAt?.slice(0, 10)) ?? (has ? 'SET SAIL TODAY' : 'CURRENT STREAK'))}</text>`,
  );
  body.push(
    `<text x="${cx}" y="400" text-anchor="middle" font-size="16" fill="${theme.muted}">longest <tspan fill="${theme.text}" font-weight="700">${fmtInt(longest?.days)}</tspan> · lifetime <tspan fill="${theme.text}" font-weight="700">${fmtInt(data?.totalContributions)}</tspan></text>`,
  );
  css.push(
    `.buoy{transform-origin:${cx}px ${cy}px;animation:spin 40s linear infinite}.rope{transform-origin:${cx}px ${cy}px;animation:spin 60s linear infinite reverse}@keyframes spin{to{transform:rotate(360deg)}}`,
    `.ripple{animation:ripple 3s linear infinite}@keyframes ripple{to{transform:translateX(-40px)}}`,
  );

  // --- languages -----------------------------------------------------------
  body.push(sectionLabel(810, 118, 'CARGO HOLD · LANGUAGES'));
  const langs = (data?.languages ?? []).map((l) => ({ ...l, color: readableOn(l.color ?? theme.dim, theme.card, 2.5) }));
  const bx = 810;
  const bw = W - 36 - bx;
  if (!langs.length) {
    body.push(`<text x="${bx}" y="200" font-size="17" fill="${theme.muted}">hold's empty for now —</text>`);
    body.push(`<text x="${bx}" y="228" font-size="17" fill="${theme.muted}">the daily refresh will stock it.</text>`);
  } else {
    const total = langs.reduce((s, l) => s + l.percent, 0);
    defs.push(`<clipPath id="bar"><rect x="${bx}" y="142" width="${bw}" height="14" rx="7"/></clipPath>`);
    let x = bx;
    const segs = langs.map((l) => {
      const w = (l.percent / total) * bw;
      const seg = `<rect x="${num(x)}" y="142" width="${num(w + 0.5)}" height="14" fill="${l.color}"/>`;
      x += w;
      return seg;
    });
    body.push(`<g clip-path="url(#bar)"><g class="grow">${segs.join('')}</g></g>`);
    css.push(`.grow{transform-origin:${bx}px 0;animation:grow 1.2s cubic-bezier(.3,.9,.3,1) .2s both}@keyframes grow{from{transform:scaleX(0)}}`);
    langs.forEach((l, i) => {
      const y = 198 + i * 34;
      body.push(
        `<g class="row" style="animation-delay:${num(0.3 + i * 0.08)}s"><rect x="${bx}" y="${y - 13}" width="14" height="14" fill="${l.color}"/>` +
          `<text x="${bx + 26}" y="${y}" font-size="18" fill="${theme.text}">${esc(l.name)}</text>` +
          `<text x="${W - 36}" y="${y}" text-anchor="end" font-size="18" fill="${theme.muted}">${num(l.percent, 1)}%</text></g>`,
      );
    });
  }

  css.push(`text{font-family:${MONO}}`);
  css.push(`@media (prefers-reduced-motion:reduce){*{animation:none!important}}`);

  const desc = has
    ? `${data.yearContributions} contributions and ${data.commitsThisYear} commits in ${year}; ${data.prs} pull requests; ${data.issues} issues; ${data.publicRepos} public repos; ${data.stars} stars. Current streak ${data.streak.current.days} days, longest ${data.streak.longest.days} days, ${data.totalContributions} contributions in total. Top languages: ${langs.map((l) => `${l.name} ${l.percent}%`).join(', ')}.`
    : 'GitHub stats will appear after the first scheduled refresh.';
  return svgDoc({ width: W, height: H, title: "Ship's log: GitHub stats", desc, css: fontFaces([400, 700]) + css.join(''), defs: defs.join(''), body: body.join('\n') });
}
