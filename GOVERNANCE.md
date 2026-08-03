# Governance

**There is one maintainer. That is a weakness, it is stated here in writing rather than dressed up, and the point of this document is what happens because of it.**

Forks lose credibility in month three by claiming more governance than they have. A working group that is one person, a "core team" page with one photograph on it, a voting procedure nobody has ever voted under. This is the honest interim version. It will be replaced as the roster grows, in commits you can read.

The roster itself is [`MAINTAINERS.yaml`](MAINTAINERS.yaml) — data, not prose, so that adding or removing a maintainer is a reviewable pull request.

## What this repository is

`spotlight-tools` is the **reference implementation** of the [Spectral ruleset specification](https://github.com/api-commons/spotlight-spec). The specification governs itself, under [its own model](https://spec.spotlight-rules.com/governance/). This document governs the tool.

That split matters for decisions: a change to what a ruleset *means* is a specification change and belongs upstream of this repository. A change to how this build *behaves* is a tool change and is decided here.

## Stages

Governance here escalates with the number of maintainers, so that the rules are always the ones the project can actually run.

### Stage 0 — one maintainer (current)

- **Lazy consensus.** Proposals sit in a public issue for a stated window. Silence is approval. Anyone may ask for the window to be extended, once, and it will be.
- **Every decision has a public thread.** No decision is made in private mail, DMs, or a call. If a conversation starts somewhere else, its outcome gets written into the issue before it counts.
- **One issue, one pull request.** The pull request that implements an item references that issue and only that issue, so the reasoning behind every change has provenance you can follow from argument to decision to diff.
- **The maintainer can merge their own work.** Under a single maintainer any other rule would be theatre. This is the specific thing that changes at Stage 1, and it is the reason to want Stage 1.

### Stage 1 — two maintainers

Reached the moment a second maintainer is listed in `MAINTAINERS.yaml`.

- **No behaviour-affecting change merges on one person's say-so.** Enforced by the platform through branch protection, not by discipline. This binds the original author identically to everyone else.
- Branch protection gains a required-review rule. Today it does not have one, because with one maintainer it would block all work.

### Stage 2 — three or more maintainers

- Consensus first, with an expedited path for routine and mechanical decisions.
- A floor of three and a cap of seven maintainers.
- **No more than half the maintainers may share an employer**, ideally no more than a third. A fork created because a single vendor's priorities governed a dependency does not get to recreate that.
- A public decision log.

## How to become a maintainer

Do the work, in public, for long enough that the roster is out of date without you. That is the whole test. Reviewing pull requests, triaging issues, writing documentation and arguing carefully in threads all count — this is not measured in commits.

Ask, or be asked, and it happens in a pull request against `MAINTAINERS.yaml` where anyone can object.

## How to stop being a maintainer

Say so. You move to `emeritus` in the same file. Stepping back is normal and is recorded as a fact, not as an absence.

## Escalation

If you have a problem with a decision, open an issue and say so plainly. If your problem is with the maintainer, or with conduct, mail **info@apicommons.org**, or use [private vulnerability reporting](https://github.com/api-commons/spotlight-tools/security/advisories/new) if it needs to stay confidential.

At Stage 0 there is no independent body to appeal to, and pretending otherwise would be worse than admitting it. What there is instead: everything is Apache-2.0, the git history is complete, and the specification is a separate repository under a separate model. **If this project is governed badly, you can fork it, and you will lose nothing but the name.** That is a real check, and at this stage it is the honest one.

## What this project will never do

A short list, because a fork is owed one:

- **No telemetry.** No phone-home, no install-time analytics, no usage beacons. The Scarf telemetry inherited from upstream was stripped in the first API Commons commit, and keeping it out is [tested for](https://github.com/api-commons/spotlight-tools/issues/14).
- **No install scripts.** Nothing executes on `npm install`.
- **No silent divergence.** Behaviour that differs from upstream Spectral gets documented, not discovered.
- **No breaking your rulesets inside a major line.** A ruleset that lints today lints tomorrow on the same major.
- **No commercial tier.** The tool and the specification stay open source, permanently, with no feature held back to create a paid edition. [The reasoning is here](https://spotlight-rules.com/funding/).

## Relationship to upstream

This is a fork of [Spectral](https://github.com/stoplightio/spectral), and the lineage is real and worth stating. This project has [publicly invited](https://apievangelist.com/2025/01/31/please-put-spectral-into-the-openapi-initiative-smartbear/) the donation of Spectral to a neutral foundation, and that invitation still stands. If it happens, the right outcome for this repository is to become redundant.

Upstream owes this project nothing, and no communication here should suggest otherwise.
