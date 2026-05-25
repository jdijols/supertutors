# May 21, 2026 at 9:02 PM — Explore-act script, sentence-aware audio, Freddy choreography

## TL;DR

Long session focused on shaping Act 1 (Explore) into a bookended experience: refreshed Freddy's script, built a 9-stage choreographed tour with spotlight cues + tap-Freddy handoff, and reworked the audio pipeline to split lines at sentence boundaries so the mouth closes at every period. Three commits landed and pushed to GitHub + GitLab (audio infra, explore-act UI, pointer-events fix). Production deploy is live with the new flow; the next act (Share-the-Pizza) is the unauthored hook the handoff line transitions into.

## Decisions

- **Bookend the explore act with a scripted ramp** — A 4-line opener tour + free play + cue line + handoff (instead of a single intro and chaos) gives Act 1 a real arc and a clean transition to Act 2.
- **Spotlight choreography paired with each opener sub-line** — Splitting the opener into 4 short MP3s and chaining them with a `spotlight` zustand store lets each highlight fire on the exact beat its line begins. AddPizzaButton additionally auto-opens its variant menu while spotlit.
- **Both affordances at the cued stage** — Tap-Freddy (diegetic) AND a "Start lesson" button (discoverable). Both appear only when the cue line fires, keeping free-play uncluttered.
- **`ok` wave reserved for the onboarding warm-up only** — From the counter tour onward Freddy uses `neutral` — overusing `ok` would make the wave meaningless.
- **Freddy stays student-facing through free_play** — He only turns to face customers AFTER the cue line ends (not at end of intro_4 as originally drafted). Turns back when the kid taps him for the handoff.
- **{{NAME}} reserved to a single beat (onboarding_response)** — Globally swap {{NAME}} → "kid" everywhere else. Freddy's personality calls everyone "kid"; the name only carries the moment they type it.
- **Sentence-aware audio pipeline** — `splitDialogueLine` now splits on `.`, `!`, `?` boundaries in addition to `{{NAME}}`. One MP3 per sentence; AudioEngine fires `onSpeakingChange(true/false)` at every segment boundary with a 160ms gap so mouth closes at each period.
- **No intra-line lip-flap** — A randomized open/closed flap during a single utterance was tried then explicitly reverted — too distracting. Mouth holds open per utterance, closes at each sentence boundary.
- **Dev-only Vite middleware for `/api/voice`** — `npm run dev` (plain Vite) doesn't serve Vercel functions; the new `vite.config.ts` plugin loads `api/voice.ts` and serves it locally so the name MP3 actually plays in dev.
- **Resilient name fetch in AudioEngine** — If `/api/voice` is unavailable, still play the static segments instead of aborting the line. Kid hears everything except personalization.
- **Atomic explore-act commit grouping** — Audio infra + dialogue + UI choreography were committed together (rather than split into smaller commits) because they interlock — splitting would leave intermediate states with 404'd MP3s or compile errors.
- **DeliveryBox closed-size trimmed 10% (210 → 189px)** — Lid-close reads as a perceptible shrink, not just an image swap. OPEN_SIZE and CLOSED_SIZE decoupled.

## Key Prompts & Responses

> **User:** "Can you return the current script that we have for Freddy, like in a linear perspective…"
>
> **Outcome:** Walked through the 7-line happy path from `dialogue.json`. Set the baseline for everything that followed.

> **User:** "we need to make sure when we say the pizza's on the counter, it needs to actually be there. Everything after this related to the aha and lesson_win isn't really apart of the exploration act."
>
> **Outcome:** Verified pizza mounts at viewport-load (LessonTable seeds a whole pizza at ~55% vh). Reframed the explore act as its own thing — aha/win stay as latent reactions but aren't part of the scripted arc.

> **User:** "Tap Freddy action and what you have as line C pre-lesson cue, Freddy could say something like, 'Just tap me on the shoulder when you're done just messin' around.' Then, when the handoff in line D takes place, Freddy could say something like, 'All right, let's start here.' … Let's do both affordances and finally apply the name to KIT swap."
>
> **Outcome:** Locked the final ramp: 4 opener sub-lines + revised cue (`explore_cue`) + handoff (`explore_handoff`). Both affordances (button + tap-Freddy) wired. Name→kid swap applied globally except `onboarding_response`.

> **User:** "So it looks like the dynamic name injection is not happening. He says the lines, 'Beautiful name, all right. Let me show you how this works,' but the name is not inputted."
>
> **Outcome:** Diagnosed `/api/voice` 404 in Vite dev → resolveNameUrl throws → AudioEngine.resolveSegments aborts the line. Fixed by adding a dev-only Vite plugin in `vite.config.ts` + making the engine play static halves resiliently if name fetch fails. Verified locally with `curl POST /api/voice` returning a real 13KB MP3.

> **User:** "Hey, that was not the flopping that I wanted. We don't need to constantly be opening and closing rapidly while one line's being said."
>
> **Outcome:** Reverted the intra-line flap (deleted the random-interval useState/useEffect from FreddyCharacter). Mouth now stays open for an utterance, closes between dialogue keys naturally via `speaking` state transitions.

> **User:** "Sorry, one more little update. The mouth close should be at the end of every sentence, even if it's within the same line."
>
> **Outcome:** Reworked the entire audio pipeline to be sentence-aware. New `Segment` shape in `dialogueSplit.ts`, AudioEngine looks up dialogue from `dialogue.json` and sequences segments with `onSpeakingChange` callbacks + 160ms inter-segment gap. Regenerated all MP3s with `_sN` suffixed naming (31 new files, 13 orphans pruned).

> **User:** "Stage, commit, and push all changes that you made from this chat to our GitLab and GitHub repos. … Keep very professional Git behaviors here."
>
> **Outcome:** Found user had already committed the two themed bundles (audio + explore) with the exact split I was planning. Only the pointer-events fix (LessonTable + PizzaPiece) was left — committed it and pushed all 3 commits to both remotes via the single `origin` push URL setup.

## Files Touched

### Audio pipeline
- [src/lib/dialogueSplit.ts](src/lib/dialogueSplit.ts) — sentence + name splitter; new `Segment` discriminated union (`static` | `name`).
- [src/lib/dialogueSplit.test.ts](src/lib/dialogueSplit.test.ts) — full test rewrite for new shape.
- [src/modules/audio/AudioEngine.ts](src/modules/audio/AudioEngine.ts) — looks up segments from `dialogue.json`, sequences with `onSpeakingChange` + inter-segment gap, resilient name fetch.
- [src/modules/audio/AudioEngine.test.ts](src/modules/audio/AudioEngine.test.ts) — tests use injected `lineLookup` to decouple from real dialogue content; new "mouth-close at every period" test.
- [scripts/generate-voice.ts](scripts/generate-voice.ts) — handles new `Segment.kind === 'static'` filtering.

### Script + tests
- [src/modules/tutor/dialogue.json](src/modules/tutor/dialogue.json) — rewrote `onboarding_greeting`, `onboarding_response`; added `explore_intro_1..4`, `explore_cue`, `explore_handoff`; removed `lesson_play_intro`; {{NAME}} → "kid" globally except onboarding_response.
- [src/modules/tutor/dialogue.test.ts](src/modules/tutor/dialogue.test.ts) — updated assertions for the new {{NAME}} reality.
- [src/modules/tutor/tutorMachine.test.ts](src/modules/tutor/tutorMachine.test.ts) — flipped the "real detector" test to assert aha_setup is now static.

### State + styles
- [src/store/appStore.ts](src/store/appStore.ts) — added `Spotlight`, `FreddyDisplay` types + `setSpotlight` / `setFreddy` actions.
- [src/styles/globals.css](src/styles/globals.css) — `.spotlight-pulse` keyframes (scale + warm glow).

### Lesson
- [src/modules/lesson/LessonExploration.tsx](src/modules/lesson/LessonExploration.tsx) — full rewrite with 9-stage machine (`pre → intro_1..4 → free_play → cued → handing_off → done`), spotlight tour, tap-Freddy hit area, Start Lesson button, 90s fallback timer.
- [src/modules/lesson/LessonView.tsx](src/modules/lesson/LessonView.tsx) — Freddy state from store; `name input pulsing` after greeting; `onSpeakingChange` wired through.
- [src/modules/lesson/LessonTable.tsx](src/modules/lesson/LessonTable.tsx) — `pointer-events-none` on the pieces wrapper to keep speech bubble clickable.

### World UI
- [src/modules/world/FreddyCharacter.tsx](src/modules/world/FreddyCharacter.tsx) — simplified mouth handling: `speaking ? "open" : mouth`. No intra-line flap.
- [src/modules/world/ToolPicker.tsx](src/modules/world/ToolPicker.tsx) — reads `spotlight === 'toolpicker'`, applies pulse.
- [src/modules/world/AddPizzaButton.tsx](src/modules/world/AddPizzaButton.tsx) — spotlight pulse + derived `open = userOpen || spotlit` so menu auto-opens during tour without setState-in-effect lint trip.
- [src/modules/world/DeliveryBox.tsx](src/modules/world/DeliveryBox.tsx) — spotlight pulse takes priority over cap-hint; `CLOSED_SIZE` trimmed 210 → 189; right-edge nudged.
- [src/modules/world/NameInputOverlay.tsx](src/modules/world/NameInputOverlay.tsx) — chat-style row with optional `pulse` prop.
- [src/modules/world/SpeechBubble.tsx](src/modules/world/SpeechBubble.tsx) — new `bottom-left` / `bottom-right` tail directions.
- [src/modules/world/RestaurantScene.tsx](src/modules/world/RestaurantScene.tsx) — dedicated `superslice-counter.png` overlay for natural occlusion.
- [src/modules/world/ToolSprite.tsx](src/modules/world/ToolSprite.tsx) — positioning tweaks (user-made).
- [src/modules/table/PizzaPiece.tsx](src/modules/table/PizzaPiece.tsx) — `pointer-events: auto` re-opt-in on interactive layer.

### Chrome / app
- [src/App.tsx](src/App.tsx) — mounts ExitButton alongside MuteToggle.
- [src/modules/ui/MuteToggle.tsx](src/modules/ui/MuteToggle.tsx) — minor (user-made).
- [src/modules/ui/ExitButton.tsx](src/modules/ui/ExitButton.tsx) — NEW.
- [public/images/backgrounds/superslice-counter.png](public/images/backgrounds/superslice-counter.png) — NEW asset.

### Dev infra
- [vite.config.ts](vite.config.ts) — `devVoiceApi` plugin serves `/api/voice` in `npm run dev` via Vite middleware.

### Audio assets
- `public/audio/*` — 31 new `_sN` MP3s generated, ~16 orphan `_a`/`_b`/legacy files pruned. Manifest in sync (39 files on disk = 39 in manifest).

## Open Threads

- **Inter-segment beat consistency** — User noticed some sentence-break beats feel longer than others. Likely first-play network latency on `_sN` segments not yet in cache (the engine only preloads a few specific keys). After warm cache, all gaps should be ~160ms. Worth observing for a session before tuning.
- **Share-the-Pizza (Act 2) not authored** — `LessonExploration.onComplete` is currently a no-op. After the handoff line plays, Freddy goes quiet and the table stays playable. Need to author the formal lesson and wire it into the `done` stage transition.
- **Cue line wording** — User mentioned "Tell me or tap me on the shoulder when you're ready to learn more." as the cue phrasing during the choreography discussion. Currently the line is "Just tap me on the shoulder when you're done messin' around." Unclear if they want the rewording; I asked, didn't get an explicit answer.
- **Lint baseline (pre-existing)** — 8 `react-hooks/set-state-in-effect` errors live across LessonView, LessonExploration, LessonTable, CvPreview, demoMode, HandTracker. New code matches the existing pattern (cross-system state sync). Build still passes; lint is non-blocking. Worth addressing as a sweep later.
- **First-line audio gap** — Currently no enforced inter-LINE gap (only inter-segment, within one `play()` call). Between `intro_1 → intro_2` etc., the gap is just one render cycle + Howler load. If the user reports it as "too brief to perceive," add a small `setTimeout` in `LessonExploration`'s stage advance.

## Next Steps

1. **Observe + tune inter-segment gap** — `src/modules/audio/AudioEngine.ts` (`DEFAULT_INTER_SEGMENT_GAP_MS = 160`) — Play through the full intro twice (cold + warm cache) and decide if the perceived gap variance is acceptable. Adjust the constant if needed.
2. **Decide on `explore_cue` final wording** — `src/modules/tutor/dialogue.json` — Either confirm current ("Just tap me on the shoulder when you're done messin' around.") or swap to user's draft ("Tell me or tap me on the shoulder when you're ready to learn more."). If swapped, run `npm run generate-voice`.
3. **Author Share-the-Pizza (Act 2)** — `src/modules/lesson/` — Author the formal lesson stage machine. Wire it into `LessonExploration.onComplete`. Acceptance: handoff line completes → Act 2 mounts → kid sees first formal-lesson beat.
4. **Decide if inter-line gap needs enforcement** — `src/modules/lesson/LessonExploration.tsx` (stage advance in audio `onDone`) — Test the intro chain live. If `intro_1 → intro_2` boundary mouth-close is imperceptible, wrap the `setStage(next)` call in a `setTimeout(..., 150)`.
5. **Optional: preload `_sN` segments** — `src/modules/lesson/LessonExploration.tsx` — The current preload list still references key-level prefetch but each multi-sentence line now needs `_sN` individual segments warmed. Walk the segment list per line and prefetch each. Acceptance: first-play latency stops varying between sentences.
6. **Codebase lint sweep (optional)** — Tackle the 8 `react-hooks/set-state-in-effect` errors across `LessonView`, `LessonExploration`, `LessonTable`, etc. Either refactor to derived state or add scoped `eslint-disable-next-line` comments with rationale. Build is currently passing through them.
