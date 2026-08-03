#!/usr/bin/env node
/**
 * Turn upstream activity into issues on this tracker, and do nothing else.
 *
 * Spotlight Tools is a separate tool suite as of the fork. This script does NOT keep the
 * two codebases aligned, does not merge, does not cherry-pick, and does not open pull
 * requests. It answers one question on a schedule — "what did upstream change?" — and
 * files each answer as an issue so it can be adopted or declined deliberately, on this
 * project's own path.
 *
 * Declining is the expected outcome for most of them. An issue closed as `not planned`
 * is this working correctly.
 *
 * Idempotency comes from the issue titles: every issue it opens carries the upstream
 * short SHA, and a commit that already has an issue is never filed twice. There is no
 * marker file to drift and nothing is committed back to the repository.
 *
 * Usage:
 *   node scripts/upstream-watch.mjs                 # dry run — print what it would file
 *   node scripts/upstream-watch.mjs --file-issues   # actually open them (needs GITHUB_TOKEN)
 *   node scripts/upstream-watch.mjs --days 60       # widen the window (default 30)
 *   node scripts/upstream-watch.mjs --since <sha>   # explicit floor, overrides --days
 */

import { execFileSync } from 'node:child_process';

const UPSTREAM = 'https://github.com/stoplightio/spectral.git';
const UPSTREAM_BRANCH = 'develop';
const UPSTREAM_SLUG = 'stoplightio/spectral';
const REPO = process.env.GITHUB_REPOSITORY ?? 'api-commons/spotlight-tools';
const LABEL = 'upstream';

// Automated version-bump commits. These are not decisions anyone can take or decline —
// they are the release bot writing a version number — so they never become issues. The
// release they represent is captured by the substantive commits that went into it.
const IGNORE_SUBJECT = /^chore\(release\):/;

const argv = process.argv.slice(2);
const arg = name => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const fileIssues = argv.includes('--file-issues');
const days = Number(arg('--days') ?? 30);
const sinceSha = arg('--since');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// Fetch upstream into a detached ref so this works in a fresh CI clone with no remote set up.
try {
  git('fetch', '--quiet', UPSTREAM, `${UPSTREAM_BRANCH}:refs/upstream-watch/${UPSTREAM_BRANCH}`, '--force');
} catch {
  git('fetch', '--quiet', UPSTREAM, UPSTREAM_BRANCH, '--force');
}

let range;
try {
  git('rev-parse', '--verify', `refs/upstream-watch/${UPSTREAM_BRANCH}`);
  range = `refs/upstream-watch/${UPSTREAM_BRANCH}`;
} catch {
  range = 'FETCH_HEAD';
}

// `--not HEAD` is what keeps this honest: it excludes every upstream commit already
// reachable from our own history, so the fork point takes care of itself and there is no
// configured floor to go stale. The day window is only a backstop against a very old
// long-lived upstream branch turning up.
const window = sinceSha ? [`${sinceSha}..${range}`] : [range, '--not', 'HEAD', `--since=${days} days ago`];
const raw = git('log', '--no-merges', '--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s', ...window);

const commits = raw
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const [sha, short, author, date, subject] = line.split('\x1f');
    return { sha, short, author, date, subject };
  })
  .filter(c => !IGNORE_SUBJECT.test(c.subject));

if (commits.length === 0) {
  console.log('No new upstream commits in window.');
  process.exit(0);
}

// Which already have an issue? Search by short SHA, which every title carries.
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const api = async path => {
  if (token === undefined) return null;
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}: ${await res.text()}`);
  return res.json();
};

const existing = new Set();
if (token !== undefined) {
  let page = 1;
  for (;;) {
    const batch = await api(`repos/${REPO}/issues?state=all&labels=${LABEL}&per_page=100&page=${page}`);
    if (batch === null || batch.length === 0) break;
    for (const issue of batch) {
      const match = issue.title.match(/\b([0-9a-f]{7,12})\b/);
      if (match !== null) existing.add(match[1]);
    }
    if (batch.length < 100) break;
    page += 1;
  }
}

const pending = commits.filter(c => !existing.has(c.short));

console.log(`upstream ${UPSTREAM_SLUG}@${UPSTREAM_BRANCH}`);
console.log(`${commits.length} commit(s) in window, ${existing.size} already tracked, ${pending.length} to file\n`);

for (const c of pending) console.log(`  ${c.short}  ${c.date.slice(0, 10)}  ${c.subject}`);

if (!fileIssues) {
  console.log('\nDry run. Pass --file-issues to open these.');
  process.exit(0);
}

if (token === undefined) {
  console.error('\nGITHUB_TOKEN or GH_TOKEN is required to file issues.');
  process.exit(1);
}

for (const c of pending) {
  const files = git('show', '--stat', '--format=', c.sha).trim();

  const body = [
    `Upstream commit, filed automatically for a decision. **No action is implied.**`,
    ``,
    `| | |`,
    `|---|---|`,
    `| Commit | [\`${c.short}\`](https://github.com/${UPSTREAM_SLUG}/commit/${c.sha}) |`,
    `| Subject | ${c.subject} |`,
    `| Author | ${c.author} |`,
    `| Date | ${c.date.slice(0, 10)} |`,
    ``,
    `<details><summary>Files touched</summary>`,
    ``,
    '```',
    files,
    '```',
    ``,
    `</details>`,
    ``,
    `## The decision`,
    ``,
    `- [ ] **Adopt** — port it here, on our terms, with our tests`,
    `- [ ] **Decline** — close as \`not planned\`, with the reason in a comment`,
    ``,
    `Spotlight Tools is a separate tool suite as of the fork and is not kept aligned with`,
    `upstream. Most of these should be declined; that is the system working, not a backlog`,
    `going stale. The reason for declining is the valuable part, because it is what tells`,
    `somebody later why the two builds differ.`,
  ].join('\n');

  const created = await (async () => {
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: `Upstream ${c.short}: ${c.subject}`, body, labels: [LABEL] }),
    });
    if (!res.ok) throw new Error(`Failed to create issue for ${c.short}: ${res.status} ${await res.text()}`);
    return res.json();
  })();

  console.log(`filed #${created.number}  ${c.short}  ${c.subject}`);
}
