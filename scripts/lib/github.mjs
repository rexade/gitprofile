// Fetches profile data from the GitHub GraphQL API and boils it down to the
// small, public-safe summary the cards need. Private repositories may count
// towards totals (when a token that can see them is used) but their names
// and details are never written anywhere.

const API = 'https://api.github.com/graphql';

async function gql(query, variables, token) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-cards',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`GitHub API: ${json.errors.map((e) => e.message).join('; ')}`);
  return json.data;
}

const PROFILE_QUERY = `
query($login: String!, $after: String) {
  user(login: $login) {
    login
    name
    createdAt
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    publicRepos: repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    contributionsCollection { contributionYears }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, after: $after, orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        url
        description
        isPrivate
        stargazerCount
        forkCount
        primaryLanguage { name color }
        languages(first: 12, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
      }
    }
  }
}`;

function yearsQuery(years, now) {
  const parts = years.map((y) => {
    const to = y === now.getUTCFullYear() ? now.toISOString() : `${y}-12-31T23:59:59Z`;
    return `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${to}") {
      totalCommitContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }`;
  });
  return `query($login: String!) { user(login: $login) { ${parts.join('\n')} } }`;
}

const DAY = 86400000;
const dayNumber = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
const isoDay = (n) => new Date(n * DAY).toISOString().slice(0, 10);

/**
 * Current and longest streak from a list of { date: 'YYYY-MM-DD', count }.
 * A streak is still "current" if the last contribution was today or
 * yesterday (today isn't over yet).
 */
export function computeStreaks(days, today) {
  const counts = new Map();
  for (const d of days) {
    if (d.date > today) continue;
    counts.set(d.date, Math.max(counts.get(d.date) ?? 0, d.count));
  }
  const active = [...counts].filter(([, c]) => c > 0).map(([date]) => dayNumber(date)).sort((a, b) => a - b);

  let longest = { days: 0, start: null, end: null };
  let runStart = null;
  for (let i = 0; i < active.length; i++) {
    if (i === 0 || active[i] !== active[i - 1] + 1) runStart = active[i];
    const length = active[i] - runStart + 1;
    if (length > longest.days) longest = { days: length, start: isoDay(runStart), end: isoDay(active[i]) };
  }

  const set = new Set(active);
  const todayN = dayNumber(today);
  let end = set.has(todayN) ? todayN : set.has(todayN - 1) ? todayN - 1 : null;
  let current = { days: 0, start: null, end: null };
  if (end !== null) {
    let start = end;
    while (set.has(start - 1)) start--;
    current = { days: end - start + 1, start: isoDay(start), end: isoDay(end) };
  }
  return { current, longest };
}

/**
 * Language share across repos. Weighted by sqrt(bytes) * sqrt(repo count) so
 * one huge repo doesn't drown everything else out.
 */
export function languageShares(repos, { hide = [], top = 6 } = {}) {
  const hidden = new Set(hide.map((l) => l.toLowerCase()));
  const totals = new Map();
  for (const repo of repos) {
    for (const edge of repo.languages?.edges ?? []) {
      const { name, color } = edge.node;
      if (hidden.has(name.toLowerCase())) continue;
      const t = totals.get(name) ?? { name, color: color ?? null, bytes: 0, repos: 0 };
      t.bytes += edge.size;
      t.repos += 1;
      totals.set(name, t);
    }
  }
  const scored = [...totals.values()].map((t) => ({ ...t, score: Math.sqrt(t.bytes) * Math.sqrt(t.repos) }));
  const sum = scored.reduce((s, t) => s + t.score, 0) || 1;
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
    .map((t) => ({ name: t.name, color: t.color, percent: Math.round((t.score / sum) * 1000) / 10 }));
}

export async function fetchProfileData({ login, token, featured = [], ignoreRepos = [], hideLanguages = [], topLanguages = 6, now = new Date() }) {
  let user;
  const repos = [];
  let after = null;
  for (let page = 0; page < 10; page++) {
    const data = await gql(PROFILE_QUERY, { login, after }, token);
    if (!data.user) throw new Error(`GitHub user "${login}" not found`);
    user ??= data.user;
    repos.push(...data.user.repositories.nodes);
    if (!data.user.repositories.pageInfo.hasNextPage) break;
    after = data.user.repositories.pageInfo.endCursor;
  }

  const years = user.contributionsCollection.contributionYears.length
    ? user.contributionsCollection.contributionYears
    : [now.getUTCFullYear()];
  const yearData = (await gql(yearsQuery(years, now), { login }, token)).user;

  const days = [];
  let totalContributions = 0;
  for (const y of years) {
    const col = yearData[`y${y}`];
    totalContributions += col.contributionCalendar.totalContributions;
    for (const week of col.contributionCalendar.weeks) {
      for (const d of week.contributionDays) days.push({ date: d.date, count: d.contributionCount });
    }
  }
  const year = now.getUTCFullYear();
  const thisYear = yearData[`y${year}`];

  const skip = new Set([login.toLowerCase(), ...ignoreRepos.map((r) => r.toLowerCase())]);
  const featuredSet = new Set(featured.map((r) => r.toLowerCase()));

  const publicFeatured = {};
  for (const r of repos) {
    if (r.isPrivate || !featuredSet.has(r.name.toLowerCase())) continue;
    publicFeatured[r.name.toLowerCase()] = {
      name: r.name,
      url: r.url,
      description: r.description,
      stars: r.stargazerCount,
      forks: r.forkCount,
      language: r.primaryLanguage,
    };
  }

  return {
    version: 1,
    fetchedAt: now.toISOString(),
    login: user.login,
    since: new Date(user.createdAt).getUTCFullYear(),
    year,
    followers: user.followers.totalCount,
    publicRepos: user.publicRepos.totalCount,
    stars: repos.reduce((s, r) => s + r.stargazerCount, 0),
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    commitsThisYear: thisYear?.totalCommitContributions ?? 0,
    yearContributions: thisYear?.contributionCalendar.totalContributions ?? 0,
    totalContributions,
    streak: computeStreaks(days, now.toISOString().slice(0, 10)),
    languages: languageShares(
      repos.filter((r) => !skip.has(r.name.toLowerCase())),
      { hide: hideLanguages, top: topLanguages },
    ),
    repos: publicFeatured,
  };
}
