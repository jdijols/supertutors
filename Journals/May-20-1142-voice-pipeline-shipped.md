# May 20, 2026 at 11:42 AM — Voice pipeline shipped end-to-end

## TL;DR

This chat ran in parallel with a pizza chat. We took the ElevenLabs voice pipeline from scaffold stubs to production-shipped: name-stitched runtime audio, the Edge Function proxy, the IndexedDB cache, the build-time MP3 generation script, wiring into the onboarding bubbles, and a `/preview/voice` QA page. The full P3 column closed out except for the iPad-blocked inspection (P3.8) and Stately-blocked XState wiring (P1.3). Production at https://supertutors.vercel.app now plays Freddy's greeting on the onboarding flow and serves runtime name MP3s from `/api/voice`.

## Decisions

- **Run voice as parallel infrastructure work to the pizza chat** — Confirmed up-front that voice and pizza file sets are disjoint (`src/modules/audio/` + `src/lib/` + `api/` + `scripts/` vs. `src/modules/table/` + `src/modules/preview/`). Only shared surface is `TASKS.md` (different sections) and `src/main.tsx`. Acceptable under main-only workflow.
- **Use Node 25 native TS stripping for `scripts/generate-voice.ts` instead of adding `tsx`** — Verified Node 25 strips types and resolves `.ts` imports natively. Zero new devDeps. Script runs via `node --env-file=.env.local scripts/generate-voice.ts`.
- **Extract validation/business logic from `api/voice.ts` to `src/lib/voiceProxyValidation.ts`** — Vitest only scans `src/`, so logic that lives in `api/` couldn't be unit-tested. Extracting let us cover validation with 14 tests. Same pattern for `scripts/generate-voice.ts` → `src/lib/dialogueSplit.ts` (split logic + 6 tests).
- **DI-first design for `AudioEngine` and `NameAudioCache`** — Both take injectable factories (`createHowl`, `resolveNameUrl`, `cache`, `fetcher`) so Howler and IndexedDB never get touched in tests. `InMemoryNameAudioCache` covers the test side; `IndexedDbNameAudioCache` is the prod path. Lets us hit 23 tests across the audio module without `fake-indexeddb` or Howler mocks.
- **Generation counter pattern in `AudioEngine`** — `stop()` and overlapping `play()` calls bump a counter; stale segments check it before firing `onDone`. Prevents zombie playback from a cancelled sequence calling state setters after a new sequence started. React `StrictMode` double-effect amplified the need.
- **Manifest-based idempotency in `generate-voice.ts`** — `public/audio/.manifest.json` stores sha256(segment text) per MP3 filename. Re-runs skip files whose hash matches. After the first run failed mid-loop and we paid for 4 segments twice, switched to write-after-each-segment instead of write-at-end so partial progress isn't lost.
- **Auto-prune manifest entries** — When a dialogue line is removed from `dialogue.json`, the script now deletes its manifest entry. Prevents indefinite manifest growth and orphan-tracking drift.
- **Collapse the response bubble's two `{name}`s to one `{{NAME}}`** — Original JSX said `"{name}! Beautiful name. Alright {name}, lemme show ya..."` (twice). Our pipeline supports one `{{NAME}}` per line. Rewrote to `"{{NAME}}! Beautiful name. Alright, lemme show ya how this works."` — also reads more naturally as spoken Freddy.
- **`renderLine()` helper as single source of truth** — `src/modules/tutor/dialogue.ts` imports `dialogue.json`, exposes `renderLine(key, { name })`. JSX in `LessonView` and the audio key passed to `AudioEngine` share the same key/text source. Prevents drift between displayed bubble text and the MP3 that plays.
- **Replace the 3000ms fixed bubble dismissal with `audioEngine.onDone`** — Bubble length now exactly matches audio length. No magic number to tune.
- **`api/voice.ts` adds 405/415/control-char rejection beyond the original spec** — Pure cost-free hardening since the validators were getting written anyway.
- **Fix the `[NAME]` vs `{{NAME}}` inconsistency in dialogue.json** — Two lines (`aha_stuck`, `aha_stuck_compare`) used square brackets, splitter only recognized curly. Without fixing, ElevenLabs would have spoken the literal "[NAME]" out loud. Edited both lines, deleted the orphan `aha_stuck.mp3` that had been generated with the bad text.
- **Don't commit pizza chat's work alongside voice** — Voice commits skip `src/main.tsx` (which has uncommitted pizza route additions interleaved with the voice route) and the entire `src/modules/preview/PizzaPreview.tsx` + `PizzaInScene.tsx` + `src/modules/table/*` + `public/images/pizza/`. The `/preview/voice` route registration sits in the working tree until pizza chat next commits `main.tsx`. Cleaner ownership; voice page works in `npm run dev` immediately.
- **Defer P3.7 Playwright smoke test** — Production is manually verified end-to-end (curl + browser walk-through). Automating it needs either `vercel dev` in CI or hitting the live deploy on every push. Higher-value once Beat 6 is wired into XState — running Playwright against `/lesson` then exercises the full state machine + audio path.
- **`/preview/voice` reads dialogue.json dynamically** — Iterates `Object.entries(dialogue.lines)`, groups by key prefix (`onboarding_*`, `aha_*`). New lines auto-appear without manual updates.

## Key Prompts & Responses

> **User:** "The parallel work I think that makes sense here is actually voice. If we can set up the 11 labs integration and some of the timing there, I think that's worth doing. Let me know if that can conflict with any of the other work we're doing... And just as a reminder, I only work in our master main branch."
>
> **Outcome:** Mapped file ownership across both chats — confirmed zero file overlap except `TASKS.md` (separate sections) and `src/main.tsx`. Committed to voice on main-only workflow with careful staging.

> **User:** "Before you do that and are busy, return for me the step-by-step process that I need to do in Vercel."
>
> **Outcome:** Wrote a 6-step Vercel/ElevenLabs setup walkthrough (CLI upgrade → ElevenLabs API key → `vercel env add` for prod/preview/development × 2 vars → `vercel env pull .env.local` → verify). Jason executed it; `vercel env ls` showed all 6 entries.

> **User:** "yea the voice is good for now, we can always replace later if i feel he's being to aggressive. Lets wire up the rest needed so that by the end of our chat here, at least the existing onboarding flow in production site matches the audio to the dialogue bubbles shown on the screen"
>
> **Outcome:** Pivoted from "build infrastructure" to "ship the onboarding flow." Added `onboarding_greeting` + `onboarding_response` to dialogue.json, built `renderLine()`, wired `audioEngine.play()` into `LessonView`, generated 2 new MP3s, browser-tested via Claude Preview, deployed. Verified production with `curl /api/voice` returning 200 + audio/mpeg.

> **User:** "i just upgraded the credit limit for that api key from 100 to 1000. i'm already on a paid plan with enough credits. it was probably just the keys set limit that stopped it. should we rerun?"
>
> **Outcome:** Held the re-run until I'd also fixed the `[NAME]` → `{{NAME}}` typo (would have wasted ~140 credits on broken `aha_stuck_compare` audio). Patched dialogue.json first, deleted the orphan `aha_stuck.mp3`, then re-ran. 11 segments generated cleanly.

> **User:** "Lets pick up the Sandbox Mechanics work in a different chat. You don't have to worry about that here. I just want to make sure that we're dotting all of our I's and crossing one of our T's on the voice implementation infrastructure side."
>
> **Outcome:** Closed scope to voice-only. Built `/preview/voice` QA page, added auto-pruning to `generate-voice.ts`, documented the `vercel dev` vs `npm run dev` gotcha in TASKS.md, marked P3 status comprehensively, deferred non-essential remaining items with explicit rationale.

> **User (failed run):** ElevenLabs returned 401 quota_exceeded — 4 credits remaining, 20 required.
>
> **Outcome:** Surfaced two problems at once: (1) ElevenLabs free-tier quota exhausted, (2) `[NAME]` vs `{{NAME}}` dialogue inconsistency that had quietly cost real credits on a malformed line. Recommended fixing both before any re-run.

## Files Touched

### New (voice work)
- [src/modules/audio/nameAudioCache.ts](src/modules/audio/nameAudioCache.ts) — IndexedDB cache + cache-or-fetch entry point with DI
- [src/modules/audio/nameAudioCache.test.ts](src/modules/audio/nameAudioCache.test.ts) — 7 tests
- [src/modules/audio/AudioEngine.test.ts](src/modules/audio/AudioEngine.test.ts) — 8 tests covering static + name-stitched modes, failure tolerance, stop semantics
- [src/lib/voiceProxyValidation.ts](src/lib/voiceProxyValidation.ts) — name + env validators, ElevenLabs request builder
- [src/lib/voiceProxyValidation.test.ts](src/lib/voiceProxyValidation.test.ts) — 14 tests
- [src/lib/dialogueSplit.ts](src/lib/dialogueSplit.ts) — pure split-at-{{NAME}} logic
- [src/lib/dialogueSplit.test.ts](src/lib/dialogueSplit.test.ts) — 6 tests including edge-position placeholders and multiple-name rejection
- [src/modules/tutor/dialogue.ts](src/modules/tutor/dialogue.ts) — `renderLine()`, `lineHasNameSlot()`, `getLine()`
- [src/modules/tutor/dialogue.test.ts](src/modules/tutor/dialogue.test.ts) — 7 tests
- [src/modules/preview/VoicePreview.tsx](src/modules/preview/VoicePreview.tsx) — QA page at `/preview/voice`
- [.claude/launch.json](.claude/launch.json) — Vite preview server config for Claude Preview tooling
- [public/audio/](public/audio/) — 13 MP3s (2 onboarding + 11 Beat 6 segments) + `.manifest.json`

### Modified
- [src/modules/audio/AudioEngine.ts](src/modules/audio/AudioEngine.ts) — replaced 39-line stub with real Howler-backed sequential playback, generation counter, DI
- [api/voice.ts](api/voice.ts) — thin handler delegating to extracted validators; added 405/415/control-char rejection
- [scripts/generate-voice.ts](scripts/generate-voice.ts) — real ElevenLabs MP3 generation with incremental manifest writes + auto-pruning
- [src/modules/lesson/LessonView.tsx](src/modules/lesson/LessonView.tsx) — both bubbles use `renderLine()` + `audioEngine.play()`; replaced fixed 3000ms timer with `onDone`
- [src/modules/tutor/dialogue.json](src/modules/tutor/dialogue.json) — added `onboarding_greeting` + `onboarding_response`; fixed `[NAME]` → `{{NAME}}` typos in `aha_stuck` + `aha_stuck_compare`
- [package.json](package.json) — `generate-voice` script now runs the real implementation
- [TASKS.md](TASKS.md) — P3 status updates with shipped notes + vercel-dev gotcha doc + voice QA page reference
- [.gitignore](.gitignore) — `.env*.local` (already covered by earlier pattern but harmless)

### Pizza chat's working-tree changes — intentionally NOT committed by this chat
- `src/main.tsx` — pizza's `PizzaPreview` + `PizzaInScene` route additions + my voice route stacked on top, all uncommitted
- `src/modules/preview/PizzaPreview.tsx`, `src/modules/preview/PizzaInScene.tsx`
- `src/modules/table/Pizza.tsx`, `Pizza.test.tsx`, `PizzaPiece.tsx`, `PizzaPiece.test.tsx`, `Table.tsx`, `index.ts`
- `public/images/pizza/` — 15 raster asset PNGs
- `PRD.md` — pizza chat edits
- `src/modules/toast/` — new module from pizza chat

## Open Threads

- **`/preview/voice` route registration lives in uncommitted `src/main.tsx`** — Page is reachable in `npm run dev` immediately. Ships to production whenever pizza chat next commits `main.tsx` (their two routes + mine land together). Acceptable since voice page is a QA tool, not user-facing.
- **`PizzaPiece.test.tsx` failing in the full test suite** — Pizza chat's untracked file has 2 failing tests (`userEvent is not defined`, `onTap not called`). Not voice work; flagged for pizza chat to address. All voice tests (56/56) green.
- **P1.3 — AudioEngine into `tutorMachine` `playDialogue` action** — TODO comment in `src/modules/tutor/tutorMachine.ts:46`. Blocked on PT.3 (Stately Beat 6 authoring, Jason's task). The plumbing on the React/audio side is fully ready; this is just calling `audioEngine.play({ dialogueKey, hasNameSlot, name, onDone: () => send({ type: 'DIALOGUE_DONE' }) })` from the action.
- **P3.8 — iPad inspection** — Blocked on PT.4 (physical iPad), Jason's task, target end-of-day Wednesday 2026-05-20.
- **React StrictMode double-effect against AudioEngine** — Visible in dev: each `useEffect` fires twice, so `play()` runs, gets cancelled by cleanup, runs again. Current generation-counter design handles it correctly (second play's `onDone` fires), but it's inefficient — two network requests for name MP3s in dev. Not a production concern (StrictMode dev-only) but worth eventual cleanup with `useEffect`-level dedupe.
- **Beat numbering renamed mid-chat** — Sprint reordering moved AHA from Beat 5 → Beat 6. Internal dialogue keys (`aha_*`) and the state machine top-level state (`aha:`) intentionally not renamed — the keys are stable filenames, "AHA" is semantically accurate, and renaming would invalidate all 11 generated MP3s + manifest entries for a no-op.
- **Voice may be "too aggressive" later** — Jason noted he may want to swap voice IDs after listening. `/preview/voice` is the A/B test tool. Swap is a one-line change in `dialogue.json` (`voice.voiceId`) + Vercel env var (`ELEVENLABS_VOICE_ID`) + re-run `npm run generate-voice` to regenerate all 13 MP3s under the new voice (manifest will diff and regen everything).

## Next Steps

1. **Pizza chat commits `src/main.tsx`** — Once pizza chat lands its main.tsx changes, the `/preview/voice` route goes live in production. No work needed in voice chat; this happens naturally when pizza chat ships.
2. **Wire `AudioEngine` into `tutorMachine.ts` `playDialogue` action (P1.3)** — `src/modules/tutor/tutorMachine.ts:45-47` — when Jason finishes Stately Beat 6 authoring (PT.3), replace the TODO with `audioEngine.play({ dialogueKey: params.key, hasNameSlot: lineHasNameSlot(params.key), name: context.name ?? undefined, onDone: () => send({ type: 'DIALOGUE_DONE' }) })`. Acceptance: walking through Beat 6 in the browser plays each dialogue line and advances the state machine on `onend`.
3. **iPad inspection (P3.8)** — Once Jason has the iPad (PT.4), navigate to https://supertutors.vercel.app/lesson, enter a name, listen through onboarding. Acceptance: greeting + name-stitched response both play with Freddy's voice; volume + quality acceptable on iPad speakers.
4. **A/B test voices via `/preview/voice`** — Jason listens to all 9 lines, decides whether `QzTKubutNn9TjrB7Xb2Q` stays or swaps. If swap: update `voice.voiceId` in `dialogue.json` + `ELEVENLABS_VOICE_ID` in Vercel env, run `vercel env pull .env.local`, run `npm run generate-voice` (regen all 13 MP3s under the new voice).
5. **Address `PizzaPiece.test.tsx` failures** — In the pizza chat, not here. Currently 2 tests failing: `userEvent is not defined` (missing import) and `fires onTap with the piece id when tapped without drag` (assertion mismatch).
6. **(Optional, low priority) P3.7 Playwright smoke test** — Worth doing once Beat 6 is wired (step 2). Test: navigate to `/lesson`, enter name, advance through bubbles, assert audio elements load with `audio/mpeg` content-type. Use `vercel dev` or run against the live deploy.
