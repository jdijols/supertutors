# May 21, 2026 at 2:48 AM — Pre-pivot stop, 12 tasks shipped

> **STOPPING ABRUPTLY HERE.** Jason has new information that's prompting a pivot in a fresh chat. This entry captures the session state so the next chat can ramp without re-discovering everything. Nothing committed — all work sits as uncommitted edits on `main`. Read **Next Steps** first.

## TL;DR

Single overnight session that started ~9:45 PM Wednesday May 20 and ran past midnight into early Thursday May 21. Goal: roll through everything in `TASKS.md` that wasn't blocked by Jason's parallel tracks (Stately authoring, iPad acquisition, asset gen), so Jason has "more to test tomorrow." Shipped 12 tasks across proximity detection, audio-state-machine wiring, demo mode, hold-to-reset, AHA hero animation, Beat 6 playwright coverage, guest placeholders, XState inspector, and the Midjourney guest prompts. **178 unit + 17 e2e tests green; typecheck clean. Nothing committed.** Stopping mid-flight to pivot.

## Decisions

- **Defer CC.4 (XState Inspector) until after P1.4 (useMachine wiring)** — Inspector has no actor to inspect until LessonView mounts the machine. Reordered work to ship them in the right sequence (then CC.4 plugged in trivially).
- **Skip iPad Safari for the slice+compare Playwright drag test** — Webkit emulation in Playwright can't drive framer-motion's `setPointerCapture` from synthesized touch events. Real iPad coverage of the drag mechanic ships via PT.4 (Jason's physical iPad inspection), not via emulation. Test is `test.skip(({ browserName }) => browserName !== "chromium", …)` with the rationale inline.
- **Bento landing redesign broke the old smoke + a11y tests — fix them, don't bypass** — Pre-existing failures discovered while running the full e2e suite. Updated assertions to match the current landing (no more "Pick a Tutor" heading, no aria-disabled cards) AND fixed three color-contrast WCAG-AA violations (`text-sb-accent-deep` on `kid-name` label, `text-sb-muted` on "Coming next" pills, `text-sb-subtle` on "A SuperBuilders project" caption). Bumped to `text-sb-ink` / `text-sb-ink/70`.
- **Make `tutorMachine` injectable via `createTutorMachine({ audioEngine, hasNameSlot })` factory** — Singleton import of `audioEngine` would make unit tests impossible without monkey-patching. Factory keeps tests deterministic; the default export `tutorMachine = createTutorMachine()` keeps runtime code unchanged.
- **Bubble text derives from `dialogueKeyForState(state.value)` — not duplicated on the machine config** — Pure lookup map from state value → DialogueKey. Idle waits + animation states return null so the bubble auto-closes. Tested separately in `dialogueForState.test.ts`.
- **Beat 6 Playwright test must navigate via landing CTA, not direct `/lesson` page-load** — Direct page-load of `/lesson` leaves framer-motion's bubble animation stuck at the `initial` style (opacity 0, frozen transform). Reproducible in the live preview. Pre-existing — not introduced by my changes (verified by `git stash` + re-test). SPA navigation from `/` works fine. Helper `enterLessonWithDemo` wraps this so the test is reliable.
- **Stub `/audio/*.mp3` + `/api/voice` to 404 in the Beat 6 spec** — Audio files actually exist on disk and play for ~5 seconds each — DIALOGUE_DONE fires after real MP3 duration. For deterministic state-machine flow tests we want the fail-fast path, so `page.route(/\/audio\/.*\.mp3$/, …)` forces 404 (AudioEngine fires onDone immediately on failure).
- **AhaAnimation auto-fires `ANIMATION_DONE` after 1500ms** — Replaces the manual dev-button click. The machine enters `aha_triggered` → animation mounts → 1500ms timer → `send({ type: "ANIMATION_DONE" })` → state advances to `celebrating` and plays `aha_reveal`. Cluster-anchored positioning + cheese particles still TBD when the lesson Table lands.
- **Guest component placeholder uses `onError` fallback to a styled element** — Real asset path `/images/characters/guests/<id>-<expression>.png` is the first attempt; if 404 (PT.2 hasn't shipped art yet), `onError` swaps to a colored circle + first-initial + ASCII face (`:|`, `:(`, `:D`). When PNGs ship to canonical paths, placeholder disappears automatically with zero code change.
- **Mark PT.5 (Superbuilders brand research) as `[x]`** — Already shipped in earlier commits (`7e31f25`, `b0ba1a2`). Tailwind config has the `sb:` namespace; PRD §2.3 has brand notes. Audit revealed the marker was missing.

## Key Prompts & Responses

> **User:** "OK, go ahead and kick off the tasks that you recommend. … What I actually like to do tonight is just run through all of your tasks. Anything that can be completed in code that is not blocked by my actions, I'd like to get that done tonight … I'm fine with it taking a little bit longer to do so in a unit test or other types of regression tests."
>
> **Outcome:** Reframed scope from "the three highest-ROI items" to "everything not blocked, including tests." Used `TaskCreate` to track 8 initial tasks; added 4 more (P1.4, P1.5, P5.11, P2.8) as work progressed. All 12 completed.

> **User:** "the task file isn't showing the marked-off, done, or completed task. Can we just ensure that everything that is already complete actually shows the x next to its point"
>
> **Outcome:** Audited `TASKS.md`. Found `PT.5` (Superbuilders brand research) still `[ ]` despite SB tokens being in `tailwind.config.js` from earlier commits. Marked `[x]` with shipped-2026-05-20 note. All other markers verified accurate.

> **User:** "continue shipping"
>
> **Outcome:** Continued past midnight into May 21. Created tasks P1.5 (Beat 6 Playwright smoke), P5.11 (AHA polish), P2.8 (Guest placeholder). All three shipped before the pivot.

> **User:** "I'm pivot our plan in a brand new chat based on new information"
>
> **Outcome:** Stopped mid-flight. Wrote this journal so the new chat can pick up. Nothing committed.

> **Investigation:** Playwright Beat 6 test failed with a blank-white-screen landing page when audio routes used the glob pattern `**/audio/**` and `**/api/voice**`.
>
> **Outcome:** Glob patterns in Playwright `page.route()` were over-intercepting somehow (test got a blank screen on landing). Switched to regex routes `/\/audio\/.*\.mp3$/` and `/\/api\/voice/` — landing renders correctly, audio still stubbed.

> **Investigation:** Bubble's framer-motion `animate` transition is stuck at the `initial` style when navigating directly to `/lesson` via `window.location.href = '/lesson'` (opacity 0, transform frozen at `translateY(8px) scale(0.85)`).
>
> **Outcome:** `git stash`-tested and confirmed this is pre-existing, NOT caused by my session's LessonView edits. SPA navigation from `/` clears it. Workaround: every test that needs the bubble navigates via landing CTA. Root cause not chased — flagged as an open thread.

## Files Touched

### New

- [src/modules/table/proximity.ts](src/modules/table/proximity.ts) — Pure logic for the drag-to-compare mechanic: union-find proximity grouping + subset-sum equal-partition detection.
- [src/modules/table/proximity.test.ts](src/modules/table/proximity.test.ts) — 22 unit tests.
- [src/modules/tutor/tutorMachine.test.ts](src/modules/tutor/tutorMachine.test.ts) — 10 unit tests for the `playDialogue` action + Beat 6 happy/wrong/recovery paths.
- [src/modules/tutor/dialogueForState.ts](src/modules/tutor/dialogueForState.ts) — Pure lookup from `state.value` → `DialogueKey`.
- [src/modules/tutor/dialogueForState.test.ts](src/modules/tutor/dialogueForState.test.ts) — 8 unit tests.
- [src/lib/demoMode.ts](src/lib/demoMode.ts) — `useDemoMode` hook + URL/sessionStorage flag detection + beat-target table + keyboard listener.
- [src/lib/demoMode.test.ts](src/lib/demoMode.test.ts) — 10 unit tests.
- [src/components/DemoBadge.tsx](src/components/DemoBadge.tsx) — Small floating "DEMO" badge with key hints.
- [src/lib/useHoldToReset.ts](src/lib/useHoldToReset.ts) — Tap-and-hold gesture hook with progress tracking.
- [src/lib/useHoldToReset.test.tsx](src/lib/useHoldToReset.test.tsx) — 6 unit tests.
- [src/lib/inspector.ts](src/lib/inspector.ts) — `getInspectorOption()` reading `?inspect=true` and lazy-creating a `createBrowserInspector`.
- [src/lib/inspector.test.ts](src/lib/inspector.test.ts) — 3 unit tests.
- [src/modules/lesson/AhaAnimation.tsx](src/modules/lesson/AhaAnimation.tsx) — Three-layer Framer Motion hero animation that auto-fires ANIMATION_DONE after 1500ms.
- [src/modules/world/Guest.tsx](src/modules/world/Guest.tsx) — 3-expression guest character with `onError` placeholder fallback.
- [src/modules/world/Guest.test.tsx](src/modules/world/Guest.test.tsx) — 5 unit tests.
- [src/modules/preview/GuestPreview.tsx](src/modules/preview/GuestPreview.tsx) — `/preview/guests` route showing all 9 cells (3 guests × 3 expressions).
- [e2e/sandbox-proximity.spec.ts](e2e/sandbox-proximity.spec.ts) — Playwright: slice → drag close → expect `≡` equal indicator. Chrome-only (webkit skip).
- [e2e/beat-6-aha.spec.ts](e2e/beat-6-aha.spec.ts) — Playwright: full happy path + wrong-slice recovery via demo-mode dev controls.

### Modified

- [TASKS.md](TASKS.md) — Marked 12 tasks `[x]` with detailed shipped-on notes; PT.5 retroactively marked `[x]`.
- [src/modules/tutor/tutorMachine.ts](src/modules/tutor/tutorMachine.ts) — Replaced TODO with real `audioEngine.play()` wired into `playDialogue` action; added `createTutorMachine` factory + `SET_NAME` event + `input` wiring + `stopDialogue` action on RESET.
- [src/modules/lesson/LessonView.tsx](src/modules/lesson/LessonView.tsx) — Added `LessonMachineRoot` (mounts after onboarding) + `useMachine(tutorMachine)` + `dialogueKeyForState` derivation + `LessonDevControls` (visible in demo mode) + `useHoldToReset` on Freddy + `AhaAnimation` mount on `aha_triggered` + `getInspectorOption` for `?inspect=true`.
- [src/modules/preview/SandboxPreview.tsx](src/modules/preview/SandboxPreview.tsx) — Added `findProximityGroups` + cluster centroid badge overlay (`≡` / `≠`) + `useHoldToReset` on Freddy.
- [src/modules/table/index.ts](src/modules/table/index.ts) — Exports proximity API.
- [src/modules/world/index.ts](src/modules/world/index.ts) — Exports `Guest`.
- [src/App.tsx](src/App.tsx) — Mounts `useDemoMode()` + `DemoBadge` at the app root.
- [src/main.tsx](src/main.tsx) — Registered `/preview/guests` route.
- [src/modules/world/NameInputOverlay.tsx](src/modules/world/NameInputOverlay.tsx) — Color-contrast fix on the kid-name label (`text-sb-accent-deep` → `text-sb-ink`).
- [src/modules/landing/LandingPage.tsx](src/modules/landing/LandingPage.tsx) — Color-contrast fixes on "Coming next" pills + "A SuperBuilders project" caption.
- [tailwind.config.js](tailwind.config.js) — `sb.muted` darkened from `#737373` to `#5B5B5B` (initial attempt at contrast fix — turned out the rule didn't hot-reload, so direct token overrides at usage sites did the actual lifting).
- [e2e/smoke.spec.ts](e2e/smoke.spec.ts) — Updated assertions to match the bento landing redesign (no more "pick a tutor" heading, no aria-disabled cards).
- [e2e/a11y.spec.ts](e2e/a11y.spec.ts) — Same heading update as smoke.
- [assets/midjourney-prompts.md](assets/midjourney-prompts.md) — Added 9 guest prompts (Maya / Theo / Nonna Lucia × 3 expressions each), staging notes, asset destination table, off-model recovery prompt.
- [package.json](package.json) + [package-lock.json](package-lock.json) — Added `@statelyai/inspect` devDependency.

### Deleted

_None_

## Open Threads

- **Pre-existing bug: framer-motion bubble animation stuck on direct `/lesson` page-load** — Reproducible by `window.location.replace('/lesson')` in the preview. Bubble's `initial={{ opacity: 0, scale: 0.85, y: 8 }}` style never animates to `animate={{ opacity: 1 }}`. Confirmed pre-existing via `git stash` test. SPA navigation from `/` works fine. **Worked around** by routing all e2e tests through landing CTA. Root cause not chased — could be React 19 StrictMode + framer-motion + autoplay-blocked audio interaction. Worth a focused investigation later but not blocking the demo.
- **Tailwind config hot-reload doesn't pick up token color changes in dev** — Editing `sb.muted` in `tailwind.config.js` didn't propagate to the running dev server; only changes to source files (where the class is used) did. Worked around by overriding at the usage sites. May need to restart `vite dev` to pick up config changes — flag for the next session.
- **`prefers-reduced-motion: reduce` and AhaAnimation interaction not tested** — A11y test sets `reducedMotion: "reduce"` but doesn't enter the lesson far enough to hit `aha_triggered`. The hero animation might need a reduced-motion variant (instant fade instead of scale+pulse).
- **`?beat=aha` only triggers `RESET` if machine is mid-flight; doesn't seed other beats** — Future beats (check, win) will need their own handling in `LessonMachineRoot`'s `useEffect([searchParams])`.
- **64×64 `*-cursor.png` variants in `public/images/ui/` still unused** — Flagged in the previous session's journal; still not removed.
- **Nothing committed this session** — 16 modified + 14 new files sit uncommitted on `main`. The pivot may want some of this; review before deciding what to keep.

## Next Steps

> **First action for the new chat:** read this journal end-to-end, then decide whether to keep, partial-keep, or revert the 30 uncommitted files based on the pivot direction.

1. **Read the pivot brief from Jason** — He's bringing new information. Wait for that before touching the codebase. Don't re-derive a plan from `PRD.md` / `TASKS.md` alone — those may be partially superseded by the pivot.

2. **Decide what to do with the 30 uncommitted files** — `git status` shows the inventory. Options: (a) commit everything as a "pre-pivot snapshot" before pivoting, (b) selectively commit the high-value pure-logic pieces (proximity, dialogueForState, demoMode, useHoldToReset, AhaAnimation) and discard the LessonView wiring if the pivot changes the lesson structure, (c) `git stash` everything for safety while the pivot direction is sketched out.

3. **Verify the current build is still green before any changes** — Run `npm run typecheck && npm run test:run && npx playwright test`. Expected: typecheck clean, 178 unit tests pass, 17 e2e tests pass (1 skipped for iPad-Safari proximity drag).

4. **If the pivot keeps Beat 6 / AHA as the demo hero**, the live wiring is at `/lesson?demo=true`:
   - Navigate via landing CTA (NOT direct `/lesson`)
   - Tap greeting → submit name → click `SLICED (1/2) → correct` in the dev controls panel → wait for audio → click `PROXIMITY (equal) → AHA` → AhaAnimation auto-fires → reveal line plays → state exits to top-level `check`
   - This is the demo hero, ready to record once the pivot's scope is known.

5. **If the pivot changes the lesson structure**, the most reusable pieces are:
   - `src/modules/table/proximity.ts` — pure logic, no Beat 6 dependency
   - `src/lib/demoMode.ts` + `src/lib/useHoldToReset.ts` + `src/lib/inspector.ts` — generic infrastructure
   - `src/modules/tutor/dialogueForState.ts` — extensible per-beat lookup
   - `src/modules/world/Guest.tsx` + `assets/midjourney-prompts.md` guest prompts — independent of lesson flow
   - The `LessonView` wiring + `AhaAnimation` are Beat-6-specific and may need rework

6. **Pre-existing framer-motion direct-page-load bug** — If the pivot involves moving away from the current route structure, the bug may evaporate. If not, worth a dedicated investigation pass; current workaround is "always SPA-navigate via landing."

7. **PRD/TASKS sync if the pivot supersedes them** — Both files are flagged as "living docs" per Jason's saved feedback (memory: `feedback_living_design_docs`). If the new chat's pivot creates a new direction, update PRD/TASKS in the same session that decision lands — don't anchor on stale spec.

8. **Demo deadline reminder** — Friday 2026-05-22 noon is the demo per the kickoff PDF (`References/Week 4 Kickoff — Clone Synthesis Tutor.pdf`). That's ~33 hours from now. The pivot needs to be tight or the demo slips.

---

*Read first when resuming: this entry → `TASKS.md` Current Sprint section → the pivot brief Jason brings into the new chat.*
