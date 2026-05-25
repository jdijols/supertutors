# Adding a Lesson

SuperTutors is a lesson-server platform. Each lesson is a self-contained
module under `src/lessons/<slug>/`, exposed to the platform through a
typed `LessonModule` contract and registered in `src/platform/registry.ts`.

This guide walks you from zero to a routable, audio-capable lesson in
the time it takes to brew coffee.

---

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

The platform handles routing (`/lessons/:slug`), audio engine setup,
camera state, mute persistence, and registry-driven landing UI. Your
lesson is the `Mount` component.

---

## Minimal lesson (the Acutis stub as the template)

The cleanest example is `src/lessons/acutis/` — three files, no audio,
no camera. Copy it whenever you start a new lesson.

```
src/lessons/<your-slug>/
  index.ts        # The LessonModule
  Mount.tsx       # Entry component
```

### `src/lessons/<your-slug>/index.ts`

```ts
import type { LessonModule } from "@/platform/lesson-sdk";

export const myLesson: LessonModule = {
  slug: "my-slug",
  meta: {
    title: "My Lesson Title",
    tutorName: "Sam",
    subject: "Geometry",
    audience: "Grade 5",
    estimatedMinutes: 12,
  },
  load: async () => {
    const { MyMount } = await import("./Mount");
    return { Mount: MyMount };
  },
};
```

### `src/lessons/<your-slug>/Mount.tsx`

Quickest path — use the shared `ComingSoonMount` so the lesson is
routable today and you can iterate on real content in a follow-up:

```tsx
import { ComingSoonMount } from "@/platform/ui/ComingSoonMount";
import type { LessonMountProps } from "@/platform/lesson-sdk";

export function MyMount(props: LessonMountProps) {
  return (
    <ComingSoonMount
      {...props}
      tutorName="Sam"
      subject="Geometry"
      tagline="One sentence about the lesson, in the kid's voice."
    />
  );
}
```

### Register it

```ts
// src/platform/registry.ts
import { freddyFractionsLesson } from "@/lessons/freddy-fractions/index";
import { acutisLesson } from "@/lessons/acutis/index";
import { aslLesson } from "@/lessons/asl/index";
import { myLesson } from "@/lessons/my-slug/index"; // ← add

export const lessons: LessonModule[] = [
  freddyFractionsLesson,
  acutisLesson,
  aslLesson,
  myLesson, // ← add
];
```

That's it. `/lessons/my-slug` now routes. The landing page renders a
"Coming Soon" pill for it automatically.

---

## Adding audio

Two pieces: a `dialogue.json` for the script, and an `audio-lines.ts`
for runtime key → file lookup.

### 1. Author the script

```
src/lessons/<your-slug>/
  tutor/
    dialogue.json
```

```json
{
  "voice": { "voiceId": "YOUR_VOICE_ID_FROM_DIALOGUE_JSON" },
  "lines": {
    "intro_1": "Hi {{NAME}}, ready to dive in?",
    "intro_2": "Let's start with a simple shape."
  }
}
```

The `{{NAME}}` placeholder is stitched at runtime via `/api/voice` so
the kid hears their own name. Everything else is pre-generated.

### 2. The line lookup

```ts
// src/lessons/<your-slug>/audio-lines.ts
export function myLineLookup(key: string): string | undefined {
  const map: Record<string, string> = {
    intro_1: "intro_1.mp3",
    intro_2: "intro_2.mp3",
  };
  return map[key];
}
```

### 3. Wire it up in the LessonModule

```ts
load: async () => {
  const { MyMount } = await import("./Mount");
  const { myLineLookup } = await import("./audio-lines");
  return {
    Mount: MyMount,
    audio: {
      basePath: "/lessons/my-slug/audio",
      lineLookup: myLineLookup,
      voiceId: "YOUR_VOICE_ID_FROM_DIALOGUE_JSON",
    },
  };
},
```

### 4. Generate the MP3s

```bash
npm run generate-voice -- --lesson my-slug
```

The script walks `src/lessons/*` looking for `dialogue.json` and writes
MP3s to `public/lessons/<slug>/audio/`. Each lesson gets its own
manifest so re-runs are cheap (only re-generates changed lines).

### 5. Play a line from the Mount

```tsx
import type { LessonMountProps } from "@/platform/lesson-sdk";

export function MyMount({ platform, name }: LessonMountProps) {
  function handleStart() {
    void platform.audio.play("intro_1", { name });
  }
  return <button onClick={handleStart}>Start</button>;
}
```

---

## Requiring a camera

If the lesson uses hand tracking, declare it:

```ts
load: async () => ({
  Mount: MyMount,
  requires: { camera: true },
}),
```

`LessonHost` now plumbs a `CvCameraHandle` into `props.platform.cv`:

```ts
interface CvCameraHandle {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
```

`enabled` is synced to the `?cv=true` URL param by the platform — deep
links work, back-button works, you don't have to think about it. Read
`platform.cv?.enabled` to know when to render your CV overlay. Call
`platform.cv.setEnabled(false)` to turn the camera off (e.g. on error).

Freddy uses this — see `src/lessons/freddy-fractions/scripted/LessonTable.tsx`
for a working example with the `CvToggle` chrome button and the
`CvModeOverlay` that renders the live hand-tracking visualization.

---

## Architectural rules (enforced by ESLint)

- **Platform code must not import from a specific lesson.** The
  registry is the one allowed coupling point. Trying to
  `import "@/lessons/freddy-fractions/..."` from anywhere under
  `src/platform/` is a lint error.
- **Lessons must not import from other lessons.** If two lessons need
  the same code, move it into `src/platform/` or duplicate it. Lessons
  are self-contained by contract.

These are configured in `eslint.config.js` via `no-restricted-imports`
and will fail CI.

---

## Checklist for a new lesson

- [ ] `src/lessons/<slug>/index.ts` exports a `LessonModule`
- [ ] `src/lessons/<slug>/Mount.tsx` exports the Mount component
- [ ] Added to `lessons` array in `src/platform/registry.ts`
- [ ] (Optional) `tutor/dialogue.json` + `audio-lines.ts` for audio
- [ ] (Optional) `requires: { camera: true }` if hand-tracking
- [ ] `npm run generate-voice` if audio added
- [ ] `npm run test:e2e -- e2e/registry.spec.ts` passes (update spec
      if landing surface changes)

---

## Why this shape

The lesson-server pattern means SuperTutors scales by adding folders,
not by editing core code. Every new lesson is a self-contained module
the platform discovers through one registry array. The contract is
small enough to fit on a postcard, the platform handles the boring
parts (routing, audio config, camera state, mute persistence), and
ESLint guarantees lessons can't bleed into each other or into the
platform itself.

Adding the fourth tutor should look exactly like adding the second.
