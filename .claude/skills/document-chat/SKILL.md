---
name: document-chat
description: Summarize the current chat into a structured markdown journal entry saved to the project's Journals/ folder so it can be loaded as context at the start of the next chat. Use when the user says "summarize this chat", "close out this chat", "document this chat", "create a journal entry", "journal this", "make a markdown file of this chat", "journal entry for this chat", or any similar request to capture the session's key findings, decisions, prompts, and next steps.
---

# Document Chat — Journal Entry

When invoked, write a comprehensive journal entry summarizing the current chat session so it can be loaded as context at the start of the next chat. The Next Steps section is the load-bearing one — the next chat will read it first.

## Where the entry goes

- Directory: `Journals/` at the repo root (sibling to `References/`).
- Create the directory if it doesn't exist.
- Do not commit the file — leave that to the user.

## Filename format

`<MMM>-<DD>-<HHMM>-<descriptive-kebab-title>.md`

- `MMM` — three-letter month, capitalized (Jan, Feb, …, Dec)
- `DD` — zero-padded day of month
- `HHMM` — 24-hour local time, zero-padded (e.g. `1430` for 2:30 PM)
- `descriptive-kebab-title` — short, lowercase, hyphenated summary, ~5 words max

Example: `May-19-1430-freddy-positioning-fixes.md`

Get the prefix exactly with:

```bash
date "+%b-%d-%H%M"
```

## H1 title format

The first line of the file is a level-1 heading with a friendly date plus a descriptive title:

`# <Month> <D>, <YYYY> at <H>:<MM> <AM/PM> — <Descriptive title>`

Example: `# May 19, 2026 at 2:30 PM — Freddy positioning fixes`

Get the friendly date portion with:

```bash
date "+%B %-d, %Y at %-I:%M %p"
```

## Required sections

Write these in order. If a section truly has nothing, write `_None_` — don't omit it.

### TL;DR
Two to four sentences: what this chat was about, and what we walked away with.

### Decisions
Bulleted list of choices made and the reasoning. Format each bullet as:
`- **<Decision>** — <why>`

### Key Prompts & Responses
The pivotal moments — user prompts that changed direction, and the responses or findings that shaped the work. Quote verbatim where the exact wording matters. Include 3–8 of these. Pick the ones future-you will need to understand a decision. Format:

```
> **User:** "<exact quote>"
>
> **Outcome:** <what we did or decided as a result>
```

### Files Touched
Every file created, edited, or deleted in this chat, with a one-line note on what changed. Use markdown links so they're clickable:
`- [path/to/file.ts](path/to/file.ts) — <what changed>`

### Open Threads
Things noticed, raised, or left unresolved. Each bullet:
`- **<Topic>** — <current state and what's blocking resolution>`

### Next Steps
An ordered list of concrete next actions for the next chat. Each item should be specific enough that a cold session can pick it up:

```
1. <Action> — <file or location> — <acceptance criteria>
```

## After writing

Confirm to the user with the filename (as a clickable markdown link) and a one-sentence summary of what was captured.
