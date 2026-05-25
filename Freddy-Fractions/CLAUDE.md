# Freddy Fractions — Workstream Conventions

This folder is the **Freddy Fractions** workstream inside the SuperTutors
monorepo — Workstream #1, **shipped**. A conversational AI math tutor
that teaches fraction equivalence (1/2 = 2/4) to 9-year-olds through a
Sicilian-pizza manipulative, with optional CV-driven physical mode
(pinch + drag via webcam).

**Live:** [supertutors.vercel.app/lessons/freddy-fractions](https://supertutors.vercel.app/lessons/freddy-fractions)

Conventions cascade: `~/.claude/CLAUDE.md` (global) →
[`../CLAUDE.md`](../CLAUDE.md) (SuperTutors monorepo) → this file
(Freddy-specific).

## Status: demo-ready, in polish mode

The lesson arc is complete: Onboarding → exploration tour → scripted
"Share the Pizza" lesson → Win. The current focus is iteration on
state-driven transitions, lesson-stage tooling, and the v2 scripted arc
(see recent commits: `freddy-scripted v2 arc`, `default tool = glove`,
`hide AddPizza + DeliveryBox during scripted lesson`).

**Treat this lesson as the canonical reference implementation** of the
SuperTutors lesson-server contract — what other lessons (Acutis, ASL)
will study when they're built. Changes here should be exemplary.

## Where the code + assets live

Planning lives in this folder. Runtime lives alongside the platform:

- **Lesson code:** [`../src/lessons/freddy-fractions/`](../src/lessons/freddy-fractions/)
- **Audio + images:** [`../public/lessons/freddy-fractions/`](../public/lessons/freddy-fractions/) (72 MP3s — never `git add -A`)
- **Registered in:** [`../src/platform/registry.ts`](../src/platform/registry.ts)
- **Shared CV primitives:** [`../src/platform/cv/`](../src/platform/cv/) — `HandTracker`, `PinchRecognizer`, `usePointerFromHand`

The slug `freddy-fractions` is the URL identifier; this folder uses
`Freddy-Fractions` (matching the original repo name convention).

## Reference material in this folder

- [`PRD.md`](./PRD.md) — Product spec: scope, lesson arc, design rationale, visual language
- [`TASKS.md`](./TASKS.md) — Delivery tracker: done / blocking / next
- [`References/`](./References/) — Research that shaped the build (Synthesis Tutor, BEMO, CV-in-education brainlift, Share-the-Cookies lesson, [`Education-via-Computer-Vision.md`](./References/Education-via-Computer-Vision.md))
- [`deliverables/`](./deliverables/) — Submission artifacts: demo-video script, iPad roadmap
- [`assets/`](./assets/) — Brand + character prompts (Midjourney)
- [`journals/`](./journals/) — **Archived** build journal (11 entries May 19–22). New session logs go to [`../Logs/`](../Logs/)

## Operating rules

- **PRD and TASKS are living docs.** When a decision in chat overrides
  an older line, update the file in the same session (`/update-docs`).
- **Audio assets are heavy.** Stage by specific path, never `git add -A`.
- **The CV pipeline must run at 30fps.** When touching `src/platform/cv/`
  or `Pizza.tsx` interactions, profile with the browser dev tools before
  shipping — frame drops are a known regression risk.
- **Voice latency is a UX feature.** ElevenLabs proxy in
  [`../api/`](../api/) is shared across lessons; preserve its contract.
- **Don't break stage transitions.** The v2 scripted arc is state-driven
  (`tableState` is derived from pieces). Tests live in
  `src/lessons/freddy-fractions/__tests__/` — run them before any
  refactor of the stage machine.

## Most-useful skills for this workstream

The full skill catalog is in [`../CLAUDE.md`](../CLAUDE.md). The ones
that come up most when working on Freddy:

- `/qa` or `/qa-only` on the Vercel preview after any lesson change —
  golden path + CV mode + audio paths are easy to regress
- `/design-review` on the live preview for visual polish — designer's eye
- `/ce-frontend-design` before adding new UI to the lesson
- `/diagnose` (Pocock) or `/investigate` (gstack) for stage-transition
  bugs or CV frame-drop hunts — both enforce reproduce-before-fix
- `/tdd` when adding to the stage state machine (existing test coverage
  is the model)
- `/ship` when ready to push — runs tests, bumps VERSION, opens PR
- `/log-chat` at session end → writes to [`../Logs/`](../Logs/)
  (this folder's `journals/` is archived from previous work)
