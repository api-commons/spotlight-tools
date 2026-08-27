# Spotlight Tools

**A maintained, openly-governed build of the [Spectral](https://github.com/stoplightio/spectral)
linter — the reference implementation of the
[Spectral ruleset specification](https://github.com/api-commons/spotlight-spec).**

> **On the name.** The project is **Spotlight**; the repositories are `spotlight-tools` and
> [`spotlight-spec`](https://github.com/api-commons/spotlight-spec). The _ruleset format_ is still
> the Spectral ruleset format and is described that way throughout, because that is what your
> rulesets are. The rename happened on day two rather than being left open, because asking people
> to adopt a new scope and a new issue tracker under somebody else's name builds a mess into the
> foundation, and renaming after adoption is far more expensive than renaming before it. **The
> `spectral` binary name is not changing** — see [Install and use](#install-and-use).

This is a copy of `stoplightio/spectral` at **v6.16.2** (upstream `develop`, 2026-07-24), with
full commit history preserved. It is a _copy_, not a GitHub fork, for one practical reason:
**GitHub forks cannot have their own Issues.** People need somewhere to report problems and be
answered, and that is the whole point of this effort.

An upstream-tracking fork is kept at
[api-commons/spectral](https://github.com/api-commons/spectral) so the lineage stays visible and
changes can be pulled in cleanly.

---

## Why this exists

Spectral's ruleset format has become the de-facto way organizations express machine-readable API
governance rules. National governments have written their mandatory API design rules as Spectral
rulesets. Large enterprises embed the engine inside their internal validation platforms. Dozens of
published rulesets, wrappers, adapters, editor plugins, and CI integrations depend on it.

The tool those rules depend on stopped moving. Issue triage fell from a peak of 157 issues closed
in 2021 to 12 in 2025 and 10 so far in 2026. There are 241 open issues and 39 open pull requests,
the oldest community PR filed five years ago. Releases went fourteen months between v6.15.0 and
v6.16.1. In July 2026 a supply-chain compromise reached Spectral through a ruleset dependency; the
issue reporting it is still open, and the one follow-up question on it was never answered by a
maintainer. On 2026-06-30, install-time telemetry was added across the packages.

Because the specification and the tool were never separated, **an unmaintained tool means an
unmaintained format.** That is the actual problem, and it is why this repository has a sibling.

- **The rules** — [api-commons/spotlight-spec](https://github.com/api-commons/spotlight-spec) —
  the ruleset format as a standalone, independently versioned specification with a portable JSON
  Schema. Rules should outlive any linter that runs them.
- **The tool** — this repository — the reference implementation, kept aligned with the spec.

## What is different from upstream

- **No telemetry, and it is checked rather than promised.** The Scarf install-time analytics added
  upstream on 2026-06-30 are removed from `cli`, `core`, `rulesets`, `formats`, `functions`, and the
  Docker image. Nothing phones home — and `yarn lint.no-telemetry` fails the build if any package
  here reacquires an install-time hook, so this is a property of every release rather than a claim
  about one commit. See [the no-telemetry policy](#no-telemetry) below.
- **Issues are open, and answered.** See below.
- **Compatibility is the contract.** This build starts from the exact ruleset format and the exact
  CLI behavior of Spectral as of v6.16.2. Existing rulesets keep working. Any future divergence
  will be deliberate, versioned, and documented — never silent.

Everything else — the rules, the functions, the formatters, the CLI surface — is unchanged. This
is a starting point, not a rewrite.

### No telemetry

A versioned policy, not a preference. An API governance tool sits inside the pipeline that inspects
an organization's API surface, and a phone-home from that position is not the same as a phone-home
from a colour-picker library. It also creates a governance problem that cannot be argued away: a
maintainer with something to sell who is also collecting usage data has a sales list, whatever the
stated intent was.

So, for every release of every package in this repository:

- **No install-time analytics.** No package declares `preinstall`, `install`, `postinstall` or
  `prepublish`. This is enforced by `scripts/check-no-telemetry.mjs`, which runs in CI on every pull
  request and fails the build.
- **No run-time analytics**, and no undisclosed network calls of any kind from the CLI.
- **Any network access the tool does make is user-initiated, documented, and disableable.** Resolving
  a remote `$ref` or fetching a remote ruleset is a feature. The line is disclosure and intent — you
  asked for it, it is documented, and you can turn it off — not whether a socket is ever opened.

**The dependency tree is part of the claim.** A removed hook here means nothing if something we
depend on ships one, so the same scan runs across the installed tree:

```
yarn lint.no-telemetry --deps
```

At the time of writing that scan reads **1,762 installed packages** and finds **two** that run code
at install time — `@swc/core` (a root development dependency, fetching its native binary) and
`es5-ext` (reached only through `json-schema-to-typescript`, a build-time tool). **Neither is in the
dependency path of anyone installing the CLI.** That number is published so you can re-run it and
disagree with it, which is the point: this claim should be checkable by the people who need it to be
true, rather than taken on trust from a maintainer.

## Where things go

| What                                                      | Where                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Problems with the CLI or engine**                       | [spotlight-tools/issues](https://github.com/api-commons/spotlight-tools/issues) |
| **Problems with the ruleset format or spec**              | [spotlight-spec/issues](https://github.com/api-commons/spotlight-spec/issues)   |
| **Direction, governance, naming, where this should live** | [the discussion thread](https://github.com/orgs/api-commons/discussions/28)     |

If you depend on Spectral and want this to keep moving, **say so in the discussion.** Knowing who
relies on it is what makes the case for a real, permanent home.

## Install and use

Unchanged from upstream while API Commons packages are prepared for publication:

```bash
npm install -g @stoplight/spectral-cli

spectral lint petstore.yaml
```

Published API Commons packages will be announced in the discussion thread and on
[spotlight-rules.com](https://spotlight-rules.com). Per-package documentation lives in
[`packages/cli/README.md`](packages/cli/README.md).

## Where this is going

**Multi-specification support is the point.** The format is a general-purpose JSON/YAML rules
language that happened to be born in an OpenAPI tool — people already lint far more than OpenAPI
with it. Targets: OpenAPI 3.x, **Swagger 2.0** (restored), AsyncAPI, Arazzo, Overlays, JSON
Schema, GeoJSON, OData, GraphQL, A2A agent cards, MCP, JSON-LD, APIs.json, and Markdown.

**Multi-engine support matters too.** This CLI is JavaScript and stays JavaScript — browser
support is a hard requirement for real users, and a compiled binary cannot serve them. That is not
an argument against [vacuum](https://github.com/daveshanley/vacuum); vacuum is a supported, valued
implementation, and a shared specification with a public conformance suite is exactly what lets
several engines coexist honestly instead of drifting apart. The same holds for expressing policy
in other engines — Open Policy Agent, Cedar — where a documented rules format is the interchange
layer.

## Credit

Spectral was built by [Stoplight](https://stoplight.io) and its contributors over many years, and
grew out of [Speccy](https://github.com/wework/speccy). This build exists because that work
deserves to keep going. It carries the original Apache-2.0 license and the full commit history,
unchanged.

SmartBear was asked publicly, in
[January 2025](https://apievangelist.com/2025/01/31/please-put-spectral-into-the-openapi-initiative-smartbear/),
to donate Spectral to the OpenAPI Initiative. That invitation still stands, and it remains the
best possible outcome.

## License

[Apache License 2.0](LICENSE) — unchanged from upstream.

---

Stewarded by [API Commons](https://apicommons.org). The home is deliberately provisional — see
[the discussion](https://github.com/orgs/api-commons/discussions/28).

## Part of API Commons

A browser-first tool from **[API Commons](https://apicommons.org)** — everything runs locally in your browser, so your tokens and data never leave it. See every tool at **[apicommons.org/tools](https://apicommons.org/tools/)** and the machine-readable building blocks at **[apicommons.org](https://apicommons.org)**.

**Related tools**

- [API Validator](https://validator.apicommons.org) — governance linting for OpenAPI, AsyncAPI, Arazzo and JSON Schema
- [Ruleset Commons](https://rulesets.apicommons.org) — a registry of adoptable, provenanced rulesets
- [Spectral Ruleset Studio](https://studio.apicommons.org) — turn a prose style guide into an owned ruleset
