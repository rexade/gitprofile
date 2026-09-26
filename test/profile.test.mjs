import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../profile.config.mjs';
import { computeStreaks, languageShares, fetchProfileData } from '../scripts/lib/github.mjs';
import { wrap, readableOn } from '../scripts/lib/svg.mjs';
import { measurePixelText, pixelCells } from '../scripts/lib/pixel.mjs';
import { renderHeader } from '../scripts/render/header.mjs';
import { renderTerminal, fillPlaceholders } from '../scripts/render/terminal.mjs';
import { renderStack } from '../scripts/render/stack.mjs';
import { renderStats, streakLabel } from '../scripts/render/stats.mjs';
import { renderProject } from '../scripts/render/project.mjs';
import { renderFooter } from '../scripts/render/footer.mjs';
import { renderSnake } from '../scripts/render/snake.mjs';

const day = (date, count) => ({ date, count });

test('streak: counts consecutive days up to today', () => {
  const s = computeStreaks([day('2026-09-23', 1), day('2026-09-24', 2), day('2026-09-25', 0), day('2026-09-26', 3)], '2026-09-26');
  assert.deepEqual(s.current, { days: 1, start: '2026-09-26', end: '2026-09-26' });
  assert.deepEqual(s.longest, { days: 2, start: '2026-09-23', end: '2026-09-24' });
});

test('streak: still alive when today has no contributions yet', () => {
  const s = computeStreaks([day('2026-09-24', 1), day('2026-09-25', 1), day('2026-09-26', 0)], '2026-09-26');
  assert.equal(s.current.days, 2);
  assert.equal(s.current.end, '2026-09-25');
});

test('streak: broken when yesterday and today are empty', () => {
  const s = computeStreaks([day('2026-09-20', 5), day('2026-09-21', 5)], '2026-09-26');
  assert.equal(s.current.days, 0);
  assert.equal(s.longest.days, 2);
});

test('streak: ignores future days, dedupes dates, spans year boundaries', () => {
  const s = computeStreaks(
    [day('2025-12-31', 1), day('2026-01-01', 1), day('2026-01-01', 0), day('2026-01-02', 4), day('2026-01-05', 9)],
    '2026-01-03',
  );
  assert.equal(s.current.days, 3);
  assert.equal(s.current.start, '2025-12-31');
  assert.equal(s.longest.days, 3);
});

test('streak: empty history', () => {
  const s = computeStreaks([], '2026-09-26');
  assert.equal(s.current.days, 0);
  assert.equal(s.longest.days, 0);
});

const repo = (name, langs, extra = {}) => ({
  name,
  isPrivate: false,
  stargazerCount: 0,
  forkCount: 0,
  languages: { edges: langs.map(([n, size]) => ({ size, node: { name: n, color: '#123456' } })) },
  ...extra,
});

test('languages: hidden ones are dropped and one huge repo does not dominate', () => {
  const shares = languageShares(
    [repo('a', [['C#', 1_000_000]]), repo('b', [['TypeScript', 40_000], ['HTML', 900_000]]), repo('c', [['TypeScript', 40_000]])],
    { hide: ['html'], top: 5 },
  );
  assert.deepEqual(shares.map((l) => l.name), ['C#', 'TypeScript']);
  // 1M bytes of C# in one repo vs 80k of TS across two: TS still gets a real share.
  assert.ok(shares[1].percent > 20, `TypeScript share ${shares[1].percent}`);
  assert.ok(Math.abs(shares.reduce((s, l) => s + l.percent, 0) - 100) < 0.5);
});

test('wrap: respects width and marks truncation', () => {
  const lines = wrap('one two three four five six seven eight nine ten eleven twelve', 12, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines.every((l) => l.length <= 12));
  assert.ok(lines[1].endsWith('…'));
  assert.deepEqual(wrap('short text', 40, 3), ['short text']);
});

test('pixel font: measures text and falls back for unknown glyphs', () => {
  assert.equal(measurePixelText('A', 2), 10);
  assert.equal(measurePixelText('AA', 2), 22);
  assert.ok(pixelCells('~', { cell: 1 }).cells.length > 0);
});

test('readableOn lifts dark brand colours off a dark background', () => {
  assert.notEqual(readableOn('#000080', '#0a1328'), '#000080');
  assert.equal(readableOn('#fbbf24', '#0a1328'), '#fbbf24');
});

test('terminal placeholders are filled from data', () => {
  assert.equal(fillPlaceholders('{since}/{repos}/{yearContributions}', { since: 2018, publicRepos: 12, yearContributions: 1234 }), '2018/12/1,234');
  assert.equal(fillPlaceholders('{repos}', {}), '…');
});

test('streak label names the right days', () => {
  assert.equal(streakLabel({ days: 1, start: '2026-09-26', end: '2026-09-26' }, '2026-09-26'), 'TODAY');
  assert.equal(streakLabel({ days: 23, start: '2026-09-04', end: '2026-09-26' }, '2026-09-26'), 'SEP 4 – TODAY');
  assert.equal(streakLabel({ days: 3, start: '2026-09-23', end: '2026-09-25' }, '2026-09-26'), 'SEP 23 – SEP 25');
  assert.equal(streakLabel({ days: 0, start: null, end: null }, '2026-09-26'), null);
});

/** Minimal well-formedness check: every tag closes in order. */
function assertBalanced(svg, name) {
  assert.ok(svg.startsWith('<svg'), `${name}: starts with <svg`);
  assert.ok(!/undefined|NaN|\[object/.test(svg), `${name}: no undefined/NaN`);
  const stack = [];
  for (const [, close, tag, , selfClose] of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    if (selfClose) continue;
    if (!close) stack.push(tag);
    else assert.equal(stack.pop(), tag, `${name}: </${tag}> closes the right element`);
  }
  assert.deepEqual(stack, [], `${name}: all elements closed`);
}

const sample = {
  fetchedAt: '2026-09-26T04:23:00Z',
  login: 'rexade',
  since: 2018,
  year: 2026,
  followers: 5,
  publicRepos: 12,
  stars: 3,
  prs: 42,
  issues: 17,
  commitsThisYear: 873,
  yearContributions: 1204,
  totalContributions: 3391,
  streak: { current: { days: 23, start: '2026-09-04', end: '2026-09-26' }, longest: { days: 61, start: '2026-04-02', end: '2026-06-01' } },
  languages: [
    { name: 'TypeScript', color: '#3178c6', percent: 60 },
    { name: 'Lua', color: '#000080', percent: 40 },
  ],
  repos: { 'mini-planet': { stars: 2, forks: 1, language: { name: 'JavaScript', color: '#f1e05a' } } },
};

test('every card renders well-formed SVG, with and without data', () => {
  for (const data of [sample, null]) {
    assertBalanced(renderHeader(config), 'header');
    assertBalanced(renderTerminal(config, data ?? {}), 'terminal');
    assertBalanced(renderStack(config), 'stack');
    assertBalanced(renderStats(config, data), 'stats');
    assertBalanced(renderFooter(config), 'footer');
    for (const p of config.projects) assertBalanced(renderProject(p, data?.repos?.[p.repo.toLowerCase()]), p.repo);
    assertBalanced(renderSnake(config, null), 'snake placeholder');
  }
});

test('snake card nests the snk output', () => {
  const raw = '<svg viewBox="-16 -32 880 192" width="880" height="192" xmlns="http://www.w3.org/2000/svg"><rect class="c" x="0" y="0"/></svg>';
  const svg = renderSnake(config, raw);
  assertBalanced(svg, 'snake');
  assert.match(svg, /<svg x="30" y="84" width="1140" height="249" viewBox="-16 -32 880 192"><rect class="c" x="0" y="0"\/><\/svg>/);
  assert.throws(() => renderSnake(config, 'not an svg'));
});

test('fetchProfileData never leaks private repositories', async (t) => {
  const repos = [
    repo('mini-planet', [['JavaScript', 5000]], { stargazerCount: 2, url: 'https://github.com/rexade/mini-planet', description: 'planet', primaryLanguage: { name: 'JavaScript', color: '#f1e05a' } }),
    repo('secret-game', [['C#', 90000]], { isPrivate: true, stargazerCount: 1, url: 'https://github.com/rexade/secret-game', description: 'top secret' }),
  ];
  const calendar = { totalContributions: 3, weeks: [{ contributionDays: [day2('2026-09-25', 1), day2('2026-09-26', 2)] }] };
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const { query } = JSON.parse(init.body);
    const user = query.includes('y2026')
      ? { y2026: { totalCommitContributions: 2, contributionCalendar: calendar } }
      : {
          login: 'rexade',
          name: null,
          createdAt: '2018-10-23T10:45:24Z',
          followers: { totalCount: 5 },
          pullRequests: { totalCount: 1 },
          issues: { totalCount: 0 },
          publicRepos: { totalCount: 1 },
          contributionsCollection: { contributionYears: [2026] },
          repositories: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: repos },
        };
    return new Response(JSON.stringify({ data: { user } }), { status: 200 });
  });
  const data = await fetchProfileData({
    login: 'rexade',
    token: 'x',
    featured: ['mini-planet', 'secret-game'],
    now: new Date('2026-09-26T12:00:00Z'),
  });
  const json = JSON.stringify(data);
  assert.ok(!json.includes('secret-game') && !json.includes('top secret'), 'private repo details stay out');
  assert.deepEqual(Object.keys(data.repos), ['mini-planet']);
  assert.equal(data.stars, 3); // totals may include private repos
  assert.equal(data.streak.current.days, 2);
  assert.equal(data.since, 2018);
  assert.equal(data.yearContributions, 3);
});

function day2(date, contributionCount) {
  return { date, contributionCount };
}
