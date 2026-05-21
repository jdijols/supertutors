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

**Active phase:** P2 sandbox preview shipped end-to-end at `/preview/sandbox`. Both pizza variants complete: `pepperoni-v1` (15 PNGs) and `cheese-v1` (18 PNGs — adds 3 vertical-strip thirds for Beat 3 vocab). Tool assets complete: 5-finger palm-down white glove in 3 states (open, closed, pointing) + wood-handle chrome-blade pizza cutter in 2 states (upright, cutting), each with a 1000×1000 sprite + 64×64 cursor variant. Sandbox mechanics live: drag-to-move (glove), drag-to-cut + tap-to-cut (cutter fires on pointer-UP), 32px gap between sliced children, mozzarella-cream hover glow, triangle hit targets for eighths via clip-path, JS-driven `ToolSprite` cursor (OS cursor hidden), pointing-glove cursor over ToolPicker.

**Beat order updated (2026-05-19):** Sandbox/Explore now comes BEFORE Vocab (was Beat 1.5, now Beat 3) to match the project brief's *explore → instruct → check* model. Full updated order in [PRD §3.9](./PRD.md#39-lesson-arc--8-beats).

**Removed mechanic:** "Tap individual pepperoni discs" was eliminated 2026-05-20 — Beat 3 (Vocab) counts pizza SLICES that have pepperoni, not individual pepperoni discs on a slice.

**Cursor architecture pivot (2026-05-20):** Custom CSS cursor URLs silently failed to render in some regions on Chrome/macOS despite the computed style being correct on every element in the inheritance chain. Pivoted to a DOM-based `ToolSprite` component in `src/modules/world/` that follows the pointer with `pointer-events: none` and renders the tool art directly. OS cursor hidden via `cursor: none` on body. Total visual control, no browser cursor-engine quirks.

**Active session owner:** Jason → next chat for Stately Beat 6 authoring (PT.3); Claude → sandbox preview stable, awaiting next workstream.

**Blockers:** None on critical path. PT.4 (iPad) blocks iPad inspection only. PT.3 (Stately authoring) blocks P1.3 / Beat 6 wiring.

**Safeguard:** Beat 6 (AHA — was Beat 5 in old numbering) must be authored + wired by end-of-day Thursday 2026-05-21. If tracking behind by Thursday morning, jump-skip to Beat 6 next to lock the demo hero.

---

## OVERNIGHT — 2026-05-21 (CV Physical Mode pivot, autonomous loop)

> Pivot decision + full context in [`Journals/May-21-0308-cv-pivot-overnight.md`](./Journals/May-21-0308-cv-pivot-overnight.md). Hybrid pivot: keep polished SuperSlice, ADD a CV "physical mode" via MediaPipe Hands so the kid slices pizzas with webcam-tracked hand gestures. Ship by noon CDT 2026-05-21.
>
> **Ship-ready invariant:** every commit must leave `main` deployable.
> **Soft fallback gate at 07:00 CDT:** if OVN.2 (HandTracker) or OVN.3 (pinch recognizer) are still red, trigger OVN.11 (abandon CV, switch to polish).
> **Hard stop at 11:00 CDT:** write a handoff journal regardless.
> **Commit format:** `[OVN.N] {what shipped}` — one task per commit.

- [x] **OVN.1 — Install MediaPipe + scaffold cv module (C, loop)**
  - `npm install @mediapipe/tasks-vision`
  - Create `src/modules/cv/index.ts` (placeholder export) + `src/modules/cv/README.md` (one-paragraph overview)
  - Confirm `npm run build` still passes after install (MediaPipe should not break bundling — if it does, mark for dynamic import only).
  - **Done when:** package.json updated, build green, committed as `[OVN.1] install MediaPipe tasks-vision + scaffold cv module`

- [x] **OVN.2 — HandTracker component + /preview/cv route (C, loop)**
  - `src/modules/cv/HandTracker.tsx` — opens webcam via `getUserMedia({ video: true })`, lazy-loads `HandLandmarker` from MediaPipe, runs detection loop via `requestAnimationFrame`. Exposes a `useHandLandmarks()` hook returning the latest 21 landmarks per detected hand (left/right tagged).
  - Cleanup on unmount: stop MediaStream tracks, close MediaPipe runtime.
  - New preview route `/preview/cv` in `src/main.tsx` router — renders the webcam feed (mirrored) with an SVG overlay drawing the 21 landmarks as dots + the skeleton edges.
  - **Done when:** `/preview/cv` shows live webcam + landmark overlay; `npm run build` passes; committed as `[OVN.2] HandTracker + /preview/cv route`

- [x] **OVN.3 — Pinch gesture recognizer (C, loop)**
  - `src/modules/cv/gestures.ts` — pure logic. `detectPinch(landmarks): { isPinching: boolean, pinchCenter: { x, y }, strength: number }`. Strength = inverse of normalized distance between thumb tip (landmark 4) and index tip (landmark 8), normalized by palm width (landmark 0 ↔ 9).
  - Hysteresis: enter pinch when strength > 0.7, exit when < 0.4 (avoid jitter at threshold).
  - Exponential smoothing on `pinchCenter` with alpha = 0.4.
  - Unit tests at `src/modules/cv/gestures.test.ts` covering: open hand (no pinch), tight pinch (pinching), drift across threshold (hysteresis holds), palm rotation invariance.
  - Wire to `/preview/cv` — show a live "PINCHING" badge in mozzarella-cream when active.
  - **Done when:** unit tests green, badge visible on `/preview/cv`, committed as `[OVN.3] pinch recognizer with hysteresis + tests`

- [x] **OVN.4 — CV→pointer event bridge (C, loop)**
  - `src/modules/cv/usePointerFromHand.ts` — hook that takes the pinch state + center and dispatches synthetic `pointerdown` / `pointermove` / `pointerup` events on the element under the pinch coords (via `document.elementFromPoint`).
  - Coordinate mapping: webcam-normalized [0,1] → viewport pixels, mirrored on X (webcam is mirrored). Calibration constants tunable via a small overlay.
  - Pure unit tests for the mapping at `src/modules/cv/usePointerFromHand.test.ts`.
  - In `/preview/cv`, add a draggable test box that responds to pinch+drag.
  - **Done when:** tests green, pinch-drag visibly moves the test box on `/preview/cv`, committed as `[OVN.4] CV→pointer bridge`

- [x] **OVN.5 — Integrate with /preview/sandbox via ?cv=true (C, loop)**
  - In `src/modules/preview/SandboxPreview.tsx`, read `?cv=true` query flag. When set: mount `HandTracker` + `usePointerFromHand`, render a small mirrored webcam preview in the corner (`opacity: 0.5`, ~160px wide).
  - With `toolMode === 'cutter'`: pinch + drag across a piece = slice on release (reuses the existing pointerup-driven slice path — no changes to slice logic itself).
  - With `toolMode === 'glove'`: pinch + drag piece = move.
  - **Done when:** local recording shows a pizza being sliced via hand gesture, no cursor touched; committed as `[OVN.5] CV mode wired into /preview/sandbox`

- [x] **OVN.6 — ToolPicker CV-mode toggle (C, loop)**
  - Add a third button to `src/modules/world/ToolPicker.tsx`: "🖐️ Hands" (or final label TBD). Active state mirrors the existing glove/cutter chrome.
  - Tapping it: enables CV mode (sets a Zustand flag), prompts for webcam permission if first time.
  - Toggle also accessible via the `?cv=true` flag (URL persists state).
  - **Done when:** UI complete, axe a11y pass, button works in both `/preview/sandbox` and `/lesson`; committed as `[OVN.6] ToolPicker CV-mode toggle`

- [x] **OVN.7 — Privacy notice + permission flow (C, loop)**
  - One-time inline notice on first CV-mode activation: "SuperSlice uses your camera to track hand gestures. No video is recorded or sent anywhere — all processing happens on your device."
  - Browser-native `getUserMedia` permission flow.
  - Graceful failure: if denied, show "Hand tracking unavailable" + revert to cursor mode (don't crash).
  - Privacy notice text isolated in a constant so it's easy to revise.
  - **Done when:** permission denial doesn't crash; notice appears exactly once per session; committed as `[OVN.7] privacy notice + permission flow`

- [x] **OVN.8 — Visual feedback for hand position (C, loop)**
  - Subtle on-canvas overlay (rendered in a fixed div over the table): dot at index fingertip, faint line between thumb+index, color shifts mozzarella-cream → oven-glow when pinching.
  - Don't render the full skeleton in lesson mode — too distracting. Only render in `/preview/cv`.
  - Small mirrored webcam preview thumbnail bottom-right at `opacity: 0.4`.
  - **Done when:** hand position is visually clear without being distracting; committed as `[OVN.8] visual feedback for CV cursor`

- [x] **OVN.9 — README CV-mode section + portfolio framing (C, loop)**
  - New top-level section in `README.md` (after the intro, before the tech stack): "🎥 CV mode (BEMO-style physical interaction)".
  - One-paragraph framing: "Slice pizzas with your hands. Webcam + MediaPipe Hands in browser. No installs, no server, no data leaves your device. Inspired by Patrick Skinner's work on BEMO."
  - Bullet links: live preview URL, MediaPipe docs, Patrick's brainlift.
  - GIF embed if a clean recording is achievable from `/preview/sandbox?cv=true` (skip if it'd block the loop).
  - **Done when:** README reads well from the top; committed as `[OVN.9] README CV mode section`

- [x] **OVN.10 — Deploy + verify (C, loop)**
  - `git push` → Vercel preview updates automatically.
  - Curl the preview URL to verify it returns 200 + HTML.
  - Curl `/preview/sandbox?cv=true` to verify the route exists.
  - Note the live preview URL in the handoff journal.
  - **Done when:** Vercel deployment succeeds; preview URL works; committed as `[OVN.10] deploy + verify` (if any deploy-config tweaks were needed)

- [ ] **OVN.11 — Fallback to polish-only (C, loop, conditional)**
  - **Trigger:** OVN.2 or OVN.3 are still red past 07:00 CDT.
  - Abandon the CV branch (don't merge OVN.5+ work). Spend remaining hours polishing SuperSlice for the noon demo: AHA animation refinement, sound, README cleanup, Vercel deploy, README without CV section.
  - Document the abandonment in the handoff journal with cause + what was tried.
  - **Done when:** decision documented in handoff journal, OR not triggered.

- [ ] **OVN.12 — Handoff journal + hard stop (C, loop)**
  - **Trigger:** 11:00 CDT regardless of remaining task state.
  - Write `Journals/May-21-{time}-overnight-handoff.md` with: tasks shipped, tasks remaining, current deployable Vercel URL, anything broken, recommended last-hour actions for Jason.
  - Commit + push the handoff journal.
  - Stop the loop.
  - **Done when:** handoff journal exists on `main`, loop terminated.

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
  - Beat 6 (AHA — old "Beat 5" in pre-2026-05-19 numbering) fully authored with all wrong-answer recoveries in Jersey-Shore voice (continuing from the C-drafted skeleton). Internal `aha_*` dialogue keys + state-machine `aha:` state name kept as-is to avoid invalidating the 11 already-generated MP3s.
  - Then Beats 1, 2 (Sandbox), 3 (Vocab), 4 (First Guest), 5 (Two Guests), 7 (Check), 8 (Win) as P4 sub-tasks unlock.
  - **Done when:** Stately machine exports cleanly to XState v5 TS for each beat; URL is public-shareable
  - **Blocks:** P1 (Beat 6 vertical slice), P4 (rest of beats)

- [ ] **PT.4 — Physical iPad in hand (J)**
  - For real-device testing of touch, viewport, audio playback
  - **Done when:** an iPad is on the desk and ready to test
  - **Blocks:** all iPad inspection tasks across P1+
  - **Target:** end of day Wednesday 2026-05-20

- [x] **PT.5 — Superbuilders brand research (S — C does the research, J validates)**
  - Pulled from https://jobs.superbuilders.dev/jobs; `sb:` token namespace lives in [tailwind.config.js](./tailwind.config.js) with ink/surface/card/border/muted/accent + warm-bridge paper tokens. Brand notes in [PRD §2.3](./PRD.md#23-visual-language). Mono pair (Geist Mono / Inter / PP Variant Mono placeholder) registered. Lesson UI chrome warmed via paper tokens across commits `7e31f25` and `b0ba1a2`.

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

- [x] **P1.3 — Wire AudioEngine to dialogue.json (C)** *(shipped 2026-05-20)*
  - AudioEngine itself shipped earlier in P3.6 (Howler-backed sequential stitching with fire-immediately failure semantics so the machine never blocks).
  - This pass wires `audioEngine.play()` into `tutorMachine.ts`'s `playDialogue` action: action reads `context.name`, uses `lineHasNameSlot(key)` to detect name-injection lines, and calls `self.send({ type: "DIALOGUE_DONE" })` from the `onDone` callback. Added `createTutorMachine({ audioEngine })` factory + `SET_NAME` event + `input` wiring so LessonView can hydrate name on actor start.
  - Also added `stopDialogue` action firing on `RESET` so audio doesn't bleed across restarts.
  - 10 unit tests at `src/modules/tutor/tutorMachine.test.ts`: initial play call (with input.name), SET_NAME mid-session, default `lineHasNameSlot`, DIALOGUE_DONE advancing, correct/wrong slice branching, full happy path through `aha_triggered → celebrating → done → check`, `not_equal` retry loop, RESET stopping audio, audio-failure non-blocking path.

- [x] **P1.4 — Wire state machine to React via @xstate/react (C)** *(shipped 2026-05-20)*
  - `LessonView` is now two-phase: an onboarding stretch (local state, unchanged) and a lesson stretch (`LessonMachineRoot` mounted after `onboarding_response` audio completes). The machine hydrates with `input.name` so the very first `aha_setup` play interpolates the kid's name.
  - Bubble text derives from `dialogueKeyForState(state.value)` — pure mapping from state value → `DialogueKey`, no duplicated strings on the machine config. Idle waits + animation + terminal states return null so the bubble closes between lines.
  - Hidden `LessonDevControls` (visible only in demo mode) fires SLICED 1/2 + 1/4, PROXIMITY equal + not_equal, ANIMATION_DONE, RESET. State value shown live at the top of the control panel.
  - `?beat=aha` URL flag (handed off from CC.1's demo mode) sends RESET so key "6" re-enters Beat 6 cleanly.
  - 8 new unit tests at `src/modules/tutor/dialogueForState.test.ts` cover the state→key mapping. Live-verified in `/lesson?demo=true`: tapped greeting → submitted name "TestKid" → SLICED 1/2 → PROXIMITY equal → ANIMATION_DONE walked the machine from `aha.setup` through `aha.done` to top-level `check`. Final bubble correctly read "Whoa, TestKid! Look at that — one half is the SAME as two quarters! You just made fr…".

- [x] **P1.5 — Beat 6 happy-path Playwright smoke test (C)** *(shipped 2026-05-21)*
  - `e2e/beat-6-aha.spec.ts` — two cases: (1) full happy path setup → SLICED 1/2 → compare prompt → PROXIMITY equal → aha_triggered → ANIMATION_DONE → celebrating (assert hero line "Whoa, TestKid! …" rendered) → top-level `check`. (2) wrong-slice recovery: SLICED 1/4 → wrong_slice → recovery audio fires DIALOGUE_DONE → back to waiting_for_slice.
  - `beforeEach` regex-routes `/audio/*.mp3` + `/api/voice` to 404 so AudioEngine's fire-immediately-on-failure path drives DIALOGUE_DONE deterministically — keeps the test off real MP3 durations.
  - Helper `enterLessonWithDemo` navigates via the landing CTA (direct page-load of `/lesson` leaves framer-motion's bubble animation stuck at the `initial` style — pre-existing condition reproducible in the dev preview; SPA nav from `/` clears it). Notes captured inline in the spec.

- [ ] **P1.6 — Visual inspection on iPad (J — depends on PT.4)**
  - Open Vercel preview URL on real iPad Safari
  - Walk through Beat 5 via dev console buttons
  - Verify: 44pt tap targets, viewport locked, no scroll bounce, audio plays (or text fallback if no audio yet)
  - **Done when:** Jason confirms Beat 5 plays end-to-end on real iPad Safari

---

## P2 — Pizza Manipulative + Slicer + Drag-to-Compare

Goal: the Table workspace becomes real. The hero gesture works.

- [x] **P2.1 — Pizza component (raster) (C)**
  - Originally scoped as procedural SVG; pivoted to raster on 2026-05-19 after the SVG aesthetic couldn't match Freddy's Pixar style.
  - Shipped: `src/modules/table/Pizza.tsx` renders `<img>` from a `src` prop with optional `fraction` (1, 1/2, 1/3, 1/4, 1/8) and width/height. Asset-agnostic — works with any PNG.
  - Asset matrices complete:
    - `pepperoni-v1` (15 PNGs): whole, half-left/right, quarter-tl/tr/bl/br, eighth-{tl,tr,bl,br}-{t,r,b,l}
    - `cheese-v1` (18 PNGs): same matrix + 3 vertical-strip thirds (third-left/center/right) for Beat 3 vocab. Thirds are display-only — NOT part of the bisect slicing tree.
  - Unit tests green at `src/modules/table/Pizza.test.tsx`; visual preview at [/preview/pizza](src/modules/preview/PizzaPreview.tsx) (both variants); in-scene preview at [/preview/scene](src/modules/preview/PizzaInScene.tsx).

- [x] **P2.2 — Slice (Piece) component (C)** *(shipped 2026-05-20 as PizzaPiece)*
  - `src/modules/table/PizzaPiece.tsx` — draggable wrapper around `Pizza` with two-layer architecture: visual layer (drop-shadow glow, no clip-path, pointer-events: none) + interactive layer (clip-path for triangle hit targets on eighths, captures drag/tap/hover). Both share `x`/`y` motion values for synced position.
  - Manual viewport clamping in `onDrag` (framer-motion's built-in dragConstraints was unreliable on top/bottom in our setup).
  - Tap-after-drag suppression via `dragMovedRef`.
  - **Done:** unit tests green; drag-to-move works in `/preview/sandbox`.

- [x] **P2.3 — Slicer tool — bisect mechanic (C)** *(shipped 2026-05-20)*
  - When `toolMode === 'cutter'`, drag-to-cut and tap-to-cut both work. Cut materializes on pointer-UP (not during drag) — realistic "roll the cutter, release, cut appears" feel.
  - Window-level `pointermove` listener tracks the first piece the cursor crosses during a press, slices it on `pointerup`. Click-after-drag suppression flag prevents double-slicing.
  - Slice geometry (`src/modules/table/sliceLogic.ts`): children spawn at parent's area split with 32px gap. Whole→halves splits left/right with `parent.width/2 + halfGap` offset; half→quarters splits top/bottom; quarter→eighths uses "corner-pair" diagonal scheme so triangles don't overlap into X-pattern recombination.
  - **Done:** unit tests green; full whole→halves→quarters→eighths slicing works in `/preview/sandbox`.

- [x] **P2.4 — Glove tool — grab/move (C)** *(shipped 2026-05-20)*
  - When `toolMode === 'glove'`, pieces are draggable; on cutter mode they're not (slicer-only).
  - Drag uses motion-value-driven transform (not `left`/`top`) to avoid double-positioning with framer-motion's drag transforms.
  - Manual viewport clamp keeps pieces fully on-screen on all 4 edges (24px top buffer, exact viewport elsewhere).
  - **Done:** drag-to-move works smoothly with no inertia/momentum at any drag speed.

- [x] **P2.5 — ToolPicker UI (C)** *(shipped 2026-05-20)*
  - Two-button picker in `src/modules/world/ToolPicker.tsx`. Real artwork (open-glove + upright-cutter thumbnails) replaces the emoji placeholders.
  - `data-cursor-pointing` attribute triggers the pointing-glove cursor override when hovering the picker.
  - **Done:** axe a11y checks pass; visible active state for selected tool.

- [x] **P2.6 — Proximity detection (C)** *(shipped 2026-05-20)*
  - `src/modules/table/proximity.ts` — pure logic: `findProximityGroups` runs union-find over a 20px-threshold edge-to-edge gap graph, then computes total fractional area + an `equal | not_equal` partition decision via brute-force subset-sum (N ≤ 8 fine). Threshold tunable per call.
  - "Equal" means: cluster admits a partition into two non-empty subsets with the same total area. For the AHA cluster `{1/4, 1/4, 1/2}` the partition `{{1/4,1/4}, {1/2}}` makes it equal — Beat 6 hero condition.
  - 22 unit tests at `src/modules/table/proximity.test.ts` covering: gap math (overlap/touch/diagonal/custom threshold), `admitsEqualPartition` (AHA cluster, mismatch, eighth combinations), `findProximityGroups` (singletons, transitive grouping, two distant clusters, custom threshold).
  - Live overlay wired into `/preview/sandbox`: `≡` badge (basil-green) over equal clusters, `≠` (oven-glow) over mismatched. `data-proximity-comparison` + `data-proximity-piece-ids` attrs for Playwright assertion. Beat 6 wiring will subscribe to the same `findProximityGroups` output via the Brain instead of this overlay.

- [x] **P2.7 — Toast / CounterDisplay (C)** *(toast shipped 2026-05-20; counter UI deferred)*
  - `src/modules/toast/Toast.tsx` — auto-dismissing toast with spring entrance + fade. Fires on every slice with the resulting fraction text ("You made halves! 1/2", "Now quarters! 1/4", "Eighths! 1/8") via `fractionToastMessage(fraction, isFirstTime)`. First-time copy upgrades to "Now {kind}!" on repeat.
  - Beat 3 vocab counter UI (`CounterDisplay`) intentionally deferred — different mechanic; will land with Beat 3 wiring.

- [x] **P2.8 — Guest component placeholder (C — final art in P5)** *(shipped 2026-05-21)*
  - `src/modules/world/Guest.tsx` renders `<img src="/images/characters/guests/<id>-<expression>.png">` with an `onError` fallback to a styled placeholder — colored circle (per-guest tint) + first-initial + expression ASCII face (`:|`, `:(`, `:D`) + name caption. When PT.2 ships PNGs to the canonical paths, the placeholder disappears with zero code change.
  - 5 unit tests at `src/modules/world/Guest.test.tsx`: correct asset path per expression, fallback on `onError`, displayName defaults, data-attribute targeting.
  - `GuestPreview` at `/preview/guests` renders the full 3 guests × 3 expressions matrix (9 cells) for visual inspection. Live-verified — all 9 cells render in placeholder state.

- [x] **P2.9 — Freddy avatar (C)** *(shipped earlier; final art in place)*
  - Real Freddy art rendered in `RestaurantScene` + `FreddyCharacter`. Not a placeholder — these are the production assets.

- [x] **P2.12 — Tool sprite + cursor system (C)** *(shipped 2026-05-20, not originally scoped)*
  - `src/modules/world/ToolSprite.tsx` — DOM-based pointer-following sprite that replaces the OS cursor (hidden via `cursor: none` in `globals.css`). Updates `style.transform` directly on every `pointermove` for zero render lag.
  - Variant logic: glove (open/closed) + cutter (upright/cutting) + pointing-glove when hovering `[data-cursor-pointing]` elements.
  - Replaces an earlier CSS-cursor approach that Chrome on macOS silently failed to render in certain regions despite computed styles being correct.

- [x] **P2.10 — Smoke test: slice + compare (C)** *(shipped 2026-05-20)*
  - `e2e/sandbox-proximity.spec.ts` drives `/preview/sandbox`: switch to cutter → click pizza to slice into halves → assert 2 pieces with no proximity indicator (32px gap > 20px default) → switch to glove → real native mouse drag to bring halves within 10px → assert the `≡` indicator with `data-proximity-comparison="equal"` appears.
  - Chrome-only — iPad Safari emulation can't drive framer-motion's `setPointerCapture` from synthesized touch events. Real-iPad coverage of the drag flow ships via PT.4. Test uses `test.skip` with the rationale documented inline.
  - Also fixed two pre-existing test regressions discovered along the way: smoke spec referenced the old "pick a tutor" heading + aria-disabled placeholder cards (both gone in the bento landing redesign); a11y spec flagged two color-contrast violations (`text-sb-accent-deep` on name-input label, `text-sb-subtle` on "A SuperBuilders project" caption, `text-sb-muted` on the "Coming next" pills) — bumped to `text-sb-ink` / `text-sb-ink/70` so axe passes WCAG AA on both `desktop-chrome` and `ipad-safari`.

- [ ] **P2.11 — Visual inspection on iPad (J)**
  - On iPad: slice pizzas, drag pieces, see proximity feedback
  - Tune proximity threshold if too tight/loose
  - **Done when:** Jason confirms manipulative feels responsive and the gesture vocabulary is intuitive

---

## P3 — Voice Pipeline Live

Goal: real ElevenLabs voice playing in the lesson, with name personalization.

> **Voice pipeline status (2026-05-20):** Fully shipped to production. Onboarding bubbles in `/lesson` play matching audio; static MP3s served from `/audio/`; runtime name MP3s fetched from `/api/voice`. Verified via curl against https://supertutors.vercel.app. Beat 6 (AHA) MP3s exist on disk and are wired through `AudioEngine`, awaiting state-machine hookup (P1.3 → PT.3 Stately authoring).

> **Local-dev gotcha:** `npm run dev` (Vite) does NOT serve Edge Functions — `POST /api/voice` returns 404 in dev. To exercise the full name-stitching path locally, use `vercel dev` instead. The AudioEngine handles the 404 gracefully (fires `onDone` so the lesson never hangs), but the name segment won't actually play in `npm run dev`. Static-only audio playback (greeting, AHA static lines) works fine in both.

> **QA page:** `/preview/voice` — lists every dialogue line with a per-row play button. Use to A/B test voices without walking through the lesson.

- [x] **P3.1 — ElevenLabs voice ID committed (J — see PT.1)**
  - `QzTKubutNn9TjrB7Xb2Q` committed and added to Jason's ElevenLabs library

- [x] **P3.2 — Vercel env vars set (J)**
  - `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` set for Production + Preview + Development
  - Pulled to local `.env.local` via `vercel env pull` (gitignored)
  - **Verified:** `vercel env ls` shows both vars in all three environments

- [x] **P3.3 — Implement generate-voice.ts (C)**
  - Reads `dialogue.json`; splits lines at `{{NAME}}`; calls ElevenLabs for each segment
  - Saves MP3s to `/public/audio/<key>.mp3` (or `<key>_a.mp3` + `<key>_b.mp3` for name-split lines)
  - Idempotent — skips regen if MP3 unchanged
  - **Shipped 2026-05-19:** Script at `scripts/generate-voice.ts`. Split logic extracted to `src/lib/dialogueSplit.ts` (6 unit tests green). Manifest at `public/audio/.manifest.json` (sha256 per segment) + incremental writes so mid-loop failures don't re-cost on retry + auto-pruning of stale entries. Runs on Node 25 native TS stripping — no new deps. 13 MP3s currently on disk (2 onboarding + 11 Beat 6 segments).

- [x] **P3.4 — Implement Edge Function fully (C)**
  - `api/voice.ts`: validate name, call ElevenLabs, return MP3 blob
  - **Shipped 2026-05-19:** Validation extracted to `src/lib/voiceProxyValidation.ts` (14 unit tests green). `api/voice.ts` is a thin handler delegating to validators. Status codes: 200 audio/mpeg, 400 (bad name), 405 (non-POST), 415 (non-JSON), 502 (ElevenLabs upstream), 503 (env missing). Production-verified via curl: `POST /api/voice {"name":"Jason"}` → `200 audio/mpeg 14254b`.

- [x] **P3.5 — IndexedDB name cache (C)**
  - `src/modules/audio/nameAudioCache.ts`: get/set by name key
  - Falls back to fetch from `/api/voice` if not cached
  - **Shipped 2026-05-19:** DI-based design — `NameAudioCache` interface, `InMemoryNameAudioCache` for tests, `IndexedDbNameAudioCache` for prod, `getNameAudioUrl(name, deps)` entry point with cache-or-fetch flow. 7 unit tests green. Names normalized (trim + lowercase) so spelling variants share an MP3.

- [x] **P3.6 — Audio Engine sequential stitching (C)**
  - For name-injected lines, queue [pre-gen A] → [name MP3] → [pre-gen B] via Howler
  - **Shipped 2026-05-19:** `AudioEngine` class in `src/modules/audio/AudioEngine.ts`. Howler-backed sequential playback, DI-friendly (createHowl + resolveNameUrl injectable). Segment-failure tolerance (fires onDone if any segment fails to load/play), generation counter so `stop()` and overlapping `play()` cancel stale sequences. 8 unit tests green. **Outstanding:** integration test against full Beat 6 sequence — gated on P1.3 wiring `AudioEngine.play()` from XState `playDialogue` action.

- [ ] **P3.7 — Smoke test: voice playback (C — deferred)**
  - Playwright: enter name, navigate to Beat 6, expect HTMLAudioElement to play (or `/api/voice` to return 200 + audio/mpeg)
  - **Deferred 2026-05-20:** Production manually verified end-to-end (onboarding flow + `/api/voice` curl). Automating this needs either `vercel dev` in CI or hitting the live deploy. Re-prioritize when Beat 6 is wired through XState — running Playwright against `/lesson` then becomes the higher-value test.

- [ ] **P3.8 — Visual + audio inspection on iPad (J — blocked on PT.4)**
  - Beat 6 played on iPad with Freddy's voice speaking the kid's actual name
  - **Done when:** Jason hears the AHA reveal with his test-kid name spoken naturally; volume / quality acceptable

---

## P4 — Author Remaining Beats in Stately + Wire

For each beat, repeat the P1 vertical-slice pattern: Stately authoring → export → wire → smoke → inspect.

> **Beat-numbering note (2026-05-19):** P4 entries below use the OLD beat numbering (Beat 1.5 = Welcome Tour, Beat 2 = Sandbox, etc.). Under the updated order ([PRD §3.9](./PRD.md#39-lesson-arc--8-beats)) Sandbox is now Beat 2 (was 2), Vocab is Beat 3 (was 1.5), guests are Beats 4–5 (were 3–4), AHA is Beat 6 (was 5), Check is Beat 7 (was 6), Win is Beat 8 (was 7). Renames will land alongside the actual Stately authoring.

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
- [x] **P5.2 — Midjourney prompt library drafted (C)** *(shipped 2026-05-20)*
  - Freddy + restaurant + CTA hero already drafted; this pass filled in the guest section: 3 characters (Maya / Theo / Nonna Lucia) × 3 expressions (neutral / smile / frown) = 9 prompts. Persona one-liners locked at the top so the ChatGPT thread treats each guest as a continuous character through their 3 generations.
  - Staging notes call out the chef's-POV composition — guests need only head/shoulders/upper-torso since the counter mask cuts them at waist height.
  - Asset destination table maps each prompt to `public/images/characters/guests/<guest>-<expression>.png` to match the existing Freddy asset shape.
  - Off-model recovery prompt included for when ChatGPT drifts mid-thread.
- [ ] **P5.3 — Midjourney assets generated + placed in /public/images/ (J — see PT.2)**
  - Files in PRD §6 structure
- [ ] **P5.4 — Replace Freddy emoji with real Freddy SVG/PNG (C)**
- [ ] **P5.5 — Replace guest placeholders with real guest art (C)**
- [ ] **P5.6 — Landing CTA hero illustration in place (C)**
- [x] **P5.7 — Re-integrate particles (C)** *(shipped 2026-05-21 — DIY Framer Motion used for P5.8 + P5.9 instead; tsparticles not needed)*
  - Fell back to DIY Framer Motion; no new dependency needed
- [x] **P5.8 — Slice particle effect (C)** *(shipped 2026-05-21)*
  - Cheese stretch + sauce splatter on every slice; tuned for "juicy" feel
- [x] **P5.9 — Win confetti (C)** *(shipped 2026-05-21)*
  - DIY Framer Motion particles (mozzarella/oven-glow/basil/terracotta) — no extra deps. Key 8 / ?beat=win triggers demo jump.
- [ ] **P5.10 — Sound effects sourced + integrated (S)**
  - J sources from freesound.org / zapsplat: slice squelch, snap chime, win fanfare, tap pop
  - C wires into Howler at the right state-machine triggers
- [~] **P5.11 — Framer Motion polish on hero moments (C)** *(AHA + Win shipped 2026-05-21; Counter still pending)*
  - **AHA done** — `src/modules/lesson/AhaAnimation.tsx` renders three stacked Framer Motion layers when state enters `aha.aha_triggered`: (1) mozzarella-cream screen flash that punches in then fades, (2) oven-glow radial pulse expanding from center, (3) bold `≡` mark scaling in with a slight rotate-into-place. After 1500ms it auto-fires `ANIMATION_DONE` so the machine advances to `celebrating` (which plays the reveal line). Cluster-anchored positioning + cheese-stretch particles still TBD when the lesson Table lands.
  - **Win, Counter** — still TBD, will follow the same pattern once Beat 8 (Win) + Beat 3 (Vocab) are authored.
- [ ] **P5.12 — Lottie integration for Freddy (stretch) (J + C)**
  - J finds/adapts a chef Lottie from LottieFiles; C wires `lottie-react`
- [ ] **P5.13 — Visual inspection — full lesson with polish (J)**
  - **Done when:** Jason confirms hero moments feel as alive as the Duolingo/Fruit Ninja reference bar

---

## P6 — Deliverables

- [x] **P6.1 — iPad roadmap doc (C drafts, J reviews)**
  - Sketches + writeup: parent flow, child profile, audio check, dashboard, multi-child, future v2 features (variable denominators, more tutors in the SuperTutors family)
  - Committed to `deliverables/ipad-roadmap.md` (+ sketch PNGs)
- [x] **P6.2 — Demo video script (C drafts, J reviews)**
  - 3–5 min walkthrough with screen + voiceover cues; structured as: opener → manipulative demo → AHA → win → architecture pitch
  - Committed to `deliverables/demo-video-script.md`
- [ ] **P6.3 — Demo video recorded (J)**
  - Use `?demo=true` beat-skip for clean takes
  - Upload to YouTube unlisted or similar; link in README
- [x] **P6.4 — README polish (C)**
  - Setup instructions, technical decisions table, links to PRD sections + Stately URL + demo video URL
- [x] **P6.5 — Final accessibility audit (C)** *(shipped 2026-05-21 — all 10 axe WCAG 2.1 AA checks pass on Chrome + iPad Safari)*
  - Full Playwright + axe run; fix any new critical/serious issues
- [ ] **P6.6 — Final iPad-Safari device test (J)**
  - Walk through full lesson on real iPad; no crashes, no jank, audio works
- [x] **P6.7 — Tag v1.0 commit + push (C)**
  - `git tag v1.0 -m "Demo-ready release"` and push
- [ ] **P6.8 — Submit to hiring partner (J)**
  - Friday 2026-05-22 noon — share URL, demo video, README link, GitLab + Stately URLs

---

## Cross-Cutting / Backlog

Pick up between phases as time allows. Not blocking the critical path.

- [x] **CC.1 — Demo mode (?demo=true) with beat-skip keyboard shortcuts (C)** *(shipped 2026-05-20)*
  - `?demo=true` on any URL flips on demo mode; persisted to `sessionStorage` so it survives navigation. `?demo=false` clears it. Mounted in `App.tsx` so the keyboard listener is global.
  - Keys 1–8 jump to each beat target: 1 → `/`, 2 → `/preview/sandbox`, 3 → `/lesson?beat=welcomeTour`, 4 → `firstGuest`, 5 → `twoGuests`, **6 → `/lesson?beat=aha` (demo hero)**, 7 → `check`, 8 → `win`. Shift+R hard-reloads. Inputs/textareas/contenteditable are excluded so name-entry isn't hijacked.
  - `DemoBadge` floats at bottom-center so the active state is obvious during demo-video takes.
  - 10 unit tests at `src/lib/demoMode.test.ts` covering all 8 beat targets, URL building, query encoding, the `?demo=true`/`?demo=false` flow, and sessionStorage persistence. Live-verified via preview: badge renders, key "2" navigated to `/preview/sandbox`, key "6" navigated to `/lesson?beat=aha`, badge persisted across both navigations.
- [x] **CC.2 — Session reset (tap-and-hold Freddy avatar) (C)** *(shipped 2026-05-20)*
  - `useHoldToReset({ ref, onReset, holdMs })` hook in `src/lib/useHoldToReset.ts` — tracks `isHolding` + 0–1 `progress` via rAF, fires `onReset` once at completion, cancels on pointerup/leave/cancel. Listener identity stable across `onReset` changes via a ref so mid-hold parent re-renders don't tear down listeners.
  - Wired into both `LessonView` (resets the zustand store + onboarding state + stops audio) and `SandboxPreview` (re-runs the existing `handleReset` to roll pieces + seen-fractions + toast back to initial). Invisible hit-area `[data-testid="freddy-hold-target"]` sits over Freddy's head/torso so manipulative pieces dragged across his lower body don't trigger it.
  - Subtle "Restart in Ns" indicator surfaces once `progress > 0.25` — discoverable mid-hold without distracting kids who aren't using the gesture.
  - 6 unit tests at `src/lib/useHoldToReset.test.tsx`: full hold fires, early release cancels, pointerleave cancels, pointercancel cancels, single-fire per hold, re-arms after completion. Live-verified at `/preview/sandbox`: pizza sliced into 2 halves → hold gesture → reset fires → back to 1 whole.
- [ ] **CC.3 — Audio preloading (Beat N+1 loads while Beat N plays) (C)**
- [x] **CC.4 — XState Inspector in dev mode (C)** *(shipped 2026-05-20)*
  - `@statelyai/inspect` installed as a devDependency. `getInspectorOption()` in `src/lib/inspector.ts` reads `?inspect=true`, lazy-creates a `createBrowserInspector` on first use, and returns the `inspect` function — or `undefined` when disabled. Threaded through `useMachine(tutorMachine, { input, inspect: getInspectorOption() })` in `LessonMachineRoot`.
  - Stack with the rest of the URL flags: `?inspect=true&demo=true` opens demo controls + the live Stately inspector window in one shot. Auto-no-op when disabled so production builds aren't affected.
  - 3 unit tests at `src/lib/inspector.test.ts` covering the URL flag detection + the disabled-default path. Inspector instantiation itself isn't unit-tested because `createBrowserInspector` opens a real popup pointed at stately.ai/inspect — verification of the inspector UI is manual via the browser.
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
