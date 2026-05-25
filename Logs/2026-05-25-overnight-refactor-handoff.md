# Overnight Handoff: Lesson Server Refactor
**Session:** 2026-05-24 ~11 PM → 2026-05-25 05:18 CDT  
**Branch:** `refactor/lesson-server` (pushed)  
**Status:** COMPLETE — all P0/P1/P2/P3 phases landed

---

## What Was Delivered

The codebase is now a lesson-server platform. Freddy Fractions is a self-contained module in `src/lessons/freddy-fractions/`, loaded through a typed `LessonModule` registry. Two stub lessons (Acutis / ASL) are registered and routable. All existing tests pass.

### Commits landed (newest → oldest)

| Commit | Phase | Summary |
|---|---|---|
| `93ff3c6` | 3.2 | Acutis + ASL stub LessonModules in registry |
| `1b9622e` | 2.4 | voiceId multi-tenancy in voice proxy + name audio cache |
| `7290840` | 3.4 | Registry-driven LandingPage + back-compat redirect e2e |
| `c18c7da` | plan | Plan update |
| `e36fed2` | 3.1+3.3 | LessonHost, router rewire (`/lessons/:slug`), e2e spec updates |
| `7ef33d5` | plan | Plan update |
| `ef02fa9` | 2.x | Freddy lesson module extraction |
| `b494719` | plan | Plan update |
| `d4df775` | 1.x | SDK types, store split, config-driven AudioEngine, platform primitives |

### Gate results (as of final commit)
- **TypeScript:** 0 errors
- **Unit tests:** 349/349 passing (up from 340 at session start)
- **E2E tests:** 39/39 passing (1 skipped — expected)
- **Production build:** clean, 3 lesson chunks code-split correctly

### What code-splitting looks like in the build
```
Mount-t_xbkgV3.js      0.29 kB  ← Acutis stub (lazy)
Mount-DzJtzO3_.js      0.30 kB  ← ASL stub (lazy)
audio-lines-D8DUdsnQ.js  3.99 kB  ← Freddy dialogue lookup (lazy)
Mount-3WP6cju8.js     116.49 kB  ← FreddyMount full lesson (lazy)
index-DJy7pvPK.js     512.66 kB  ← app shell (pre-existing size)
```
Lesson content does not ship in the initial bundle.

---

## Key Architecture (for the Patrick interview)

### Registry pattern
```typescript
// src/platform/registry.ts
export const lessons: LessonModule[] = [
  freddyFractionsLesson,   // slug: "freddy-fractions"
  acutisLesson,            // slug: "acutis"
  aslLesson,               // slug: "asl"
];
```

### LessonModule contract
```typescript
interface LessonModule {
  slug: string;
  meta: { title, tutorName, subject, audience, estimatedMinutes, cover, accent };
  load: () => Promise<{
    Mount: React.ComponentType<LessonMountProps>;
    audio?: { basePath, lineLookup, voiceId? };
    requires?: { camera?, microphone? };
  }>;
}
```

### Routes
- `/` → LandingPage (shows Freddy card + coming-soon buttons for Acutis/ASL)
- `/lessons/freddy-fractions` → LessonHost → FreddyMount
- `/lessons/acutis` → LessonHost → AcutisMount (coming soon card)
- `/lessons/asl` → LessonHost → AslMount (coming soon card)
- `/lesson` → Navigate redirect to `/lessons/freddy-fractions` (back-compat)

### Voice API multi-tenancy
Each lesson can pass its `voiceId` in the `/api/voice` POST body. The proxy uses it (validated: 8–40 alphanumeric chars) over the env fallback. The IndexedDB name cache is keyed by `${voiceId}:${name}` so different tutors don't collide.

---

## Talking Points for Patrick

1. **Platform vs lesson isolation is enforced by the file system.** `src/platform/` never imports from `src/lessons/`. Lessons import only from `src/platform/lesson-sdk` (the typed contract). The router just loads what the registry says — it has no Freddy-specific knowledge.

2. **Adding a new tutor is a single PR.** Create `src/lessons/<slug>/index.ts` (metadata + load function), `Mount.tsx` (implements `LessonMountProps`), add to `registry.ts`. LessonHost, routing, audio, and voice caching all just work.

3. **Code-split by design.** Freddy's lesson state machine, dialogue JSON (72 lines), and assets don't ship to users who haven't opened the lesson. Stub lessons are 0.3 kB.

4. **Voice is multi-tenant.** Each lesson declares its ElevenLabs voice ID in the registry. The `/api/voice` proxy accepts it in the request body and prefers it over the env fallback, so Acutis's Carlo can have a different voice than Freddy — no env var changes needed.

5. **Demo live at `/lessons/freddy-fractions`.** The lesson experience is unchanged for Freddy — all e2e specs pass. The back-compat `/lesson` redirect still works.

---

## Explicitly Dropped (per mission priority order)

- **Phase 2.6** (tailwind namespacing) — not essential for the interview
- **Phase 4** (ESLint isolation rule, bundle visualizer, ADDING_A_LESSON.md)
- **Phase 5** (Vercel preview deploy, voice cache warm-up)

These are all polish / infrastructure hardening items that don't affect the demo.

---

## What's Left to Decide

1. **Land this branch or keep as PR?** Everything's pushed to `origin/refactor/lesson-server`. The main branch is untouched.
2. **Real Acutis/ASL content.** The stubs prove the contract; actual lesson content would come in subsequent PRs.
3. **`/api/voice` voiceId allowlist.** Currently accepts any 8–40 char alphanumeric ID. A stricter allowlist keyed to the registry's declared voiceIds would be a good security hardening step.
