# ASL ComputerVision — Workstream Conventions

This folder is the **ASL ComputerVision** workstream inside the
SuperTutors monorepo — Workstream #3, **research + scoping**. An
American Sign Language tutor concept where Sage (the tutor character)
sees the learner's signs via webcam and guides them through formation,
recognition, and conversational practice.

**Status:** Not yet a built lesson. Currently a `ComingSoonMount` card
on the SuperTutors landing page. The platform-side CV primitives that
this lesson will consume are already shipped (and battle-tested by
Freddy Fractions).

Conventions cascade: `~/.claude/CLAUDE.md` (global) →
[`../CLAUDE.md`](../CLAUDE.md) (SuperTutors monorepo) → this file
(ASL-specific).

## Strategic thesis

ASL is the natural second consumer of the platform's CV primitives.
Where Freddy uses hand tracking as a *manipulative interaction* (pinch
to slice pizza), ASL uses it for *sign recognition* — same MediaPipe
Hands pipeline (21 landmarks @ 30fps), different output layer.

**Why this workstream exists:** to prove the platform's
`requires: { camera: true }` contract generalizes. A lesson declares
camera need and receives `props.platform.cv`; ASL is the test case that
this isn't a Freddy-shaped contract.

## Where the (stub) code lives

- **Stub:** [`../src/lessons/asl/`](../src/lessons/asl/) — `Mount.tsx` (ComingSoonMount), `index.ts` (LessonModule registration)
- **Registered in:** [`../src/platform/registry.ts`](../src/platform/registry.ts)
- **Shared CV primitives (already shipped):** [`../src/platform/cv/`](../src/platform/cv/) — `HandTracker`, `PinchRecognizer`, `usePointerFromHand`
- **Reference consumer (working):** [`../src/lessons/freddy-fractions/`](../src/lessons/freddy-fractions/) — study how Freddy wires `props.platform.cv` before designing ASL's wiring

The slug `asl` is the URL identifier; this folder uses
`ASL-ComputerVision` (matching the original repo name).

## Heritage

Originally standalone at
[github.com/jdijols/asl-computervision](https://github.com/jdijols/asl-computervision)
and
[labs.gauntletai.com/jasondijols/asl-computervision](https://labs.gauntletai.com/jasondijols/asl-computervision).
Absorbed into the SuperTutors monorepo so all three workstreams live in
one place. The remote repos remain as historical archives — don't push
to them.

## Reference material in this folder

- [`References/`](./References/) — Research materials: CV-in-education
  brainlift, computer vision foundations, ASL-LEX 2.0 lexicon,
  WLASL-dataset (Word-Level American Sign Language)

The WLASL and ASL-LEX 2.0 reference folders are *large datasets*, not
docs — never commit them, never load them into context wholesale, and
keep them in `.gitignore` if they aren't already.

## Operating rules

- **No lesson code yet.** Work in this folder is research, scoping, and
  spec drafting until the design is locked in.
- **Sign-recognition ML is the unknown.** MediaPipe Hands gives
  landmarks; classifying them into ASL signs is a model decision that
  hasn't been made. Don't assume it's solved.
- **Latency budget is tight.** The Freddy CV pipeline runs at 30fps with
  zero perceptible lag. Any sign-recognition model must hit that same
  bar or worse-than-pinch UX will kill the lesson.
- **Privacy first.** Webcam → on-device inference, no frames to a
  server unless explicitly designed for it. The voice proxy in
  [`../api/`](../api/) is the only platform-side service today; don't
  add a server-side CV path without explicit design.

## Most-useful skills for this workstream

The full skill catalog is in [`../CLAUDE.md`](../CLAUDE.md). The ones
that come up most when working on ASL:

- `/office-hours` before committing to any specific lesson design —
  this workstream is pre-build, so forcing-question rigor matters most
- `/plan-ceo-review` to stress-test scope (it's tempting to build a
  full ASL course; the wedge needs to be sharper)
- `/ce-brainstorm` and `/ce-ideate` for the lesson concept itself
- `/grill-with-docs` (Pocock) to challenge a draft plan against what
  the platform's CV contract actually supports
- `/browse` for research — ASL pedagogy, sign-recognition prior art,
  Deaf community input channels
- `/prototype` (Pocock) for throwaway sign-recognition spikes before
  committing to a model architecture
- `/log-chat` at session end → writes to [`../Logs/`](../Logs/)
