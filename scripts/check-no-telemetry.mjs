#!/usr/bin/env node
/**
 * "We removed the telemetry" is a statement about one commit. This script is what makes
 * it a statement about every release.
 *
 * The install-time analytics added upstream on 2026-06-30 are not in this build. Nothing
 * stopped them coming back — not a dependency bump, not a merge, not a well-meant
 * contribution. An API governance tool sits inside the pipeline that inspects an
 * organization's API surface; a phone-home from that position is not the same as a
 * phone-home from a colour-picker library, and it lands differently in a security review.
 *
 * Two checks, deliberately separated, in the shape of check-documentation-urls.mjs:
 *
 *   1. FIRST-PARTY (offline, always runs, FAILS the build) — no package in this
 *      repository may declare an install-time lifecycle hook. These are the hooks npm and
 *      yarn execute on a consumer's machine at install time, which is what made the
 *      upstream change work at all.
 *
 *   2. DEPENDENCIES (offline, opt-in via --deps, REPORTS) — the same scan across the
 *      installed dependency tree. A removed hook in this repository means nothing if
 *      something we depend on ships one. This does not fail the build, because the answer
 *      to a transitive hook is a judgement about that dependency, not a red X on somebody's
 *      pull request. It is published so the audit can be re-run by anyone, which is the
 *      point: the claim should be checkable by the people who need it to be true, not
 *      taken on trust from a maintainer.
 *
 * Usage:
 *   node scripts/check-no-telemetry.mjs           # first-party only, gates CI
 *   node scripts/check-no-telemetry.mjs --deps    # also report hooks in the dependency tree
 *
 * Scope note: this checks install-time hooks, not network access. Remote $ref resolution
 * and remote ruleset fetching are features — user-initiated, documented, disableable. The
 * line is disclosure and intent, not whether a socket is ever opened.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The hooks a package manager runs on the consumer's machine when they install. This is
// the exact surface the upstream analytics used, and no package here may declare one.
const INSTALL_HOOKS = ['preinstall', 'install', 'postinstall', 'prepublish'];

// The subset that actually executes when a *dependency* is installed. `prepublish` is
// deliberately not in this list: npm has not run it for installed dependencies since
// npm 5, so scanning the tree for it produces hundreds of hits that are not a risk to
// anyone — the noise would bury the three that matter. It stays blocked first-party
// because forbidding it there costs nothing.
const DEPENDENCY_HOOKS = ['preinstall', 'install', 'postinstall'];

// `prepare` is not on that list on purpose. It runs for the person developing this
// repository and for anyone installing it as a git dependency, but not for someone
// installing a published tarball from a registry. It is reported, never failed on — the
// root package uses it for husky.
const REPORTED_ONLY = ['prepare'];

const checkDeps = process.argv.includes('--deps');

function readManifest(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function hooksIn(manifest, hooks = INSTALL_HOOKS) {
  const scripts = manifest?.scripts ?? {};
  return {
    blocking: hooks.filter(h => typeof scripts[h] === 'string'),
    reported: REPORTED_ONLY.filter(h => typeof scripts[h] === 'string'),
  };
}

/* ---------------------------------------------------------------- first party */

const firstParty = [join(ROOT, 'package.json')];
const packagesDir = join(ROOT, 'packages');
if (existsSync(packagesDir)) {
  for (const entry of readdirSync(packagesDir)) {
    const manifest = join(packagesDir, entry, 'package.json');
    if (existsSync(manifest)) firstParty.push(manifest);
  }
}

const failures = [];
const reported = [];

for (const path of firstParty) {
  const manifest = readManifest(path);
  if (manifest === null) {
    failures.push(`${relative(ROOT, path)} — could not be parsed`);
    continue;
  }
  const { blocking, reported: soft } = hooksIn(manifest);
  for (const hook of blocking) {
    failures.push(`${relative(ROOT, path)} — declares "${hook}": ${JSON.stringify(manifest.scripts[hook])}`);
  }
  for (const hook of soft) {
    reported.push(`${relative(ROOT, path)} — declares "${hook}": ${JSON.stringify(manifest.scripts[hook])}`);
  }
}

console.log(`Scanned ${firstParty.length} first-party package manifests for install-time hooks.`);

if (reported.length > 0) {
  console.log('\nDevelopment-time hooks (allowed, listed so they are never a surprise):');
  for (const line of reported) console.log(`  ${line}`);
}

/* ---------------------------------------------------------------- dependencies */

if (checkDeps) {
  const modules = join(ROOT, 'node_modules');
  if (!existsSync(modules)) {
    console.log('\n--deps was passed but node_modules is not present. Install first.');
  } else {
    const found = [];
    let scanned = 0;

    // One level into node_modules, plus scopes. Deep enough to cover what is actually
    // installed with a node-modules linker, and it does not need to be exhaustive to be
    // useful — it needs to be re-runnable.
    const walk = dir => {
      let entries;
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry === '.bin' || entry === '.cache') continue;
        const path = join(dir, entry);
        if (entry.startsWith('@')) {
          walk(path);
          continue;
        }
        const manifest = join(path, 'package.json');
        if (!existsSync(manifest)) continue;
        scanned++;
        const parsed = readManifest(manifest);
        const { blocking } = hooksIn(parsed, DEPENDENCY_HOOKS);
        if (blocking.length > 0) {
          const name = parsed.name ?? relative(modules, path);
          const version = parsed.version ?? '?';
          // The same package is installed at several depths. Report it once.
          const key = `${name}@${version}`;
          if (!found.some(dep => dep.key === key)) {
            found.push({ key, name, version, hooks: blocking.map(h => `${h}: ${parsed.scripts[h]}`) });
          }
        }
        const nested = join(path, 'node_modules');
        if (existsSync(nested) && statSync(nested).isDirectory()) walk(nested);
      }
    };

    walk(modules);

    console.log(`\nScanned ${scanned} installed packages for ${DEPENDENCY_HOOKS.join(', ')}.`);
    if (found.length === 0) {
      console.log('No dependency declares a hook that runs at install time.');
    } else {
      console.log(
        `${found.length} distinct ${
          found.length === 1 ? 'package declares' : 'packages declare'
        } one. Each is a judgement, not a failure:`,
      );
      for (const dep of found.sort((a, b) => a.name.localeCompare(b.name))) {
        console.log(`  ${dep.name}@${dep.version}`);
        for (const hook of dep.hooks) console.log(`    ${hook}`);
      }
    }
  }
}

/* ---------------------------------------------------------------- verdict */

if (failures.length > 0) {
  console.error('\nInstall-time hooks found in this repository:\n');
  for (const line of failures) console.error(`  ${line}`);
  console.error(
    '\nNo package in this repository may run code on a consumer machine at install time.\n' +
      'If this hook is genuinely necessary, that is a conversation to have in an issue\n' +
      'before it merges — not a check to loosen.',
  );
  process.exit(1);
}

console.log('\nNo install-time hooks in this repository.');
