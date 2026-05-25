# Freddy Fractions

> **Workstream #1 — shipped.** Conversational AI math tutor that teaches fraction equivalence (1/2 = 2/4) to 9-year-olds through a Sicilian-pizza manipulative.

**Live:** [supertutors.vercel.app/lessons/freddy-fractions](https://supertutors.vercel.app/lessons/freddy-fractions)

**Status:** Demo-ready. Onboarding → exploration tour → scripted "Share the Pizza" lesson → Win, with optional CV physical mode (pinch + drag with your webcam).

## What's in this folder

| File / dir | What |
|---|---|
| [`PRD.md`](./PRD.md) | Product spec: scope, lesson arc, design rationale, visual language |
| [`TASKS.md`](./TASKS.md) | Delivery tracker: what's done, what's blocking, what's next |
| [`References/`](./References/) | Research that shaped the build (Synthesis Tutor, BEMO, CV-in-education brainlift, Share-the-Cookies lesson) |
| [`deliverables/`](./deliverables/) | Submission artifacts: demo-video script, iPad roadmap |
| [`assets/`](./assets/) | Brand + character prompts (Midjourney) |
| [`journals/`](./journals/) | Build journal — daily decisions, pivots, overnight loops (11 entries May 19–22) |

## Where the code lives

Planning lives here. The actual lesson code + assets live alongside the platform:

- **Code:** [`src/lessons/freddy-fractions/`](../src/lessons/freddy-fractions/)
- **Audio + images:** [`public/lessons/freddy-fractions/`](../public/lessons/freddy-fractions/)
- **Registered in:** [`src/platform/registry.ts`](../src/platform/registry.ts)

The slug `freddy-fractions` is the URL identifier; this folder uses `Freddy-Fractions` (matching the original repo name convention) for the planning/design workspace.

## Why this lesson

A Week 4 Gauntlet challenger project (clone Synthesis Tutor) for a portfolio aimed at SuperBuilders. The differentiator: CV-driven physical interaction in the spirit of [BEMO](https://playbemo.com/) — a thesis that hand-tracked manipulatives change math learning qualitatively. See [`References/Education-via-Computer-Vision.md`](./References/Education-via-Computer-Vision.md).
