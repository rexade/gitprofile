#!/usr/bin/env node
// Builds every SVG in assets/ from profile.config.mjs (+ live GitHub data when
// a token is available) and refreshes the project grid in README.md.
//
//   npm run build              # uses GITHUB_TOKEN / PROFILE_TOKEN if set
//   npm run build -- --offline # re-render from the cached data/github.json

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../profile.config.mjs';
import { fetchProfileData } from './lib/github.mjs';
import { renderHeader } from './render/header.mjs';
import { renderTerminal } from './render/terminal.mjs';
import { renderStack } from './render/stack.mjs';
import { renderStats } from './render/stats.mjs';
import { renderProject } from './render/project.mjs';
import { renderFooter } from './render/footer.mjs';
import { renderSnake } from './render/snake.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const PROJECTS = join(ASSETS, 'projects');
const DATA_FILE = join(ROOT, 'data', 'github.json');
const README = join(ROOT, 'README.md');
// Written by the Platane/snk step of the workflow (not committed).
const SNAKE_RAW = join(ROOT, '.cache', 'snake.svg');

const offline = process.argv.includes('--offline');
const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
const changed = [];

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return;
  writeFileSync(path, content);
  changed.push(path.slice(ROOT.length + 1));
}

const slug = (repo) => repo.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

async function loadData() {
  const cached = existsSync(DATA_FILE) ? JSON.parse(readFileSync(DATA_FILE, 'utf8')) : null;
  if (offline || !token) {
    console.log(cached ? 'Using cached data/github.json' : 'No token and no cache: rendering placeholders');
    return cached;
  }
  try {
    const thisRepo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? basename(ROOT);
    const data = await fetchProfileData({
      login: config.login,
      token,
      featured: config.projects.map((p) => p.repo),
      ignoreRepos: [...(config.stats?.ignoreRepos ?? []), thisRepo],
      hideLanguages: config.stats?.hideLanguages ?? [],
      topLanguages: config.stats?.topLanguages ?? 6,
    });
    // Only rewrite the cache when something other than the timestamp moved.
    const strip = ({ fetchedAt, ...rest }) => JSON.stringify(rest);
    if (!cached || strip(cached) !== strip(data)) write(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
    return data;
  } catch (err) {
    // Keep the last good numbers rather than failing the whole refresh.
    console.log(`::warning::GitHub fetch failed, using cached data: ${err.message}`);
    return cached;
  }
}

function projectGrid(data) {
  const cards = config.projects.map((p) => {
    const alt = `${p.name}${p.tag ? ` (${p.tag})` : ''}: ${p.description ?? ''}`.replace(/"/g, '&quot;');
    const href = data?.repos?.[p.repo.toLowerCase()]?.url ?? `https://github.com/${config.login}/${p.repo}`;
    return `  <a href="${href}"><img src="assets/projects/${slug(p.repo)}.svg" width="49%" alt="${alt}"></a>`;
  });
  return `<p align="center">\n${cards.join('\n')}\n</p>`;
}

const data = await loadData();

write(join(ASSETS, 'header.svg'), renderHeader(config));
write(join(ASSETS, 'terminal.svg'), renderTerminal(config, data ?? {}));
write(join(ASSETS, 'stack.svg'), renderStack(config));
write(join(ASSETS, 'stats.svg'), renderStats(config, data));
write(join(ASSETS, 'footer.svg'), renderFooter(config));

// Keep the last good snake if this run didn't produce a fresh one.
if (existsSync(SNAKE_RAW)) write(join(ASSETS, 'snake.svg'), renderSnake(config, readFileSync(SNAKE_RAW, 'utf8')));
else if (!existsSync(join(ASSETS, 'snake.svg'))) write(join(ASSETS, 'snake.svg'), renderSnake(config, null));

const keep = new Set();
for (const project of config.projects) {
  const file = `${slug(project.repo)}.svg`;
  keep.add(file);
  write(join(PROJECTS, file), renderProject(project, data?.repos?.[project.repo.toLowerCase()]));
}
for (const file of existsSync(PROJECTS) ? readdirSync(PROJECTS) : []) {
  if (file.endsWith('.svg') && !keep.has(file)) {
    rmSync(join(PROJECTS, file));
    changed.push(`assets/projects/${file} (removed)`);
  }
}

if (existsSync(README)) {
  const readme = readFileSync(README, 'utf8');
  const next = readme.replace(
    /(<!-- projects:start -->)[\s\S]*?(<!-- projects:end -->)/,
    (_, start, end) => `${start}\n${projectGrid(data)}\n${end}`,
  );
  write(README, next);
}

console.log(changed.length ? `Updated:\n  ${changed.join('\n  ')}` : 'Everything up to date.');
