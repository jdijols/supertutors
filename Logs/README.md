# Logs

Chronological record of meaningful Claude Code sessions in this repo.
One log = one session's worth of decisions, prompts that steered the
work, files touched, and open threads.

## How entries get here

Run `/log-chat` at the end of a session. The skill reads the full
transcript, extracts what mattered (decisions, pivots, important user
prompts, files changed), and writes a progressive-disclosure markdown
file here — TL;DR at the top, full detail below.

## Naming convention

`{MMM-DD-HHMM}-{descriptive-slug}.md`

Timestamps are **Central time (Austin, TX)**. Slugs are concrete and
specific — `May-24-2330-skill-framework-reorganization.md` beats
`May-24-2330-session.md`.

## What goes here vs. elsewhere

**All new session logs land in this folder**, regardless of which
workstream the session touched. One chronological stream is easier to
search than per-workstream silos.

Older per-workstream archives — kept for history, not added to:
- [`../Acutis-Institute/Logs/`](../Acutis-Institute/Logs/) — historical Acutis research sessions
- [`../Freddy-Fractions/journals/`](../Freddy-Fractions/journals/) — Freddy build journal (May 19–22)

For *planning artifacts* (PRDs, TASKS, ARCHITECTURE), see each
workstream's folder and [`../docs/`](../docs/). Logs capture the
*conversation* that produced or revised those artifacts; the artifacts
themselves live with their workstream.

## Reading old logs

The TL;DR at the top of each file is the fast scan. Drill down for full
context — every log includes critical decisions, files modified, and
the user prompts that steered the session, so you can reconstruct the
"why" behind any change.
