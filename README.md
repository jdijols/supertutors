# SuperTutors — Freddy Fractions

> A conversational AI math tutor that teaches fraction equivalence to 9-year-olds through a Sicilian-pizza manipulative. Built for the Week 4 Gauntlet challenger project (clone Synthesis Tutor).

**Status:** Build in progress. Onboarding + voice pipeline shipped to production (`supertutors.vercel.app`). Sandbox preview live at `/preview/sandbox` with full slice mechanics + JS-driven tool cursor. Beat 6 (AHA) state-machine wiring awaits Stately authoring.

---

## Project Brief

Build a single, self-contained math lesson on **fraction equivalence (1/2 = 2/4)** for a Grade 3 student, runnable in a browser on iPad. Demo by Friday noon, 2026-05-22.

- **Concept:** Fraction equivalence
- **Audience:** Grade 3, ~9 years old
- **Form factor:** iPad-first web app
- **Architecture:** Pure scripted (deterministic state machine), no LLM

## World

- **Platform:** SuperTutors — a collection of subject-specific AI tutors; this ships the first one. Deploys to `supertutors.vercel.app`.
- **Tutor:** Freddy Fractions — first tutor in the SuperTutors family. Character vibe: **Super Mario meets Jersey Shore** — warm, lovable Italian-American chef energy.
- **Setting:** SuperSlice Pizza — Freddy's pizza shop, where he tutors fractions between (and through) pizza-making
- **Manipulative:** Sicilian-style (square) pizza pieces, sliced with a pizza-cutter wheel

## Documents

- [PRD.md](./PRD.md) — full product requirements, system architecture, state diagrams, defensibility talking points
- `References/` — project brief, design notes, Synthesis competitive analysis (not part of product)

## Tech Stack (locked)

Vite + React + TypeScript · Tailwind CSS · Framer Motion · tsparticles · React Router · XState (tutor brain) · Zustand · Howler.js · ElevenLabs (hybrid TTS) · ChatGPT/gpt-image-1 (raster character + pizza + tool art) · LottieFiles (stretch animation) · Vercel

See PRD §3.10 for rationale per layer.

## Deliverables (Friday noon)

1. Deployed web app on public URL
2. iPad roadmap doc + sketches
3. 3–5 min demo video
4. README (this file) with technical decisions

---

*Planning notes: see PRD.md for full system architecture, intent map convention, and defensibility talking points.*
