# SuperTutors Architecture

> SuperTutors is a **lesson server**. The platform provides routing, audio, camera state, and a registry-driven landing UI. Each lesson is a self-contained module that conforms to a small typed contract. Adding the fourth lesson looks exactly like adding the second.

## The mental model

```
SuperTutors (the platform)
├─ knows: how to route /lessons/:slug, how to play audio, how to manage CV, how to render a landing page
└─ doesn't know: anything about a specific lesson's content

Lessons (self-contained modules)
├─ know: their own content, scenes, state machine, audio lines, assets
└─ don't know: about each other, about routing, about how audio is wired
```

The boundary between these two is one TypeScript interface: `LessonModule`.

## The contract

```ts
// src/platform/lesson-sdk.ts

export interface LessonModule {
  slug: string;
  meta: {
    title: string;
    tutorName: string;
    subject: string;
    audience: string;
    estimatedMinutes: number;
  };
  load: () => Promise<{
    Mount: React.ComponentType<LessonMountProps>;
    audio?: {
      basePath: string;
      lineLookup: (key: string) => string | undefined;
      voiceId?: string;
    };
    requires?: { camera?: boolean; microphone?: boolean };
  }>;
}

export interface LessonMountProps {
  name: string;
  onComplete: (r: { outcome: "win" | "exit"; durationMs: number }) => void;
  platform: {
    audio: AudioEngineHandle;
    cv?: CvCameraHandle;
    muted: boolean;
    setMuted: (m: boolean) => void;
  };
}
```

That's the whole API surface. Everything else is implementation detail.

## The flow

```
User visits /lessons/freddy-fractions
   ↓
React Router matches → mounts <LessonHost />
   ↓
LessonHost reads :slug param → getLessonBySlug("freddy-fractions")
   ↓
Calls lesson.load() (this is a dynamic import — Freddy's chunk loads now,
not at app start; Acutis and ASL are not in this bundle)
   ↓
Builds an AudioEngineHandle from the lesson's audio config (basePath + lineLookup + voiceId)
   ↓
If lesson.requires.camera, builds a CvCameraHandle (LessonHost owns enabled state, syncs ?cv= URL)
   ↓
Renders <Mount name={...} onComplete={...} platform={{audio, cv?, muted, setMuted}} />
   ↓
The lesson takes over. It can call platform.audio.play(), read platform.cv.enabled, etc.
```

When the lesson is done, `onComplete({ outcome, durationMs })` returns control to the platform, which navigates back to `/`.

## Monorepo structure

```
SuperTutors/                       ← three workstreams + platform that demos them
├── Freddy-Fractions/              ← workstream #1 — shipped lesson (planning docs)
├── Acutis-Institute/              ← workstream #2 — long-term platform vision (brainlift)
├── ASL-ComputerVision/            ← workstream #3 — long-term lesson (research)
└── src/                           ← the lesson server + lesson modules (code)
```

At root, planning lives in PascalCase folders matching original repo names. In `src/`, code uses URL-safe slugs (`freddy-fractions`, `acutis`, `asl`) that double as registry IDs and route params.

## Code structure

```
src/
├── platform/                      ← the server
│   ├── lesson-sdk.ts              ← LessonModule, LessonMountProps, handles
│   ├── registry.ts                ← Array<LessonModule>, getLessonBySlug
│   ├── LessonHost.tsx             ← /lessons/:slug route component
│   ├── audio/                     ← AudioEngine, nameAudioCache
│   ├── cv/                        ← HandTracker, gestures, usePointerFromHand
│   ├── stores/platformStore.ts    ← name, muted, currentLessonSlug
│   ├── landing/                   ← LandingPage (reads registry)
│   ├── ui/                        ← MuteToggle, ExitButton, ComingSoonMount
│   └── previews/                  ← VoicePreview, CvPreview
└── lessons/
    ├── freddy-fractions/          ← full lesson
    │   ├── index.ts               ← exports the LessonModule
    │   ├── Mount.tsx              ← entry component (was LessonView)
    │   ├── audio-lines.ts         ← key → mp3 filename lookup
    │   ├── audioSingleton.ts      ← lesson-local AudioEngine instance
    │   ├── store/tutorStore.ts    ← Freddy-only state (freddy, guests, spotlight, toolMode)
    │   ├── tutor/                 ← dialogue.json, tutorMachine.ts, stately/
    │   ├── scenes/                ← world/ + table/ (Freddy's restaurant + pizza pieces)
    │   ├── scripted/              ← LessonExploration + LessonScripted (the lesson arc)
    │   ├── previews/              ← PizzaPreview, PizzaInScene, GuestPreview
    │   └── toast/                 ← in-lesson toast UI
    ├── acutis/                    ← stub: index.ts + Mount.tsx (uses ComingSoonMount)
    └── asl/                       ← stub: index.ts + Mount.tsx
```

## Asset namespace

```
public/
├── superbuilders-logo.png         ← global brand asset
└── lessons/
    ├── freddy-fractions/
    │   ├── images/                ← backgrounds, characters, pizza, ui
    │   └── audio/                 ← 72 MP3s + .manifest.json
    ├── acutis/                    ← (audio will land here when authored)
    └── asl/
```

`scripts/generate-voice.ts` walks `src/lessons/*` for `dialogue.json` files and writes MP3s into the matching `public/lessons/<slug>/audio/` directory. Adding audio to a new lesson requires zero script changes.

## Isolation, enforced by lint

`eslint.config.js` adds two `no-restricted-imports` rules:

1. **Platform code must not import from a specific lesson.** The registry is the one allowed coupling point. Trying to `import "@/lessons/freddy-fractions/..."` from anywhere under `src/platform/` is a lint error.
2. **Lessons must not import from other lessons.** If two lessons need the same code, move it into `src/platform/` or duplicate it. Lessons are self-contained by contract.

If those rules pass, the architecture is real, not aspirational.

## State boundary

| State | Lives in | Why |
|---|---|---|
| `name`, `muted`, `currentLessonSlug` | `platformStore` (Zustand) | Cross-lesson; persists across navigation. |
| `cvEnabled` | `LessonHost` local state | Per-lesson session; synced to `?cv=true` URL. Exposed via `platform.cv` when the lesson declares `requires.camera`. |
| Freddy's `freddy`, `guests`, `spotlight`, `toolMode`, `currentBeat` | `tutorStore` (lives under `src/lessons/freddy-fractions/store/`) | Freddy-specific; nothing outside Freddy can see or set this. |
| Acutis / ASL state | Their own future stores under their own folders | When they grow real content. |

## Code splitting

Each lesson's `load()` uses a dynamic `import()`, so:

- The initial bundle contains the platform + router + landing page (~468 kB minified, ~148 kB gzipped).
- Freddy's lesson is its own ~116 kB chunk, loaded only when you navigate to `/lessons/freddy-fractions`.
- Acutis and ASL stubs are ~0.3 kB chunks each.
- `dialogue.json` (~4 kB) is in its own chunk.
- MediaPipe's `vision_bundle` (~135 kB) is loaded only when CV mode is enabled.

Run `npm run build` and inspect `dist/assets/` to verify. Adding a fourth lesson adds one chunk; it doesn't grow the initial bundle.

## Routing

| Route | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Renders cards from the registry |
| `/lessons/:slug` | `LessonHost` | Loads + mounts the lesson |
| `/lesson` | `<Navigate to="/lessons/freddy-fractions" replace />` | Back-compat for the pre-refactor URL |
| `/preview/pizza`, `/preview/scene`, `/preview/guests` | Freddy-internal previews | Visual tests during dev |
| `/preview/voice`, `/preview/cv` | Platform previews | Test the audio + CV primitives in isolation |

## Why this shape

The lesson-server pattern means SuperTutors scales by adding folders, not by editing core code. Every new lesson is a self-contained module the platform discovers through one registry array. The contract is small enough to fit on a postcard, the platform handles the boring parts (routing, audio config, camera state, mute persistence), and ESLint guarantees lessons can't bleed into each other or into the platform itself.

What we explicitly chose **not** to do:

- **npm workspaces / Turborepo** — defer until we have a real reason. In-repo `src/lessons/<slug>/` modules behind a typed registry give us most of the benefit with none of the overhead.
- **Lesson manifest JSON loaded over the wire** — registry is a TS array, statically checkable, no extra fetch.
- **Multi-tenant ElevenLabs key per lesson** — single API key, `voiceId` per lesson is enough.

## See also

- [`docs/ADDING_A_LESSON.md`](./ADDING_A_LESSON.md) — step-by-step recipe for adding a new lesson
- [`README.md`](../README.md) — high-level project overview
- Workstream planning docs at root: [`Freddy-Fractions/`](../Freddy-Fractions/), [`Acutis-Institute/`](../Acutis-Institute/), [`ASL-ComputerVision/`](../ASL-ComputerVision/)
