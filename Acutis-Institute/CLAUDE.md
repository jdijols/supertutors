# Acutis Institute — Project Conventions

This workspace is the durable seed of the **Acutis Institute** learning
platform. Treat every decision committed here — research, Brainlifts,
strategy docs, references — as canonical business logic that will
inform the eventual product, marketing, and curriculum. It is *not*
scratch planning space.

Global conventions in `~/.claude/CLAUDE.md` apply; this file adds
project-specific context.

## Current focus: Brainlift artifacts

The repo's headline artifact is the **Brainlift** — the canonical
Alpha School / Trilogy / Superbuilders proof-of-domain-expertise
document. The template lives at [Brainlift-Template.md](Brainlift-Template.md)
and is calibrated to the Superbuilders / Gauntlet AI / Alpha School
hiring bar.

Key structural rules (full details in the template):
- 5 SPOVs, 5 Insights, 5 Experts, 25–40 KT citations across 3–5 categories
- Every SPOV traces to ≥2 Insights; every Insight traces to ≥2 KT nodes
- Living document — update weekly; monthly, try to kill one SPOV
- **Empty beats fake.** No fabricated experts, no undefendable citations
- Voice: insider ("we"), not third-party observer

Canonical voices the hiring bar expects to see somewhere in
Experts or Knowledge Tree: Joe Liemandt, Mackenzie Price, Wes Kao,
Norman Webb, Ethan Mollick, Austin Scholar. Missing any of these
is a tell.

Canonical learning-science citations (≥3 expected): Bloom (2-Sigma),
Hattie (formative feedback), Sweller (Cognitive Load), Deci & Ryan
(Self-Determination), Vygotsky (ZPD).

## Reference material

- `References/Math-Academy/` — MathAcademy course catalog, AI/pedagogy notes
- `References/Gemini-Chats/` — exploratory chat transcripts
- `Logs/` — chronologically-named session logs (use `/log-chat` to add)

## gstack

The full gstack skill catalog and the browser rule (`/browse` instead
of `mcp__claude-in-chrome__*`) is in `~/.claude/CLAUDE.md`. Especially
relevant here:

- `/office-hours` before committing to any new Acutis sub-product
- `/plan-ceo-review` to stress-test Brainlift SPOVs and scope
- `/make-pdf` to export Brainlifts as polished deliverables
- `/log-chat` to preserve session reasoning into `Logs/`
- `/context-save` + `/context-restore` across long research sessions

## Plugins installed at user scope

Both available across all projects, no project-level setup needed:

- **compound-engineering** (Every.io) — `/ce-strategy`, `/ce-ideate`, `/ce-brainstorm`, `/ce-plan`, `/ce-work`, `/ce-code-review`, `/ce-compound` and 30+ more
- **superpowers** (obra) — TDD, systematic debugging, parallel-agent dispatch, plan writing, code review
