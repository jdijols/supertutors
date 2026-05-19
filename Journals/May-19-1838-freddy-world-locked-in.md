# May 19, 2026 at 6:38 PM — Freddy + world visually locked; XState wiring next

## TL;DR

This chat moved the SuperSlice world from emoji placeholders to a real production-grade visual: 10 ChatGPT-generated Freddy character variations (4 gestures × 2 mouths + 2 facing-guest), a ChatGPT-generated restaurant interior background, and a `RestaurantScene` that composes them with proper counter-occlusion so Freddy stands "behind the bar." Along the way we abandoned Midjourney's Style Creator (couldn't converge on Pixar/Duolingo cartoon style), pivoted to ChatGPT/gpt-image-1 for character + scene art (style continuity within a single thread), expanded the `FreddyCharacter` component with a `gesture` axis (ok/neutral/excited/thinking/pointing), and extended `SpeechBubble` with top-corner tail variants so bubbles can sit below a speaker without conflicting with raised hands. Deployed live at https://supertutors.vercel.app. All 18 unit + 6 e2e tests still green across desktop-chrome and iPad-safari (webkit) at every push.

## Decisions

- **Switched character + scene generation from Midjourney to ChatGPT (gpt-image-1)** — MJ's Style Creator UI (in the current web editor) lacks a "starting style description" text field, and community SREF searches for "Disney"/"Pixar" return zero results (likely IP-suppressed). gpt-image-1 produced a usable Pixar/Duolingo-style Freddy on the first prompt; same thread continuity preserved that style for the restaurant scene.
- **Kept MJ as a fallback for one-off polish pieces** — the CTA hero illustration (P2) can still go through MJ regular Create page if we want; the docs reflect this dual-tool reality.
- **Added a `gesture` axis to `FreddyCharacter`** — `'ok' | 'neutral' | 'pointing' | 'excited' | 'thinking'`. Replaced the prior `expression` prop. Maps directly to asset filenames `{facing-direction}-{gesture}-{mouth}.png`, so the component just resolves a path and renders an `<img>`. Five gestures × two mouths × two facing directions = clean 10-image matrix.
- **Removed the speaking-state idle bob/rotate animation** — Jason called it out as janky on a static cartoon pose. The mouth-state swap (closed → open) is now the only speaking signal. Component renders plain `<div>` instead of `motion.div`.
- **Repositioned Freddy bottom-left, sized to `h-[88vh] md:h-[100vh]`** — full viewport height on iPad so his hat sits near the top edge. Counter in the bg image naturally cuts him off at the waist. Stubby cartoon proportions intentional (Duolingo/Mario/Pixar precedent for kid-friendly characters).
- **Repositioned speech bubble below Freddy's face, over the counter** — was `bottom-[72vh]` with `tailSide="left"` which read as "too far from his face" and would have conflicted with his raised OK-gesture hand if moved closer. Now `bottom-[42vh]` with new `tailSide="top-left"` so the tail rises from the bubble's top edge up to Freddy's chest/face.
- **Extended `SpeechBubble` with `"top-left"` and `"top-right"` tail variants** — these point UP from the bubble's top edge, useful when the bubble is positioned below the speaker.
- **Wired real restaurant scene background into `RestaurantScene`** — full-bleed `object-cover` `<img>` layer; children (Freddy, bubbles, overlays) render on top.
- **Locked the gesture-to-beat mapping convention** — greeting + warm reactions → `ok`; idle / calm explaining → `neutral`; AHA + Win celebrations → `excited`; setup of reveal beats ("hmm…") → `thinking`; facing a guest → `pointing` (only valid gesture for that facing direction).

## Key Prompts & Responses

> **User:** "I think for our next back-and-forth we're going to be discussing the mid journey prompting and the best process to get the best results. After I see that you made this mid journey prompts file… I think it's not so much rooted in how mid journey expects their workflow to be utilized."
>
> **Outcome:** Recognized my MJ prompt file was modeled on the outdated Discord-era workflow (long inline style suffixes per prompt). Rewrote `assets/midjourney-prompts.md` to use the modern web-editor pattern (Moodboard + Style Creator as persistent defaults, per-asset prompts short and subject-only). Later abandoned MJ entirely for characters after Style Creator failed to converge.

> **User:** "Right now, that prompt is not giving me the results that I'd like. They're too artistic and not really the style that we're thinking of."
>
> **Outcome:** Diagnosed that MJ was interpreting the prompt as gallery-art (painterly portraits, watercolors). Iterated through three rounds of prompt revisions and one structural pivot (discovering Style Creator has a two-field UI from a video tutorial, then learning the user's actual UI doesn't even have that second field anymore). Eventually concluded MJ was the wrong tool for our character art and switched to ChatGPT.

> **User:** "If we decide not to use an AI tool like Midjourney or Dolly, then do we forfeit the ability to have the mouth poses later on?"
>
> **Outcome:** Honest answer — yes, mostly. Asset libraries make Phase 2 (full phoneme lip-sync) effectively impossible and Phase 1 (open/closed toggle) tedious (manual SVG editing in Figma). Recommended trying ChatGPT first to preserve all options. That call panned out — ChatGPT delivered a perfect Freddy on the first try, preserving the full mouth-pose roadmap.

> **User:** "So this character looks great. We just need all the variations. I wouldn't really change a thing except maybe the text on the apron."
>
> **Outcome:** Locked the Freddy character. Provided a sequential prompt script for generating all four (then six, then eight, then ten) variations in the same ChatGPT thread to preserve character consistency. Iterated naming conventions to `{facing-direction}-{gesture}-{mouth}.png` for a clean two-axis system.

> **User:** "I think the only thing here I'm wanting to change is the location of the speech bubble. It's a little far from his face… maybe placing the speech bubble below his chest so that it's partially covering the table might be better."
>
> **Outcome:** Extended `SpeechBubble` with `top-left` / `top-right` tail variants (CSS triangle pointing up from the bubble's top edge). Repositioned the greeting/response bubbles in `LessonView` to sit at `bottom-[42vh]` with `tailSide="top-left"` so they appear over the counter with the tail rising up to Freddy's chest/face. Noted inline that bubble positioning will need to be context-aware in future (different anchors for guest bubbles, etc.).

> **User:** "Let's think about next moves in a new chat because I actually want to document some of the entire chat history and the decisions that we made."
>
> **Outcome:** Wrote the comprehensive in-chat wrap-up summary, then invoked this `document-chat` skill to persist it as a journal entry for the next session's context load.

## Files Touched

### New
- [public/images/characters/freddy/facing-student-ok-closed.png](public/images/characters/freddy/facing-student-ok-closed.png) — Freddy facing student, OK gesture, mouth closed
- [public/images/characters/freddy/facing-student-ok-open.png](public/images/characters/freddy/facing-student-ok-open.png) — OK gesture, mouth open (speaking)
- [public/images/characters/freddy/facing-student-neutral-closed.png](public/images/characters/freddy/facing-student-neutral-closed.png) — hand at side, mouth closed (idle/explaining)
- [public/images/characters/freddy/facing-student-neutral-open.png](public/images/characters/freddy/facing-student-neutral-open.png) — hand at side, mouth open
- [public/images/characters/freddy/facing-student-excited-closed.png](public/images/characters/freddy/facing-student-excited-closed.png) — both arms raised celebration, mouth closed
- [public/images/characters/freddy/facing-student-excited-open.png](public/images/characters/freddy/facing-student-excited-open.png) — celebration with mouth open (AHA + Win)
- [public/images/characters/freddy/facing-student-thinking-closed.png](public/images/characters/freddy/facing-student-thinking-closed.png) — hand on chin pondering, mouth closed
- [public/images/characters/freddy/facing-student-thinking-open.png](public/images/characters/freddy/facing-student-thinking-open.png) — pondering, mouth open
- [public/images/characters/freddy/facing-guest-pointing-closed.png](public/images/characters/freddy/facing-guest-pointing-closed.png) — back to viewer, pointing at unseen guest, mouth closed
- [public/images/characters/freddy/facing-guest-pointing-open.png](public/images/characters/freddy/facing-guest-pointing-open.png) — back to viewer, speaking to guest
- [public/images/backgrounds/superslice-interior.png](public/images/backgrounds/superslice-interior.png) — chef's-POV restaurant scene background

### Modified
- [src/modules/world/FreddyCharacter.tsx](src/modules/world/FreddyCharacter.tsx) — replaced emoji placeholder with `<img>` rendering from `/public/images/characters/freddy/`; added `gesture: 'ok' | 'neutral' | 'pointing' | 'excited' | 'thinking'` prop; removed `expression` prop; removed Framer Motion body-bob animation in favor of static rendering; `mouth` toggle is now the only speaking signal
- [src/modules/world/SpeechBubble.tsx](src/modules/world/SpeechBubble.tsx) — extended `BubbleSide` union with `top-left` and `top-right`; added CSS triangle variants that extend upward from the bubble's top edge
- [src/modules/world/RestaurantScene.tsx](src/modules/world/RestaurantScene.tsx) — wired in the SuperSlice interior background as a full-bleed `object-cover` `<img>` layer
- [src/modules/world/index.ts](src/modules/world/index.ts) — exported new `FreddyGesture` type; removed `FreddyExpression`
- [src/modules/lesson/LessonView.tsx](src/modules/lesson/LessonView.tsx) — repositioned Freddy bottom-left at `h-[88vh] md:h-[100vh]`; passed `gesture="ok"` for onboarding; moved speech bubble container to `left-[26%] md:left-[34%] bottom-[42vh]` with `tailSide="top-left"`
- [assets/midjourney-prompts.md](assets/midjourney-prompts.md) — three iterations: first cleaned up for modern MJ web editor, then split into a two-field Style Creator workflow per the tutorial, then rewritten one more time as a dual-tool (ChatGPT primary for characters/scene + MJ fallback for one-offs) workflow document
- [TASKS.md](TASKS.md) — marked task #21 complete (Wire Freddy character assets + add gesture axis)

## Open Threads

- **Speech bubble positioning is context-blind** — the current `tailSide="top-left"` bubble works for Freddy at his bottom-left position, but doesn't yet adapt to a different anchor (e.g., guest bubbles on the right side of the counter). Needs a positioning system keyed off which character is currently speaking.
- **XState lessonMachine is not yet wired to the React app** — `LessonView` still uses local `useState` to drive the onboarding flow (showGreetingBubble, showResponseBubble, name handoff). The canonical machine in `stately/lesson.ts` and the runtime stub in `src/modules/tutor/tutorMachine.ts` are both present but the React layer hasn't yet been replaced with `useMachine()` from `@xstate/react`.
- **AudioEngine is still stubbed** — currently fires `onDone` after a fake `setTimeout` delay. ElevenLabs voice generation pipeline (`scripts/generate-voice.ts`), Vercel Edge Function (`api/voice.ts`), and IndexedDB name cache are all skeletons. Voice ID `QzTKubutNn9TjrB7Xb2Q` is committed but must be "Added to my voices" in the ElevenLabs dashboard before the API will work.
- **Guest characters and CTA hero illustration not yet generated** — both are P4/P5 work. Guest assets blocked on PT.2; CTA hero is polish-level.
- **Beat 5 dialogue and the rest of the lesson beats unauthored in Stately** — `stately/lesson.ts` has Beat 5 (`equivalence_reveal`) fleshed out but only stubs for the other six sub-beats inside `onboarding`/`explore`/`instruct`/`check`/`celebrate`. PT.3 is the user's task.
- **No physical iPad testing yet** — PT.4 is still open; only Playwright webkit emulation so far.
- **No Superbuilders brand research applied** — PT.5 still open; placeholder warm-cream + terracotta palette tokens are in use.
- **`@tsparticles/*` packages unresolved** — v2 hits a deprecation guard in v3's postinstall, v3 publishes with `workspace:` protocol that npm rejects. Currently uninstalled; revisit when we actually need particle effects in P5.
- **Vercel CLI is 52.0.0 → 54.2.0 update available** — user can run `npm i -g vercel@latest` when convenient.

## Next Steps

1. **Wire `lessonMachine` to drive onboarding** — `src/modules/lesson/LessonView.tsx` — replace local `useState` (showGreetingBubble, showResponseBubble, greetingDismissed, etc.) with `useMachine(lessonMachine)` from `@xstate/react`. Map state nodes (`onboarding.greeting`, `onboarding.awaiting_name`, `onboarding.name_received`) to render conditions. Hook `NameInputOverlay`'s submit to send `NAME_ENTERED` event. Acceptance: same visual onboarding flow, but driven by XState; smoke test still passes; can drop into `useMachine` devtools and see state transitions.
2. **Hook `AudioEngine` to fire `DIALOGUE_DONE` events on the machine** — `src/modules/audio/AudioEngine.ts` + `src/modules/lesson/LessonView.tsx` — the machine's `playDialogue.X` entry actions should invoke `audioEngine.play({ dialogueKey, onDone: () => send({ type: 'DIALOGUE_DONE' }) })`. Stub still uses fake setTimeout duration; that's fine until P3. Acceptance: state machine progresses through `greeting → awaiting_name → name_received → done` automatically driven by audio "completion" events.
3. **Make speech bubble positioning context-aware** — `src/modules/world/SpeechBubble.tsx` + `LessonView.tsx` — add an `anchor` prop (e.g., `'freddy' | 'guest-1' | 'guest-2'`) that the bubble container uses to look up the correct position + `tailSide`. Or: have the bubble accept explicit `position` coordinates and let callers do the math. Acceptance: when guests are added in P4, their bubbles render in the right place with the right tail direction without code duplication.
4. **Author full Beat 5 in Stately** — Jason's PT.3 task. The skeleton in `stately/lesson.ts` (under `states.instruct.states.equivalence_reveal`) has 10 sub-states matching PRD §5.1 + §5.1.1. Refine the dialogue lines in each `description` field with Jersey-Shore voice; expand wrong-answer branches as you think of edge cases. Export back from Stately's Code tab and paste over `stately/lesson.ts`. Acceptance: machine still exports cleanly; Claude can drop the new version into `tutorMachine.ts` and run `generate-voice.ts` (once implemented) to produce MP3s.
5. **Generate guest characters via ChatGPT** — PT.2 — same thread as Freddy for consistency. 3 distinct guests × 3 expressions each (neutral, frown, smile) = 9 PNGs. Save to `public/images/characters/guests/{guest-id}-{expression}.png`. Acceptance: all 9 files in the right folder with consistent naming.
6. **Implement `scripts/generate-voice.ts`** — `scripts/generate-voice.ts` — reads `src/modules/tutor/dialogue.json`, splits each line at `{{NAME}}`, calls ElevenLabs API for each segment, saves MP3s to `/public/audio/<key>.mp3` (or `_a.mp3` + `_b.mp3` for name-split lines). Idempotent (skip regen if unchanged). Acceptance: `npm run generate-voice` produces MP3 files for all Beat 5 lines without erroring; the voice ID `QzTKubutNn9TjrB7Xb2Q` must first be added to Jason's account in the ElevenLabs Voice Library dashboard.
7. **Get a physical iPad for testing** — PT.4 — by Wednesday EOD per the original plan. Test Safari iPadOS specifically (Playwright webkit is a close emulation but the real device may surface touch/audio quirks).
8. **Apply Superbuilders brand tokens** — PT.5 — pull palette + fonts from https://jobs.superbuilders.dev/jobs and update `tailwind.config.js`. PRD §2.3 reserves this work as a small dedicated round.

---

*Files to read first when resuming: [PRD.md](PRD.md), [TASKS.md](TASKS.md). The canonical state-machine source is [stately/lesson.ts](stately/lesson.ts) (round-trips via the Stately editor URL noted there). The Stately editor URL is in the PRD §5.*
