# SuperTutors

> A lesson-server platform for kid-facing AI tutors, and the monorepo that hosts three workstreams: one shipped lesson (proof of capability) and two long-term opportunities.

**Live:** [supertutors.vercel.app](https://supertutors.vercel.app)

## The three workstreams

At the root you see what's being built toward. Each workstream is a self-contained planning folder; the SuperTutors app in `src/` is the platform that demos them.

| Workstream | Status | Card on landing | Folder |
|---|---|---|---|
| **Freddy Fractions** | Shipped — fully built lesson | [`/lessons/freddy-fractions`](https://supertutors.vercel.app/lessons/freddy-fractions) | [`Freddy-Fractions/`](./Freddy-Fractions/) |
| **Acutis Institute** | Long-term platform vision (brainlift + research) | [`/lessons/acutis`](https://supertutors.vercel.app/lessons/acutis) (Coming Soon) | [`Acutis-Institute/`](./Acutis-Institute/) |
| **ASL ComputerVision** | Long-term lesson (research + scoping) | [`/lessons/asl`](https://supertutors.vercel.app/lessons/asl) (Coming Soon) | [`ASL-ComputerVision/`](./ASL-ComputerVision/) |

Each workstream folder holds its own PRD / brainlift / references / journals. The SuperTutors app references them; nothing is duplicated.

## Repo layout

```
SuperTutors/                       ← monorepo: lesson server + three workstreams
├── README.md                       ← (this file)
│
├── Freddy-Fractions/              ← Workstream #1 — shipped
│   ├── README.md, PRD.md, TASKS.md
│   └── References/, deliverables/, assets/, journals/
│
├── Acutis-Institute/              ← Workstream #2 — long-term platform vision
│   ├── README.md
│   ├── Acutis-Institute_Brainlift.md
│   └── References/, Logs/, Assets/
│
├── ASL-ComputerVision/            ← Workstream #3 — long-term lesson
│   ├── README.md
│   └── References/
│
├── src/                           ← code (the lesson server + lesson modules)
│   ├── platform/                   ← the server: registry, SDK, host, shared primitives
│   │   ├── registry.ts             ← the one list of all lessons
│   │   ├── lesson-sdk.ts           ← the contract every lesson conforms to
│   │   ├── LessonHost.tsx          ← loads + mounts a lesson by slug
│   │   ├── audio/, cv/, stores/, landing/, ui/, previews/
│   ├── lessons/                    ← three lesson modules (slugs)
│   │   ├── freddy-fractions/       ← full lesson code
│   │   ├── acutis/                 ← stub (ComingSoonMount)
│   │   └── asl/                    ← stub (ComingSoonMount)
│   ├── components/, lib/, styles/, App.tsx, main.tsx
│
├── public/                        ← runtime assets per lesson slug
│   ├── superbuilders-logo.png
│   └── lessons/
│       ├── freddy-fractions/       ← images + 72 audio MP3s
│       ├── acutis/, asl/           ← placeholders
│
├── docs/                          ← cross-project architectural docs
│   ├── ARCHITECTURE.md             ← the lesson-server pattern explained
│   └── ADDING_A_LESSON.md          ← how to add a fourth lesson
│
├── api/                           ← cross-lesson voice proxy (ElevenLabs)
├── e2e/                           ← Playwright tests
├── scripts/                       ← generate-voice.ts (walks the registry)
├── Logs/                          ← cross-project chat logs
└── (config: package.json, vite.config.ts, tailwind.config.js, eslint.config.js, etc.)
```

**Three workstreams at root, three slugs in `src/lessons/`, three slugs in `public/lessons/`.** The naming asymmetry is intentional: root folders match the original GitHub/GitLab repo names (workstream identity), code slugs are URL-safe (`freddy-fractions`, `acutis`, `asl`) and double as registry IDs + route params.

## The contract (the one type that holds it all together)

```ts
// src/platform/lesson-sdk.ts
export interface LessonModule {
  slug: string;
  meta: { title; tutorName; subject; audience; estimatedMinutes };
  load: () => Promise<{
    Mount: React.ComponentType<LessonMountProps>;
    audio?: { basePath; lineLookup; voiceId? };
    requires?: { camera?; microphone? };
  }>;
}
```

The platform handles routing (`/lessons/:slug`), audio setup, camera state, mute persistence, and the registry-driven landing UI. Your lesson is the `Mount` component. Full architecture writeup in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Setup

```bash
npm install
npm run dev                 # local dev server
npm run build               # production build
npm test                    # vitest unit tests
npm run test:e2e            # Playwright e2e tests
npm run generate-voice      # walks registry, builds MP3s for every lesson with dialogue.json
```

Voice generation requires `ELEVENLABS_API_KEY` in `.env.local` (`vercel env pull .env.local`).

## What lives where

| Looking for… | Find it at… |
|---|---|
| Add a new lesson | [`docs/ADDING_A_LESSON.md`](./docs/ADDING_A_LESSON.md) |
| How the platform works | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| Freddy's PRD / tasks / journals | [`Freddy-Fractions/`](./Freddy-Fractions/) |
| Acutis Institute brainlift + strategy | [`Acutis-Institute/`](./Acutis-Institute/) |
| ASL ComputerVision research | [`ASL-ComputerVision/`](./ASL-ComputerVision/) |
| Cross-project chat logs | [`Logs/`](./Logs/) |

## CV mode (BEMO-style physical interaction)

Freddy supports an opt-in hand-tracking mode powered by [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js) running entirely in-browser via WebAssembly. No server, no installs, no frames leaving the device.

- [Freddy with CV mode](https://supertutors.vercel.app/lessons/freddy-fractions?skip=true&cv=true) — pinch + drag to slice
- [CV preview](https://supertutors.vercel.app/preview/cv) — live hand-landmark debug view

CV primitives (`HandTracker`, `PinchRecognizer`, `usePointerFromHand`) live in `src/platform/cv/` so any lesson can declare `requires: { camera: true }` and receive a `CvCameraHandle` via `props.platform.cv`. ASL ComputerVision will be the second consumer.

## Status

- **Freddy Fractions:** shipped, deployed, demo-ready
- **Acutis Institute & ASL ComputerVision:** registered as `ComingSoonMount` stubs proving the multi-lesson architecture; full lesson content is the next milestone for each workstream
