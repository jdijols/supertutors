# SuperSlice Tasks

> Source of truth for delivery: what's done, what's in flight, what's blocking.
> See [PRD.md](./PRD.md) for full design rationale.
> This file is edited by both Jason and Claude as we work; commits should
> reference task IDs (e.g., "P1.3: wire AudioEngine to dialogue.json").

---

## Conventions

### Status
- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done
- `[!]` — blocked (note what / who in the body)

### Ownership
- **J** — Jason owns
- **C** — Claude owns (any session)
- **S** — Shared (e.g., Jason provides input, Claude implements)

### Validation patterns
Every task has a **Done when** line with concrete success criteria. Patterns:
- **Unit:** Vitest test passes (`npm test`)
- **Smoke:** Playwright E2E passes (`npm run test:e2e`)
- **Inspection:** Jason visually verifies at a specific URL / state
- **Build:** typecheck + `npm run build` passes
- **Deploy:** Vercel preview URL returns expected behavior

### Regression strategy
**After each phase completes, the full Playwright + Vitest suites run.** Any failures block the next phase. This catches regressions automatically as we layer features. We rely on the green CI signal — no manual "check everything still works" passes.

---

## Current Sprint

> Update this section at the start/end of each session so any new Claude session can ramp in 30 seconds.

**Active phase:** P0 complete; P1 ready to start (blocked on PT.3)
**Active session owner:** awaiting Jason for Stately Beat 5 authoring
**Blockers:** PT.3 (Stately Beat 5 authoring) blocks P1.2 onward. PT.1 ✓ locked (voice `QzTKubutNn9TjrB7Xb2Q`). PT.4 (iPad) blocks P1.6 inspection only.

---

## Parallel Tracks — Jason Owns

These are independent of my (Claude's) build sequence and **must start ASAP** to avoid blocking later phases.

- [x] **PT.1 — Pick ElevenLabs voice for Freddy (J)**
  - Voice ID `QzTKubutNn9TjrB7Xb2Q` committed to `dialogue.json` → `voice.voiceId`
  - https://elevenlabs.io/app/voice-library?voiceId=QzTKubutNn9TjrB7Xb2Q
  - **Follow-up before P3.3 actually generates MP3s:** Jason must "Add to my voices" in the ElevenLabs Voice Library (Library voices need to be saved to the account before API calls succeed)

- [ ] **PT.2 — Midjourney asset generation (J, using C-drafted prompts)**
  - Generate: Freddy (3–5 expressions), 3 guests (each with 3 expressions), CTA hero illustration, restaurant backgrounds
  - **Done when:** PNG/WebP files in `/public/images/` matching the structure in [PRD §6](./PRD.md#6-file-structure)
  - **Blocks:** P5 (polish)

- [ ] **PT.3 — Stately authoring (J)**
  - Beat 5 (AHA) fully authored with all wrong-answer recoveries in Jersey-Shore voice (continuing from the C-drafted skeleton)
  - Then Beats 1, 1.5, 2, 3, 4, 6, 7 as P4 sub-tasks unlock
  - **Done when:** Stately machine exports cleanly to XState v5 TS for each beat; URL is public-shareable
  - **Blocks:** P1 (Beat 5), P4 (rest of beats)

- [ ] **PT.4 — Physical iPad in hand (J)**
  - For real-device testing of touch, viewport, audio playback
  - **Done when:** an iPad is on the desk and ready to test
  - **Blocks:** all iPad inspection tasks across P1+
  - **Target:** end of day Wednesday 2026-05-20

- [ ] **PT.5 — Superbuilders brand research (S — C does the research, J validates)**
  - Pull colors, fonts, voice from https://jobs.superbuilders.dev/jobs
  - **Done when:** Tailwind config updated with real Superbuilders tokens; brand notes added to [PRD §2.3](./PRD.md#23-visual-language)
  - **Target:** ~1 hour, before P5 polish starts

---

## P0 — Test Infrastructure & Foundation Hardening

Goal: every subsequent phase ships with confidence. Set the testing bar now.

- [x] **P0.1 — Install + configure Vitest (C)**
  - Add: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
  - Configure `vitest.config.ts` (jsdom env, setup file with `@testing-library/jest-dom`)
  - Add npm scripts: `test`, `test:ui`, `test:run` (CI-friendly)
  - Write one passing smoke test (e.g., a utility math function)
  - **Done when:** `npm test` runs and passes; CI-friendly `test:run` exits 0

- [x] **P0.2 — Install + configure Playwright (C)**
  - Add `@playwright/test`; install chromium (webkit later for iPad Safari emulation)
  - Configure `playwright.config.ts` with iPad viewport (1180×820 portrait)
  - Add npm script: `test:e2e`
  - Write one smoke test: `/` → click "Learn Fractions with Freddy" → splash renders → enter "Test" → workspace appears
  - **Done when:** `npm run test:e2e` passes against `npm run dev`

- [x] **P0.3 — ESLint + Prettier (C)**
  - Add: `eslint`, `@typescript-eslint/*`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`
  - Configure `eslint.config.js` (flat config) + `.prettierrc`
  - Add npm scripts: `lint`, `lint:fix`, `format`
  - **Done when:** `npm run lint` passes on current scaffold; `npm run format` is idempotent

- [x] **P0.4 — Accessibility baseline (C)**
  - Add `@axe-core/playwright`
  - Extend P0.2 smoke test to run axe on `/` and `/lesson` (with a test name entered)
  - Fail on critical/serious violations
  - **Done when:** axe finds zero critical/serious violations on the placeholders

- [x] **P0.5 — Error boundary at app root (C)**
  - Add `ErrorBoundary` component wrapping `<RouterProvider>`
  - On error: friendly "Oops! Let's restart" UI with reset button
  - **Done when:** Throwing an error in any component shows the boundary, not a white screen; unit test verifies catch behavior

- [~] **P0.6 — Visual inspection of scaffold (J)** *(awaiting J's iPad confirmation; placeholders are deployed and a11y-clean)*
  - Open https://supertutors.vercel.app
  - Verify: Landing renders, CTA card navigates to /lesson, Splash captures name, LessonView renders placeholder Table + ChatPanel
  - **Done when:** Jason confirms scaffold UX placeholders match [PRD §3.8](./PRD.md#38-entry-flow--landing--splash)

---

## P1 — Beat 5 (AHA) Vertical Slice End-to-End

Goal: prove the entire pipeline (Stately → XState → React → audio → iPad) works for **one** beat before scaling out.

- [ ] **P1.1 — Beat 5 authored fully in Stately (J — see PT.3)**
  - All 9 states + 15 transitions matching [PRD §5.1 / §5.1.1](./PRD.md#51-beat-5-aha-state-diagram)
  - Dialogue text in state descriptions, with `{{NAME}}` placeholders
  - All wrong-answer recoveries in Jersey-Shore voice
  - **Done when:** Stately URL is public-shareable; exports XState v5 TS without errors

- [ ] **P1.2 — Export Beat 5 → tutorMachine.ts (C)**
  - Replace placeholder Beat 5 in `src/modules/tutor/tutorMachine.ts` with Stately export
  - Run `npm run extract-dialogue` (write this script) → updates `dialogue.json`
  - **Done when:** App compiles; `npm run typecheck` + `npm run build` pass; Vitest passes

- [ ] **P1.3 — Wire AudioEngine to dialogue.json (C)**
  - `AudioEngine.play(dialogueKey)` resolves to `/public/audio/<key>.mp3` via Howler
  - Fires `onDone` callback after Howler `onend`
  - Fallback: if MP3 missing/404, log + fire `onDone` after estimated duration (line length × WPM-derived ms) so the state machine never blocks
  - **Done when:** Unit test: AudioEngine plays a stub MP3 and calls `onDone`; missing-file path also fires `onDone`

- [ ] **P1.4 — Wire state machine to React via @xstate/react (C)**
  - `useMachine(tutorMachine)` hook in `LessonView`
  - State transitions trigger `playDialogue` actions → AudioEngine
  - Mock SLICED + PROXIMITY events via hidden dev-console buttons (temporary, removed in P2)
  - **Done when:** Dev console buttons advance Beat 5 through all happy-path states; ChatPanel renders the current dialogue text

- [ ] **P1.5 — Beat 5 happy-path Playwright smoke test (C)**
  - Launches dev server, navigates to `/lesson`, enters name "TestKid"
  - Fires mock events in order: SLICED(half) → PROXIMITY(equal) → ANIMATION_DONE
  - Expects each Freddy line to render in ChatPanel in sequence
  - Expects final state to transition out (to Beat 6 placeholder)
  - **Done when:** `npm run test:e2e` includes the Beat 5 happy path and passes

- [ ] **P1.6 — Visual inspection on iPad (J — depends on PT.4)**
  - Open Vercel preview URL on real iPad Safari
  - Walk through Beat 5 via dev console buttons
  - Verify: 44pt tap targets, viewport locked, no scroll bounce, audio plays (or text fallback if no audio yet)
  - **Done when:** Jason confirms Beat 5 plays end-to-end on real iPad Safari

---

## P2 — Pizza Manipulative + Slicer + Drag-to-Compare

Goal: the Table workspace becomes real. The hero gesture works.

- [ ] **P2.1 — Pizza SVG component (C)**
  - Procedural: crust + sauce + cheese + pepperoni layers
  - Configurable: position, size, slice count (1, 2, 4, 8), topping count
  - **Done when:** Unit test renders in all slice-count states without crash; visual inspection of a demo page

- [ ] **P2.2 — Slice (Piece) component (C)**
  - Represents one piece of a sliced pizza; knows its fraction value
  - Draggable via Framer Motion `drag` props
  - **Done when:** Unit test renders Slice with correct fraction prop; drag emits position-changed events

- [ ] **P2.3 — Slicer tool — bisect mechanic (C)**
  - When ToolMode is `cutter`, drag across a piece → split into two equal halves
  - Emits `SLICED { pieceId, parentFraction, resultingFractions }` event
  - Framer Motion `layout` animation on the split + spring-bounce of the new pieces
  - **Done when:** Drag slicer across whole pizza → two halves with animation; unit test on bisect math (1 → [1/2, 1/2], 1/2 → [1/4, 1/4])

- [ ] **P2.4 — Glove tool — grab/move (C)**
  - When ToolMode is `glove`, drag pieces freely on the table; pieces stay where dropped
  - **Done when:** Drag a slice → piece moves and persists position; visual inspection

- [ ] **P2.5 — ToolPicker UI (C)**
  - Two-button toggle (glove / cutter); tap to switch
  - 44pt minimum tap targets; clear active state
  - **Done when:** Tap glove → `toolMode='glove'`; tap cutter → `toolMode='cutter'`; visual inspection; axe a11y check passes

- [ ] **P2.6 — Proximity detection (C)**
  - When 2+ pieces are within threshold (~20pt of each other), evaluate total area
  - Emit `PROXIMITY_DETECTED { pieceIds, totalArea, comparison: 'equal' | 'not_equal' }`
  - **Done when:** Unit test: place pieces at known positions, verify event payload; tune threshold empirically in P2.11

- [ ] **P2.7 — Toast / CounterDisplay (C)**
  - Fraction toast on every slice ("you made halves! 1/2")
  - Counter UI component (used later in Beat 1.5)
  - **Done when:** Visual inspection — toast appears on each slice with correct fraction; auto-dismisses after 2s

- [ ] **P2.8 — Guest component placeholder (C — final art in P5)**
  - Renders guest with 3 expression states (neutral, frown, smile)
  - State driven by Zustand store
  - **Done when:** Demo view shows all 3 states; visual inspection

- [ ] **P2.9 — Freddy avatar placeholder (C — final art in P5)**
  - Static SVG/emoji placeholder; lives in ChatPanel
  - **Done when:** Placeholder visible in ChatPanel; visual inspection

- [ ] **P2.10 — Smoke test: slice + compare (C)**
  - Playwright: enter name → switch to cutter → drag across pizza → expect 2 pieces with fractions 1/2 + 1/2
  - Switch to glove → drag pieces near each other → expect "equal" UI feedback
  - **Done when:** `npm run test:e2e` includes P2.10 and passes; all prior smoke tests still pass

- [ ] **P2.11 — Visual inspection on iPad (J)**
  - On iPad: slice pizzas, drag pieces, see proximity feedback
  - Tune proximity threshold if too tight/loose
  - **Done when:** Jason confirms manipulative feels responsive and the gesture vocabulary is intuitive

---

## P3 — Voice Pipeline Live

Goal: real ElevenLabs voice playing in the lesson, with name personalization.

- [x] **P3.1 — ElevenLabs voice ID committed (J — see PT.1)**
  - `QzTKubutNn9TjrB7Xb2Q` committed
  - **Outstanding:** confirm voice is added to the ElevenLabs account's library (not just bookmarked)

- [ ] **P3.2 — Vercel env vars set (J)**
  - `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` in Vercel project settings (production + preview)
  - **Done when:** `vercel env ls` shows both vars in both environments

- [ ] **P3.3 — Implement generate-voice.ts (C)**
  - Reads `dialogue.json`; splits lines at `{{NAME}}`; calls ElevenLabs for each segment
  - Saves MP3s to `/public/audio/<key>.mp3` (or `<key>_a.mp3` + `<key>_b.mp3` for name-split lines)
  - Idempotent — skips regen if MP3 unchanged
  - **Done when:** `npm run generate-voice` produces MP3 files for all Beat 5 lines; unit test on the split logic

- [ ] **P3.4 — Implement Edge Function fully (C — stub exists)**
  - `api/voice.ts`: validate name, call ElevenLabs, return MP3 blob
  - Returns 400 on invalid name (empty / > 32 chars), 503 if env unset, 502 on upstream error
  - **Done when:** Unit test: invalid name → 400; valid name → calls ElevenLabs with correct body; deployed Edge Function returns 200 for valid POST

- [ ] **P3.5 — IndexedDB name cache (C)**
  - `src/modules/audio/nameAudioCache.ts`: get/set by name key
  - Falls back to fetch from `/api/voice` if not cached
  - **Done when:** Unit test: set name MP3, retrieve it, identity matches

- [ ] **P3.6 — Audio Engine sequential stitching (C)**
  - For name-injected lines, queue [pre-gen A] → [name MP3] → [pre-gen B] via Howler
  - Fires `onDone` after final segment ends
  - **Done when:** Unit test: stitch fires segments in order; integration: Beat 5 with kid's name actually spoken naturally

- [ ] **P3.7 — Smoke test: voice playback (C)**
  - Playwright: enter name, navigate to Beat 5, expect HTMLAudioElement to play (or `/api/voice` to return 200 + audio/mpeg)
  - **Done when:** Test passes; all prior smoke tests still pass

- [ ] **P3.8 — Visual + audio inspection on iPad (J)**
  - Beat 5 played on iPad with Freddy's voice speaking the kid's actual name
  - **Done when:** Jason hears the AHA reveal with his test-kid name spoken naturally; volume / quality acceptable

---

## P4 — Author Remaining Beats in Stately + Wire

For each beat, repeat the P1 vertical-slice pattern: Stately authoring → export → wire → smoke → inspect.

- [ ] **P4.1 — Beat 1 (Splash) authored + wired (J + C)**
  - Trivial linear; matches existing SplashScreen behavior
- [ ] **P4.2 — Beat 1.5 (Welcome Tour) authored + wired + counting mode UI (J + C)**
  - Counting interaction: tap pepperoni slices → counter increments; tap total → counter for denominator
  - Generate voice MP3s for new dialogue
- [ ] **P4.3 — Beat 2 (Sandbox) authored + wired + fraction-toast triggers (J + C)**
  - Most complex beat — free-form with many possible student actions
  - Generate voice MP3s
- [ ] **P4.4 — Beat 3 (First Guest) authored + wired + guest arrival animation (J + C)**
  - Generate voice MP3s
- [ ] **P4.5 — Beat 4 (Two Guests, Equal Share) authored + wired (J + C)**
  - Generate voice MP3s
- [ ] **P4.6 — Beat 6 (Check for Understanding) authored + wired + 2–3 check problems (J + C)**
  - Generate voice MP3s
- [ ] **P4.7 — Beat 7 (Win) authored + wired + celebration animation (J + C)**
  - Generate voice MP3s
- [ ] **P4.8 — Full-lesson playthrough smoke test (C)**
  - Playwright: enter name → automate the full happy path from splash to win → expect win state reached
  - **Done when:** Test passes within reasonable time (< 60s)
- [ ] **P4.9 — Visual inspection on iPad — full lesson splash → win (J)**
  - **Done when:** Jason completes the full lesson on real iPad without intervention; no crashes / jank

---

## P5 — Polish

- [ ] **P5.1 — Apply Superbuilders brand tokens (PT.5 + C)**
  - Update `tailwind.config.js` with real Superbuilders colors/fonts pulled from research
- [ ] **P5.2 — Midjourney prompt library drafted (C)**
  - Prompts for: Freddy 3–5 expressions, guests (3 chars × 3 expressions), CTA hero scene, restaurant backgrounds
  - Committed to `assets/midjourney-prompts.md`
- [ ] **P5.3 — Midjourney assets generated + placed in /public/images/ (J — see PT.2)**
  - Files in PRD §6 structure
- [ ] **P5.4 — Replace Freddy emoji with real Freddy SVG/PNG (C)**
- [ ] **P5.5 — Replace guest placeholders with real guest art (C)**
- [ ] **P5.6 — Landing CTA hero illustration in place (C)**
- [ ] **P5.7 — Re-integrate particles (C)**
  - Try `@tsparticles/react` with version pinning; fall back to DIY Framer Motion particles if blocked again
- [ ] **P5.8 — Slice particle effect (C)**
  - Cheese stretch + sauce splatter on every slice; tuned for "juicy" feel
- [ ] **P5.9 — Win confetti (C)**
  - Full-screen tsparticles confetti preset
- [ ] **P5.10 — Sound effects sourced + integrated (S)**
  - J sources from freesound.org / zapsplat: slice squelch, snap chime, win fanfare, tap pop
  - C wires into Howler at the right state-machine triggers
- [ ] **P5.11 — Framer Motion polish on hero moments (C)**
  - AHA: snap + glow + screen-flash pulse
  - Win: character bounce + camera shake
  - Counter tick (Beat 1.5): bounce + sparkle
- [ ] **P5.12 — Lottie integration for Freddy (stretch) (J + C)**
  - J finds/adapts a chef Lottie from LottieFiles; C wires `lottie-react`
- [ ] **P5.13 — Visual inspection — full lesson with polish (J)**
  - **Done when:** Jason confirms hero moments feel as alive as the Duolingo/Fruit Ninja reference bar

---

## P6 — Deliverables

- [ ] **P6.1 — iPad roadmap doc (C drafts, J reviews)**
  - Sketches + writeup: parent flow, child profile, audio check, dashboard, multi-child, future v2 features (variable denominators, more tutors in the SuperTutors family)
  - Committed to `deliverables/ipad-roadmap.md` (+ sketch PNGs)
- [ ] **P6.2 — Demo video script (C drafts, J reviews)**
  - 3–5 min walkthrough with screen + voiceover cues; structured as: opener → manipulative demo → AHA → win → architecture pitch
  - Committed to `deliverables/demo-video-script.md`
- [ ] **P6.3 — Demo video recorded (J)**
  - Use `?demo=true` beat-skip for clean takes
  - Upload to YouTube unlisted or similar; link in README
- [ ] **P6.4 — README polish (C)**
  - Setup instructions, technical decisions table, links to PRD sections + Stately URL + demo video URL
- [ ] **P6.5 — Final accessibility audit (C)**
  - Full Playwright + axe run; fix any new critical/serious issues
- [ ] **P6.6 — Final iPad-Safari device test (J)**
  - Walk through full lesson on real iPad; no crashes, no jank, audio works
- [ ] **P6.7 — Tag v1.0 commit + push (C)**
  - `git tag v1.0 -m "Demo-ready release"` and push
- [ ] **P6.8 — Submit to hiring partner (J)**
  - Friday 2026-05-22 noon — share URL, demo video, README link, GitLab + Stately URLs

---

## Cross-Cutting / Backlog

Pick up between phases as time allows. Not blocking the critical path.

- [ ] **CC.1 — Demo mode (?demo=true) with beat-skip keyboard shortcuts (C)**
  - 1–7 keys jump to each beat; shift+R resets
- [ ] **CC.2 — Session reset (tap-and-hold Freddy avatar) (C)**
- [ ] **CC.3 — Audio preloading (Beat N+1 loads while Beat N plays) (C)**
- [ ] **CC.4 — XState Inspector in dev mode (C)**
  - Behind URL flag; stripped in production
- [ ] **CC.5 — Web Speech API as ultimate audio fallback (C — backlog only)**
  - If ElevenLabs + IndexedDB both unreachable

---

## How to Use This File

- **Across chats:** This file is the canonical state. A new Claude session reads `PRD.md` + `TASKS.md` to ramp up in ~5 minutes.
- **Per session:** Pick a phase or sub-tasks; use TaskCreate to track in-session work; mark items here `[~]` while in flight and `[x]` when done; commit the update.
- **Commits:** Reference task IDs in commit messages (e.g., "P1.3: wire AudioEngine to dialogue.json").
- **Blocked:** Mark `[!]` with a note about what / who is blocking.
- **Disagreements:** Edit directly — this is a working doc, not a contract. Reflect changes in commits.

---

*Created 2026-05-19, planning round 13. Source of truth for delivery sequencing through Friday 2026-05-22 noon demo.*
