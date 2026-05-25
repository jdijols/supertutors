# May 21, 2026 at 9:02 PM — Test rescue + polish deploy

## TL;DR

Resumed mid-stream after a big batch of UX changes had landed (sentence-aware audio playback, bookended exploration intro tour, workspace-renders-during-onboarding) but the e2e suite was broken in five different ways. Walked through each failure, fixed the underlying issue rather than papering over the test, then bundled two small UI-polish passes that surfaced during the work and shipped four logical commits to production. Production is now serving the latest bundle (`index-DBj7TDaa.js`), 29/30 e2e + 207/207 unit tests green, and the demo is in a state where the user can iterate on Act 2 (Share the Pizza instructional beat) without test infrastructure noise getting in the way.

## Decisions

- **Fix the product, not the tests** — Every e2e failure had a real-product root cause underneath (pointer events leaking through the pieces wrapper, a11y contrast violation in the speaker label, dev controls colliding with the AddPizzaButton). Test updates were the consequence, not the primary fix.
- **Pieces layer gets `pointer-events: none`; each PizzaPiece re-opts in via `pointer-events: auto`** — The wrapper covers the entire viewport but most of it is transparent space. Inverting the default and re-opting in on the interactive sub-layer means the speech bubble can be clicked through empty viewport while pieces remain draggable.
- **Greeting bubble's manual-click pattern is dead in test contexts** — The bubble now auto-dismisses on audio-end (a design change from this session's earlier work); tests that stub audio to 404 cause that auto-dismiss to be instantaneous, racing any manual `bubble.click()` call. Tests now wait for the name input to surface instead.
- **Dev controls live at `top-24 left-4`** — They were at `top-4 left-4 z-50` directly under the AddPizzaButton (`top-4 left-4 z-60`). Real users never see the dev panel so it went unnoticed in manual QA, but Playwright clicks went through the AddPizzaButton's hit area in every demo-mode test. Moving them down 80px is cheaper than rejigging z-indexes.
- **Speech-bubble speaker label uses `text-sb-ink/70`** — `text-sb-accent-deep` (#8c7556) on `bg-sb-paper` (#efe7da) was 3.56:1 contrast — below WCAG AA 4.5:1 for small text. Axe was failing on every snapshot that captured a bubble. The new color is plenty dark against cream and keeps the chip visually subordinate to the actual line of dialogue underneath.
- **Hover/tap scales standardized to 1.04 / 0.92 with spring 600/22 across all corner-button UI** — AddPizzaButton, NameInputOverlay's submit button, ToolPicker's tool buttons, and MuteToggle now share the same numbers. Visual coherence under the finger, no other reason.
- **`/preview/sandbox` stays gone; tests use `?skip=true` instead** — Confirmed during the test pass that the unification from the previous chat is holding. No regression to the separate-sandbox URL.
- **CV mode is portfolio signaling, not primary UX** — When the user asked what the CV mode is for, I framed it honestly: the value isn't "kids learn fractions better with their hands" (unproven), it's that Patrick Skinner wrote the brainlift on this exact thesis (BEMO) and we shipped a working hand-tracked manipulative in-browser. Demo should lead with the polished lesson, then "and one more thing" with the CV button at the end.

## Key Prompts & Responses

> **User:** "I want to understand all the capabilities that we implemented regarding the computer vision side. […] What is the idea here on how this impacts our lesson, and what is the value proposition of this tool?"
>
> **Outcome:** Wrote a structured answer covering (1) the technical pipeline (MediaPipe Hands in browser, pinch recognizer with hysteresis, synthetic pointer event bridge, visual feedback, graceful failures), (2) the strategic value proposition tied directly to Patrick Skinner's "Education via Computer Vision" brainlift and BEMO, (3) honest UX trade-offs (slower than mouse, permission friction, unproven pedagogy), and (4) demo-positioning advice ("end the demo with it, don't lead with it"). The user has now seen the strategic framing to use in the interview.

> **User:** "Stage, commit, and push all changes that you made from this chat to our GitLab and GitHub repos. Go ahead and bundle them in similar changes so that it's not one big monolithic commit. Keep very professional Git behaviors here. All our updates should hit the deployed production site."
>
> **Outcome:** Discovered ~50 files in dirty state on entry, ran the test suite first instead of committing blind, found 16 failing e2e tests, fixed each underlying issue, and shipped four focused commits (a11y / test alignment / two polish passes). All four pushed to both remotes and verified on production via bundle-hash match.

> **User:** "I have two pizzas on the workspace. The add button is just deactivated, and the box is pulsing." (from screenshot reference)
>
> **Outcome:** This was a prior turn (cap counter never decremented on delivery). Already fixed in commit `b5d8e06` before resume — the cap is now derived from `workspaceMass(pieces)` so deliveries reopen the gate automatically. Today's session inherited the fix; verified still working.

> **User:** "Right now, the workspace count for pizzas gets subtracted depending on what was the size of that slice. […] You'll probably have a more seamless and smart way to make the calculations that is better than what I suggested." → later: "the button should only be available to add more pizzas when the workspace mass is less than or equal to three."
>
> **Outcome:** Both fixes already landed before resume (`eae8590` mass-based cap, `b5d8e06` clearer `mass ≤ 3` framing). Today verified both are in production.

## Files Touched

### Modified this session

- [src/modules/lesson/LessonTable.tsx](src/modules/lesson/LessonTable.tsx) — `pointer-events-none` on the pieces wrapper so empty viewport doesn't intercept clicks meant for the speech bubble
- [src/modules/table/PizzaPiece.tsx](src/modules/table/PizzaPiece.tsx) — interactive layer adds explicit `pointer-events: auto` so pieces remain draggable through the wrapper's `none`
- [src/modules/lesson/LessonView.tsx](src/modules/lesson/LessonView.tsx) — (a) re-focus name input on greeting dismissal via `useEffect` on `greetingDismissed`, (b) move dev controls from `top-4 left-4` to `top-24 left-4` so they don't overlap the AddPizzaButton
- [src/modules/world/SpeechBubble.tsx](src/modules/world/SpeechBubble.tsx) — speaker-label color from `text-sb-accent-deep` to `text-sb-ink/70` (a11y contrast fix)
- [src/modules/world/AddPizzaButton.tsx](src/modules/world/AddPizzaButton.tsx) — token alignment: `transition-colors` not `transition-all`, disabled state uses `opacity-40` not stacked color modifiers, picker thumbnails use `bg-sb-card hover:bg-sb-paper-deep`, hover/tap scales tuned to 1.04 / 0.92
- [src/modules/world/NameInputOverlay.tsx](src/modules/world/NameInputOverlay.tsx) — label uses `text-sb-muted`, input gains focus-visible ring, submit button gains hover scale + `hover:bg-sb-ink/90` + warm-cinnamon shadow + `transition-colors`
- [src/modules/world/ToolPicker.tsx](src/modules/world/ToolPicker.tsx) — buttons gain `whileHover={scale: 1.04}`, tap scale 0.9 → 0.92, spring damping 20 → 22, picker background flat (removed `bg-sb-paper/95 backdrop-blur`)
- [e2e/a11y.spec.ts](e2e/a11y.spec.ts) — `send name: testkid` aria-label, drop manual greeting bubble click (auto-dismisses)
- [e2e/beat-6-aha.spec.ts](e2e/beat-6-aha.spec.ts) — same aria-label update, drop bubble click, wait for `waiting_for_slice` (not just any `aha.*`) before clicking SLICED so RESET doesn't eat the event, hero-line regex matches `Whoa, kid!` (reworded `aha_reveal`)
- [e2e/beat-8-win.spec.ts](e2e/beat-8-win.spec.ts) — same aria-label + drop bubble click
- [e2e/smoke.spec.ts](e2e/smoke.spec.ts) — same aria-label

### Created this session

- [Journals/May-21-2102-test-rescue-and-polish-deploy.md](Journals/May-21-2102-test-rescue-and-polish-deploy.md) — this journal entry

### Inherited from earlier in the day (committed by prior session before this resume)

- `src/lib/dialogueSplit.ts` + test — sentence-aware audio segmentation
- `src/modules/audio/AudioEngine.ts` + test — multi-segment playback with `onSpeakingChange` per-sentence callback for mouth sync
- `scripts/generate-voice.ts` — regenerates MP3s under the new `_s0/_s1/…` naming
- `src/modules/tutor/dialogue.json` — new exploration keys (`explore_intro_1..4`, `explore_cue`, `explore_handoff`), reworded reactions, `aha_reveal` no longer interpolates `{{NAME}}`
- `src/modules/lesson/LessonExploration.tsx` — bookended 7-stage tour (`intro_1..4` → `free_play` → `cued` → `handing_off` → `done`) with spotlight cues per stage
- `src/store/appStore.ts` — `FreddyDisplay` + `Spotlight` types
- `src/styles/globals.css` — `@keyframes deliveryBoxPulse` reused as `.spotlight-pulse`
- `src/modules/world/{AddPizzaButton,DeliveryBox,ToolPicker}.tsx` — read `appStore.spotlight` to pulse + (for AddPizza) auto-open the variant menu during the tour
- `src/modules/world/FreddyCharacter.tsx` — consumes `FreddyDisplay` state (facing / gesture / mouth)
- `src/modules/ui/ExitButton.tsx` — new exit affordance
- `public/audio/*` — full regeneration under `_s0/_s1/…` naming
- `public/images/backgrounds/superslice-counter.png` — new counter background asset

## Open Threads

- **Act 2 (Share the Pizza) is unstarted** — `References/Share the Cookies Lesson/` has 36 Synthesis screenshots committed but no port has begun. Next chat should pick this up. The exploration tour now ends in a `cued → handing_off → done` flow with `onComplete` callback wired up; Act 2 needs to mount after that handoff.
- **iPad-Safari framer-motion drag is the only skipped e2e test** — `sandbox-proximity.spec.ts` skips on webkit because synthesized touch events don't reach framer-motion's `setPointerCapture`. PT.4 (real iPad in hand) is the resolution path, not more test wiring.
- **Bundle size warning persists** — vite reports `index-DBj7TDaa.js` at 612 kB minified / 193 kB gzipped, over the 500 kB warning threshold. MediaPipe vision bundle is the bulk. Could code-split CV mode behind a dynamic import if it becomes a real perf issue on slow networks; not blocking for the demo.
- **One a11y test still skipped for iPad-Safari** — see above. Same root cause.
- **Vercel CLI is 54.2.0 → 54.3.0** — upgrade available per session-start hook, not blocking. `npm i -g vercel@latest` when convenient.

## Next Steps

1. **Author Act 2 (Share the Pizza) instructional beat** — start by reading `References/Share the Cookies Lesson/a.png` through `zj.png` in order, then port the Synthesis script into Freddy's voice using the existing `tutorMachine.ts` skeleton. The `LessonExploration` component already calls `onComplete()` when the kid finishes the handoff line; LessonView should mount the next-act component there. Acceptance: a kid can complete the exploration tour, tap-Freddy/start-lesson, and land in the instructional beat with audio + visuals matching the polish bar of Act 1.
2. **Generate Act 2 dialogue MP3s** — once the new keys are in `dialogue.json`, run `npm run generate-voice` to produce the ElevenLabs segments. The script uses the `_s0/_s1/…` naming so it'll integrate with the existing AudioEngine without code changes.
3. **Decide whether the React `setName(nameOverride ?? "Chef")` path in skip mode is fine for the demo** — currently `?skip=true` uses the literal "Chef" as the kid's default name in every Freddy line. The user could prefer "Patrick" or "champ" or a random pick. Trivial to change in `src/modules/lesson/LessonView.tsx` if so.
4. **Demo video recording prep** — Friday-ish per the original PRD timeline. The polished `/lesson` flow is now production-ready and reliable; the demo-mode keyboard shortcuts (1–8, 0, C, Shift+R) are wired and ready for the recording session. Use `?demo=true` to enable hotkeys without making them globally available.
5. **Consider whether `aha_reveal` should re-interpolate `{{NAME}}`** — the AHA line was de-personalized to "Whoa, kid!" at some point earlier today. That made the e2e regex easier but reduced personalization at the highest-impact moment of the lesson. If Patrick is the audience, re-personalize. Trade-off: re-generates one MP3 segment but a more emotionally-landing payoff.
6. **iPad device testing (PT.4)** — every other open thread depends on it. A real iPad in hand to verify: webcam permission flow on Safari, slicing precision via touch (without mouse), tool sprite cursor behavior on touch-only, audio playback latency on cellular.

---

*Production state at journal time: `main` at `d42fd93`, both remotes in sync, bundle `index-DBj7TDaa.js` live at `https://supertutors.vercel.app`. 29/30 e2e + 207/207 unit green. Working tree clean.*
