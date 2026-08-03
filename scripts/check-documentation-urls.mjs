#!/usr/bin/env node
/**
 * Every rule this build emits carries a `documentationUrl`, and the formatters print it.
 * It is the link a user follows when they want to know what a rule means.
 *
 * All three of them were 404s for an unknown length of time, on infrastructure this
 * project does not control, and nothing noticed. This script is what notices.
 *
 * Two checks, deliberately separated:
 *
 *   1. STRUCTURAL (offline, always runs) — every shipped `documentationUrl` must map to a
 *      markdown file that actually exists in `docs/reference/`. Catches a rename or a
 *      moved file at commit time, with no network involved, so it can gate CI safely.
 *
 *   2. REACHABILITY (network, opt-in via --network) — each URL must return 2xx. This is
 *      the check that would have caught the original rot, but it depends on a third party
 *      being up, so it is not something a pull request should fail on. Run it on a
 *      schedule instead.
 *
 * Usage:
 *   node scripts/check-documentation-urls.mjs             # structural only
 *   node scripts/check-documentation-urls.mjs --network   # also verify each URL resolves
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The rulesets this build actually ships. Add a ruleset here when one is added.
const RULESETS = [
  { name: 'oas', source: 'packages/rulesets/src/oas/index.ts' },
  { name: 'asyncapi', source: 'packages/rulesets/src/asyncapi/index.ts' },
  { name: 'arazzo', source: 'packages/rulesets/src/arazzo/index.ts' },
];

// The base every shipped documentationUrl must sit under. If the docs move to a real
// site, change this one line and the structural check follows.
const EXPECTED_BASE = 'https://github.com/api-commons/spotlight-tools/blob/main/docs/reference/';
const LOCAL_DOCS_DIR = 'docs/reference';

const failures = [];
const checked = [];

for (const { name, source } of RULESETS) {
  const path = join(ROOT, source);

  if (!existsSync(path)) {
    failures.push(`${name}: ruleset source not found at ${source}`);
    continue;
  }

  const match = readFileSync(path, 'utf8').match(/documentationUrl:\s*['"]([^'"]+)['"]/);

  if (match === null) {
    failures.push(`${name}: no documentationUrl declared in ${source}`);
    continue;
  }

  const url = match[1];
  checked.push({ name, url });

  if (!url.startsWith(EXPECTED_BASE)) {
    failures.push(`${name}: documentationUrl is not under ${EXPECTED_BASE}\n      got: ${url}`);
    continue;
  }

  // The file the URL promises must exist in this repository.
  const file = url.slice(EXPECTED_BASE.length).split('#')[0];

  if (!existsSync(join(ROOT, LOCAL_DOCS_DIR, file))) {
    failures.push(`${name}: documentationUrl points at ${LOCAL_DOCS_DIR}/${file}, which does not exist`);
  }
}

if (process.argv.includes('--network')) {
  for (const { name, url } of checked) {
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });

      // Some hosts refuse HEAD. Fall back rather than reporting a false failure.
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: 'GET', redirect: 'follow' });
      }

      if (!res.ok) {
        failures.push(`${name}: ${url} returned HTTP ${res.status}`);
      }
    } catch (error) {
      failures.push(`${name}: ${url} could not be fetched — ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation URL check FAILED:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('');
  process.exit(1);
}

console.log(`Documentation URL check passed for ${checked.length} rulesets:`);
for (const { name, url } of checked) console.log(`  ${name.padEnd(9)} ${url}`);
