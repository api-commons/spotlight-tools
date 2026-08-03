# Security Policy

This project exists because a supply-chain report went unanswered. A security policy that does not work would be a poor way to start.

## Reporting a vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it privately, either way:

- [**GitHub private vulnerability reporting**](https://github.com/api-commons/spotlight-tools/security/advisories/new) — the "Report a vulnerability" button under the repository's **Security** tab. This is the preferred route, because it gives us a private thread, a draft advisory and a CVE request in one place.
- **info@apicommons.org** — if you would rather not use GitHub, or the report concerns the maintainer.

Include what you have. A rough reproduction is worth more than a polished writeup that arrives a week later.

## What you can expect

| | Commitment |
|---|---|
| Acknowledgement | Within **5 business days** |
| Initial assessment | Within **10 business days** of acknowledgement |
| Fix or a stated plan | Communicated with the assessment, with a timeline attached |
| Credit | In the release notes, unless you would rather stay anonymous |

**These windows are deliberately conservative, and they are set by what one maintainer can actually meet.** A project founded on the argument that an unanswered report is a real failure does not get to miss its own published SLA. If the project grows enough maintainers to tighten them, they will be tightened here in a commit you can see.

If you have not heard anything within the acknowledgement window, escalate by opening a public issue that says only that you sent a private report and got no reply — no details. That is a legitimate thing to do and it will not be held against you.

## Supported versions

| Version | Supported |
|---|---|
| `6.16.x` | Yes — the current line, copied from upstream `v6.16.2` |
| `< 6.16` | No |

Nothing has been published to npm from this repository yet; see [#8](https://github.com/api-commons/spotlight-tools/issues/8) for the package-scope decision that gates the first release. Until then, "supported" means fixes land on `main`.

## Scope

In scope: the packages in this repository, the `spectral` CLI as built here, the Docker image, and the release workflow.

Out of scope: vulnerabilities in `stoplightio/spectral` that are not present in this build — report those [upstream](https://github.com/stoplightio/spectral/security). If a report applies to both, please tell us, and tell them; we will coordinate rather than race.

## Coordinated disclosure

We ask for the normal courtesy: give us a chance to ship a fix before publishing. We will agree a disclosure date with you rather than impose one, we will not ask you to stay quiet indefinitely, and if we go silent or miss the dates above, you are free to publish. That last sentence is the point of the whole policy.

## Dependencies

Dependabot security updates, secret scanning and push protection are enabled on this repository. The inherited dependency tree is old and is being audited — see [#15](https://github.com/api-commons/spotlight-tools/issues/15).

## A note on the address that used to be here

Until August 2026 the only security contact in this repository was in `CONTRIBUTING.md`, and it was `security@stoplight.io` — inherited with the fork. Anyone who found a vulnerability in *this* build and followed the instructions would have reported it to a company that does not maintain this code. That has been corrected everywhere it appeared.
