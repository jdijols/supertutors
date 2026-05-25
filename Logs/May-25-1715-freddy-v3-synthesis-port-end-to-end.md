# Freddy Fractions V3 — Synthesis-port lesson, planned + grilled + built end-to-end

**Date:** Monday, May 25, 2026 at 05:15 PM CDT
**Session focus:** Take Freddy Fractions from underwhelming v2 demo to a full V3 lesson (5 scenes, 36 beats + 21.5) ported from Synthesis "Share the Cookies." Plan → grill → ADR → PR → TDD execution → QA fix.

---

## TL;DR

Started with the conceptual question "is my Freddy Fractions lesson a graph?" — diagnosed that v2 is a 90-second demo, not fraction mastery. Adopted Synthesis's "Share the Cookies" arc as the V3 model. Produced planning artifacts (LESSON-V3.md, CONTEXT.md, PRD-V3.md, ADR 0001), ran `/grill-with-docs` to resolve 8 architectural decisions, merged planning + bento landing redesign to main via PRs #4 + #5, then built V3 end-to-end via TDD: data-model foundation, 4 new primitives (GuestBox, MCQ, FractionInput, MixedNumberDisplay), and Scenes 1–5 wired through all 36 beats + the stop-here Y/N. First QA round flagged layout bugs (positions, label readability) — fixed inline.

---

## Critical Decisions

- **Port Synthesis "Share the Cookies" word-for-word as scaffold** — verbatim first pass, rewrite in Freddy's voice as a follow-up commit before shipping. Separates "does the structure work?" from "does it sound like Freddy?"
- **Pizza-box-as-guest replaces friend-character avatars** — in-world (Sicilian pizza shop → takeout boxes), reuses existing `DeliveryBox` visual recipe, no new art. ADR §1.
- **One `GuestBox` per guest, 1:1 with stylized stacking** — even when contents (2 wholes + ½) violate real pizza-box physics. The box is a labeled portion container for the kid's mental model, not a simulation. ADR §2.
- **`guestId?: string` field on `SandboxPiece`** — single source of truth, not a sidecar Map. Sliced children inherit; drag-out clears. ADR §3.
- **Scope = C: ship all 36 beats with a mid-lesson stop-here Y/N (beat 21.5)** — respects 9-year-old attention without splitting the product surface. ADR §4.
- **Lesson-mode lockdown principle** — `maxFraction` cap per stage prevents over-slicing into states the lesson can't recover from. Carried into V3 from the start, fixes the v2 over-slice dead-end structurally.
- **4th guest = `nico`** — added to canonical roster (Maya, Theo, Nonna, Nico) using `Guest.tsx`'s placeholder fallback until art ships.
- **MCQ hybrid contract** — silly distractors + Y/N use `any-advances`; comprehension checks use `re-prompt-until-correct`.
- **Hint policy** — comprehension-heavy drag beats get audio hints after ~15s; clean-distribution beats stay silent (v2's existing stuck-timer covers it). Per-beat visual override allowed.
- **Scene transitions = in-world flow** (Option B) — old box contents fly to DeliveryBox; new pizzas slide in via addPizza; new GuestBoxes slide in. Reuses existing motion primitives. (Currently instant `resetTo` in code — animation pass is a follow-up.)
- **v2 over-slice bug stays unfixed** — every minute on v2 is throwaway since V3 replaces it. Focus on V3 instead.

## Big Changes / Pivots

- **Approach to v2 → V3:** Started by analyzing v2's stage machine; decided not to redesign v2, port Synthesis arc as V3 instead.
- **Plan formality:** Conversational ideas → LESSON-V3.md beat sheet → CONTEXT.md glossary → PRD-V3.md → ADR 0001. Each layer added rigor on top of the prior.
- **Stage machine emergence:** Single boolean `beat1Complete` (Scene 1 MVP) → data-driven `STAGES: Record<V3Stage, V3StageConfig>` with 37 entries (full lesson). Refactor happened when stages > 2.
- **Layout strategy:** Hardcoded pixel positions → viewport-relative via `getLayout(width, height)` after user QA flagged that pizzas + most boxes were off-screen.
- **Branch history:** `feat/freddy-synthesis-arc` for planning → merged via PR #4 → `feat/v3-data-model-foundation` for execution → merged into main (cleanup commit landed directly on main).

## Files Created / Modified

**Planning artifacts**
- [Freddy-Fractions/LESSON-V3.md](Freddy-Fractions/LESSON-V3.md) — 37-beat spec annex with design-system constraints, hint policy, scene-transition flow, 8-step impl order
- [Freddy-Fractions/CONTEXT.md](Freddy-Fractions/CONTEXT.md) — glossary (DeliveryBox vs GuestBox, Guest roster, guestId, MCQ)
- [Freddy-Fractions/PRD-V3.md](Freddy-Fractions/PRD-V3.md) — product-level PRD with 26 user stories, scope, non-goals, TDD strategy
- [docs/adr/0001-v3-manipulative-state-architecture.md](docs/adr/0001-v3-manipulative-state-architecture.md) — four hard-to-reverse decisions

**Data model + helpers**
- [src/lessons/freddy-fractions/scenes/table/useSandboxPieces.ts](src/lessons/freddy-fractions/scenes/table/useSandboxPieces.ts) — added `guestId?: string` field, `maxFraction?` option, `setGuestId`, `resetTo`, slice cap + propagation
- [src/lessons/freddy-fractions/scenes/table/useSandboxPieces.test.tsx](src/lessons/freddy-fractions/scenes/table/useSandboxPieces.test.tsx) — 8 new tests (guestId propagation, free preservation, maxFraction cap, setGuestId, resetTo)
- [src/lessons/freddy-fractions/scripted/tableState.ts](src/lessons/freddy-fractions/scripted/tableState.ts) — added `derivePerGuestTableState` pure helper
- [src/lessons/freddy-fractions/scripted/tableState.test.ts](src/lessons/freddy-fractions/scripted/tableState.test.ts) — 2 new tests (grouping, per-bucket pattern)

**New V3 primitives**
- [src/lessons/freddy-fractions/scenes/table/GuestBox.tsx](src/lessons/freddy-fractions/scenes/table/GuestBox.tsx) — multi-instance named recipient box, reuses DeliveryBox visual recipe + new state model
- [src/lessons/freddy-fractions/scenes/table/GuestBox.test.tsx](src/lessons/freddy-fractions/scenes/table/GuestBox.test.tsx) — 7 tests
- [src/lessons/freddy-fractions/scenes/table/index.ts](src/lessons/freddy-fractions/scenes/table/index.ts) — added GuestBox exports
- [src/lessons/freddy-fractions/scripted/_v3/MCQ.tsx](src/lessons/freddy-fractions/scripted/_v3/MCQ.tsx) — chip selector with `any-advances` / `re-prompt-until-correct` modes
- [src/lessons/freddy-fractions/scripted/_v3/MCQ.test.tsx](src/lessons/freddy-fractions/scripted/_v3/MCQ.test.tsx) — 7 tests
- [src/lessons/freddy-fractions/scripted/_v3/FractionInput.tsx](src/lessons/freddy-fractions/scripted/_v3/FractionInput.tsx) — composes NumberBar + slot UI; expected-validation; remount-on-wrong via key
- [src/lessons/freddy-fractions/scripted/_v3/FractionInput.test.tsx](src/lessons/freddy-fractions/scripted/_v3/FractionInput.test.tsx) — 8 tests
- [src/lessons/freddy-fractions/scripted/_v3/MixedNumberDisplay.tsx](src/lessons/freddy-fractions/scripted/_v3/MixedNumberDisplay.tsx) — pure render (big numeral + optional fraction)
- [src/lessons/freddy-fractions/scripted/_v3/MixedNumberDisplay.test.tsx](src/lessons/freddy-fractions/scripted/_v3/MixedNumberDisplay.test.tsx) — 4 tests

**V3 lesson host + routing**
- [src/lessons/freddy-fractions/scripted/_v3/LessonV3.tsx](src/lessons/freddy-fractions/scripted/_v3/LessonV3.tsx) — full stage machine (37 stages), 5 scenes wired, viewport-relative layout
- [src/lessons/freddy-fractions/Mount.tsx](src/lessons/freddy-fractions/Mount.tsx) — added `?lesson=v3` query-param routing

---

## Important User Prompts

> "is my freddy fractions lesson a graph?"

**Why it mattered:** Opened the session at a meta level. Led to diagnosing v2 as a 90-second AHA demo, not fraction mastery — which surfaced the real problem and set up the V3 redesign.

> "we need to make improvements (less bugs/weird actions and more student/tutor back and forth) to this lesson specifically"

**Why it mattered:** Scoped the work to Freddy specifically (not platform-wide) and named the two goals (fewer bugs, more interaction).

> "can you read the @Freddy-Fractions/References/Share the Cookies Lesson? That is the synthesis lesson we should enable that adds more depth"

**Why it mattered:** Pointed at the source. Reading all 37 screenshots gave the structural template (CPA ladder, MC + symbolic entry) that became V3.

> "can we create a feature branch for this change first, also can we just copy the exact step by step beats in from synthesis. literally copy them word for word"

**Why it mattered:** Locked in the verbatim-port approach and triggered the planning workflow (branch + LESSON-V3.md beat sheet).

> "So instead of building two extra friend characters, why don't we just have two pizza boxes, and each pizza box represents a friend"

**Why it mattered:** Replaced the character-avatar approach with pizza-boxes-as-guests. Eliminated two primitives (FriendCharacter, PlateZone) in favor of one extended primitive (GuestBox), staying in-world for the Sicilian pizza shop.

> "yes update this @Freddy-Fractions/LESSON-V3.md and /grill-with-docs if it help improve our plan"

**Why it mattered:** Launched the formal grilling session, which surfaced terminology drift, missing primitives, and the 8 architectural decisions captured in the ADR.

> "I'm still working on that problem where we're not preventing the student from slicing more than is necessary... we should disable certain actions that move the student to some workspace condition"

**Why it mattered:** Established the lesson-mode lockdown principle that became `maxFraction` in V3. Made the v2 over-slicing dead-end structurally impossible in V3.

> "I understand that we're still on V2, so I'm asking that you carry over the principles that we're talking about right now into V3 and ensure that this is still true for that version."

**Why it mattered:** Made the lockdown principle non-negotiable for V3's foundation, not a retrofit.

> "Commit to planning docs first. then /to-issues and or /tdd if beneficial"

**Why it mattered:** Set the execution path — TDD-driven implementation, with planning artifacts committed first as a stable foundation.

> "Work through each chunk. I'm not going to test in between, so once you're done with scene three, move to scene four. Just keep working all the way until you're complete."

**Why it mattered:** Authorized the long uninterrupted Scene 3 → 4 → 5 build, plus the new primitives (FractionInput, MixedNumberDisplay). Set the velocity expectation.

> "So you completely moved the position of the pizzas and the boxes for no good reason... The name Maya that you have listed here is below the box, so that it's actually very difficult to read."

**Why it mattered:** First post-build QA pass. Surfaced the hardcoded-pixel layout bug (positions off-counter) and the label readability bug (dark-on-dark). Triggered the viewport-relative layout refactor + paper-pill label fix.

---

## Action Timeline

1. Diagnose v2 lesson as 90-second demo (graph metaphor → CPA-ladder analysis).
2. Read all 37 Synthesis "Share the Cookies" screenshots — extract beat sheet.
3. Create `feat/freddy-synthesis-arc` branch off main.
4. Write LESSON-V3.md beat sheet (verbatim Synthesis dialogue).
5. User redesign call: pizza-boxes-as-guests instead of FriendCharacter/PlateZone.
6. Update LESSON-V3.md to reflect pizza-box decision + design-system constraints.
7. Invoke `/grill-with-docs` — resolve 8 architectural decisions across 8 grill rounds (GuestBox = new component, guestId field, cutter preserved, MCQ hybrid, Nico added, hint policy, scene transitions, scope = C with stop-here).
8. Update CONTEXT.md + LESSON-V3.md inline as each decision crystallizes.
9. Invoke `/to-prd` — produce Freddy-Fractions/PRD-V3.md (26 user stories, scope, TDD strategy).
10. Write docs/adr/0001-v3-manipulative-state-architecture.md bundling four hardest-to-reverse decisions.
11. Push branch, open PR #4, merge to main with branch delete (planning artifacts land on main).
12. User authorizes pushing bento landing redesign too — opens PR #5, resolves merge conflicts (LESSON-V3 took main's; ASL vocab kept bento's evolved version), merges.
13. Invoke `/tdd`. Plan 9-cycle Tier 1; execute first 4 cycles (guestId on SandboxPiece, slice propagation, derivePerGuestTableState).
14. User establishes lesson-mode lockdown principle — extends Tier 1 with `maxFraction` cap.
15. Commit Tier 1 + lockdown on new `feat/v3-data-model-foundation` branch.
16. TDD-build `GuestBox` (7 tests).
17. Wire Scene 1 demo + `?lesson=v3` routing in Mount.tsx.
18. TDD-build `MCQ` primitive (7 tests, both modes covered).
19. Refactor LessonV3 into a data-driven stage machine; add Scene 2 (beats 4–13) + `resetTo` for scene transitions.
20. TDD-build `FractionInput` + `MixedNumberDisplay` primitives (12 tests).
21. Add Scene 3 + beat 21.5 stop-here Y/N (notation overlay, FractionInput retry-on-wrong via key remount).
22. Add Scene 4 — 4-guest layout, `scene_4_intro` reset, slice-to-quarters.
23. Add Scene 5 — name + write the quarter (re-prompt MCs, FractionInput for ¼, exit Y/N).
24. Run full test suite — 423/423 across all of supertutors, zero regressions.
25. User QA on `?lesson=v3` — screenshot shows pizzas + most boxes off-counter, "MAYA" label unreadable on wood.
26. Refactor LessonV3 layout to viewport-relative via `getLayout(width, height)` useMemo.
27. Update GuestBox label to paper-pill above the box with shadow.
28. Re-run tests (154/154 Freddy), commit fix to main.
29. `/log-chat` (this file).

---

## Open Threads / Next Steps

- **QA against the latest fix** — user needs to refresh `localhost:5173/lessons/freddy-fractions?lesson=v3` and verify pizzas are on the counter + boxes are vertically centered + labels readable. Layout values assume ~1920×1080; tweaks likely needed for ultrawide.
- **Audio** — ~50 ElevenLabs lines (36 verbatim Synthesis beats + 2 scene prefaces + 4 transitions + ~5 hints + ~3 MC reactions + 1 stop-here Y/N). Text bubbles only today.
- **Voice tuning** — current dialogue is verbatim Synthesis (with cookies → pizzas swap). Required follow-up commit to rewrite in Freddy's warm "older brother" tone before V3 leaves the `?lesson=v3` gate (per ADR §4 and IP-prudence).
- **Scene transition animations** — currently instant `resetTo`. Plan calls for old contents → DeliveryBox slide-off + new pizzas via existing `addPizza` slide-in motion.
- **CV mode** — `usePointerFromHand` should make V3 work in CV mode for free, but not verified beat-by-beat yet.
- **E2E Playwright tests** — one per scene + happy path + stop-here path + re-prompt path. None written for V3 yet.
- **4th guest art** — `nico` ships with `Guest.tsx`'s colored-circle placeholder; real PNG queued.
- **v2 over-slice bug** — explicitly not being fixed (V3 replaces v2). v2 retirement happens after V3 validates in production.
- **Window resize** — layout captured once at mount; no resize listener. Out of scope for V3 MVP.
- **Branch state** — V3 merged into main; `feat/v3-data-model-foundation` may still exist locally + on origin. Local cleanup of stale branches deferred.
