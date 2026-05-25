# Freddy Fractions V3 — Product Requirements Document

**Status:** Draft (post-grilling, pre-execution)
**Branch:** `feat/freddy-synthesis-arc`
**Date:** 2026-05-25

**Related docs:**
- [LESSON-V3.md](./LESSON-V3.md) — beat sheet, design-system constraints, hint policy (spec annex; source of truth for *what* each beat does)
- [CONTEXT.md](./CONTEXT.md) — glossary (DeliveryBox, GuestBox, Guest, guestId, MCQ)
- [../docs/adr/0001-v3-manipulative-state-architecture.md](../docs/adr/0001-v3-manipulative-state-architecture.md) — four hardest-to-reverse architectural decisions, with alternatives considered and rejected
- [PRD.md](./PRD.md) — Freddy Fractions v1/v2 PRD (V3 extends, does not replace)

---

## Problem Statement

A 9-year-old learning fractions wants more than a single "AHA" moment — they want a guided walk up the **concrete → pictorial → abstract** (CPA) ladder so the symbolic notation (½, ¼, 2½) feels *earned*, not introduced from nowhere.

Today's Freddy Fractions scripted v2 lesson ends at "2/4 = 1/2" via an AHA animation + confetti win screen. The kid watches equivalence happen but never:

- Distributes pizzas to specific recipients (the natural origin of fractions: sharing among people)
- Confronts a remainder and chooses how to handle it
- **Types** a fraction into a numerator/denominator box (encoding their understanding into symbols)
- Sees the same pattern repeat with a different denominator (the spiral that makes fraction mastery generalize)

Result: the kid finishes v2 in ~90 seconds with one fact memorized, not the fraction *concept* internalized. The lesson is a demo, not fraction mastery.

## Solution

V3 ports the Synthesis "Share the Cookies" lesson onto our existing Sicilian-pizza manipulative, replacing the v2 single-AHA arc with a **37-beat CPA-laddered arc across 5 scenes** plus an explicit mid-lesson break:

1. **Scene 1 — Clean division.** Share 4 pizzas between Maya and Theo. Kid distributes wholes into two named boxes. (Establishes the share metaphor with no fractions.)
2. **Scene 2 — Remainder + slicing.** Share 5 pizzas between 2. Kid hits a leftover, chooses what to do, slices it with the existing cutter, distributes the halves. (Halves emerge naturally from division.)
3. **Scene 3 — Symbolic leap for ½.** Big "2½" notation appears above the boxes. Kid types `1` and `2` into a fraction-input to encode "½." (CPA closes for halves.)
4. **(Beat 21.5 — Stop-here Y/N.)** Kid chooses: keep going, or stop with a "Beautiful work — you wrote ½" win.
5. **Scene 4 — Quarters (5 ÷ 4).** Nonna and Nico arrive with their own boxes. Kid uses the existing mode toggle (slice ↔ share), slices the leftover into quarters, distributes. (Spiral with a new denominator.)
6. **Scene 5 — Symbolic leap for ¼.** Names the quarter, counts quarters-in-a-whole, types `1` and `4`. (CPA closes for quarters.)

V3 is gated behind `?lesson=v3` during development so v2 stays live, untouched, and rollback-able.

## User Stories

1. As a 9-year-old learning fractions, I want to drag whole pizzas into named boxes (Maya, Theo) so the act of sharing feels concrete and meaningful, not abstract.
2. As a 9-year-old, I want each box clearly labeled with its recipient's name so I'm not just sorting into "bin A" and "bin B" but feeding Maya and Theo.
3. As a 9-year-old, I want the lesson to be patient when I'm thinking — no buzzers, no red flashes, just Freddy waiting calmly until I'm ready.
4. As a 9-year-old who's stuck, I want Freddy to offer a gentle audio hint after ~15 seconds on a hard moment, so I don't have to ask for help.
5. As a 9-year-old, I want to hit a remainder and have to decide what to do with it ("cut in half, or give to the dog?"), so I feel like a participant making real choices, not a button-pusher.
6. As a 9-year-old, I want to slice a pizza myself with the existing cutter (tap or drag), so the act of halving is *mine*, not the computer doing it for me.
7. As a 9-year-old, I want Freddy to ask me comprehension questions ("how many cookies did each person get?") with chip choices, so I have to commit to an answer and find out if I was right.
8. As a 9-year-old who picks the wrong comprehension answer, I want Freddy to redirect me with a hint and let me try again — not just laugh and move on — so I actually learn from the miss.
9. As a 9-year-old who picks a silly distractor ("give to the dog"), I want Freddy to react warmly in character then continue, so it feels like a joke between us, not a quiz I failed.
10. As a 9-year-old, I want to **type** the fraction (1 in numerator, 2 in denominator) so I'm encoding my understanding into symbols, not just watching Freddy write them.
11. As a 9-year-old, I want the typing UX to use the existing in-world number pad I see elsewhere — no iPad system keyboard sliding up and disrupting the flow.
12. As a 9-year-old who finished the halves arc, I want Freddy to ask "keep going to harder fractions, or stop here for today?" so I have agency over my attention.
13. As a 9-year-old who stops after Scene 3, I want a real "Beautiful work — you learned ½" completion moment with a Play-again button, so the early stop feels like a win, not a quit.
14. As a 9-year-old who continues to Scene 4, I want to see new friends (Nonna and Nico) arrive with their own boxes, and Freddy to narrate the scaling, so it feels narrative, not magical.
15. As a 9-year-old, I want to see the existing mode toggle (slice ↔ share) and have Freddy point it out the first time it matters, so I learn to control my own tools.
16. As a 9-year-old, I want my boxes to keep showing my distributed slices visibly inside them, even when there are many, so I can count my work without confusion about who has what.
17. As a 9-year-old, I want the boxes to stack contents stylized inside (multiple wholes + halves + quarters in one Maya box, even when that breaks pizza-box physics), so I'm counting *pizzas*, not boxes.
18. As a 9-year-old, I want pieces I drag out of a box to clearly become "free again" on the table, so my mistakes are easy to undo by re-dragging.
19. As a 9-year-old, I want the notation moments (big "2", "2½", "¼") to appear *above* my distributed pizzas — both visible at once — so I see the physical thing and its symbol together, not one replacing the other.
20. As a 9-year-old playing in CV mode (pinch + drag via webcam), I want every V3 interaction to work the same way as it does with mouse, so the camera mode isn't a degraded experience.
21. As a 9-year-old, I want the lesson to end with a clear "you wrote ¼" moment, so the closing reinforces what I just learned.
22. As a parent or teacher watching, I want the lesson to demonstrably teach more than one fraction (½ AND ¼) in one sitting, so I trust my child is building generalizable understanding, not memorizing one fact.
23. As a parent, I want the lesson to respect attention spans — under ~7 minutes with a natural stopping point — so my kid doesn't fatigue and quit halfway through.
24. As a Freddy Fractions developer maintaining the codebase, I want v2 to keep working untouched during V3 development so I can A/B compare and roll back if needed.
25. As a Freddy Fractions developer reading the code in 6 months, I want the GuestBox / DeliveryBox distinction clearly documented (in CONTEXT.md + ADR) so I don't accidentally combine them and break the metaphor.
26. As a Freddy Fractions developer, I want every V3 primitive built with TDD (tests written *before* implementation), so the eventual state machine sits on a solid foundation of unit-tested deep modules.

## Implementation Decisions

### Architecture

- **V3 lives behind `?lesson=v3`.** `Mount.tsx` reads the param and routes to V3's lesson host; otherwise routes to v2.
- **New file: `LessonScriptedV3.tsx`** in `src/lessons/freddy-fractions/scripted/_v3/`. Separate state machine from v2; v2's `LessonScripted.tsx` is untouched.
- **v2 retirement** happens *after* V3 validates in production: v2 files move to a project-level archive, V3 becomes the default scripted arc. (Out of scope for the V3 ship itself.)

### Data model

- **`SandboxPiece.guestId?: string`** — new optional field on the existing type. `undefined` = free on the table; defined = belongs to that guest's portion. Sliced children inherit `guestId` from the parent. Drag-out-of-a-box clears it. "In a box" and "free" are mutually exclusive — no third state. See ADR §3 for the reasoning vs sidecar `Map`.
- **`derivePerGuestTableState(pieces)`** — new pure helper that groups pieces by `guestId` and applies v2's existing `deriveTableState` to each group:

  ```ts
  const byGuest = groupBy(pieces, p => p.guestId ?? "free");
  const mayaState = deriveTableState(byGuest.maya ?? []);
  ```

- **`tutorStore`** — `nico` added to the guest expressions slice, matching the existing `maya`/`theo`/`nonna` shape.

### New components

- **`GuestBox`** *(deep module)* — multi-instance recipient on the table. One per guest (1:1, not per pizza — see ADR §2). Renders contents stacked stylized inside its lid, even when contents exceed real pizza-box capacity. Reuses DeliveryBox's *visual recipe* (open/closed PNG, hover-glow filter, AABB overlap math) but is a distinct primitive with its own state derivation. Lives in `scenes/table/`. See ADR §1.
- **`MCQ`** *(deep module)* — chip-style multi-choice selector with two configurable modes:
  - `mode: "any-advances"` — any pick fires `onAnswer(choice)` and advances. Used for silly distractors and Y/N self-assessment (beats 6, 18, 21.5, 36).
  - `mode: "re-prompt-until-correct"` — wrong pick triggers a hint line; the kid re-picks; only the correct answer advances. Used for comprehension checks (beats 12, 29, 31).
- **`FractionInput`** *(medium module — composition over existing primitives)* — composes the existing `NumberBar` + `InputField` from `scenes/world/` into a vertical [numerator]/[denominator] entry. Validates against an expected fraction. Fires `onAnswer(numerator, denominator)`. Does **not** clone `NameInputOverlay`'s iPad-keyboard pattern — that's explicitly the only place the system keyboard is allowed.
- **`MixedNumberDisplay`** *(shallow)* — pure render of a big numeral + optional fraction (e.g., "2½", "¼"). Used by notation beats (15, 16, 20, 32, 35).
- **`ContinueButton`** *(shallow)* — down-arrow advance affordance. Matches the lesson-complete `Play again` button chrome.
- **`SceneTransition`** *(deep module — probably a hook `useSceneTransition`)* — orchestrates the in-world reset between scenes: existing pieces fly to the existing `DeliveryBox` ("delivery person took them"); new pizzas slide in via the existing `addPizza` motion; for 3→4, two new `GuestBox` instances slide in beside the existing two. Sequential async; returns a `Promise<void>` for the lesson stage machine to await.
- **V3 stage machine + beat configuration** *(deep module — central)* — 37 stages (36 verbatim Synthesis beats + beat 21.5 stop-here Y/N). 3 new stage *kinds*: `mc_pending` (gates on `onMCAnswer`), `fraction_input_pending` (gates on `onFractionAnswer`), `continue_pending` (gates on `onContinue`). State-driven beat advancement (per-guest composition match) for drag-distribution beats. Per-beat hint policy.

### Existing components — no changes required

- **`DeliveryBox`** — stays as the singleton off-screen send-away affordance for v2 onboarding. V3 uses it during scene transitions (the "delivery person took the empty boxes' contents" framing) but does not modify it.
- **`Guest`** — pure character sprite. May visually pair with a `GuestBox` in V3 (the named character standing beside their box), but the box owns the slice state.
- **`NumberBar`** + **`InputField`** — composed into `FractionInput`. No internal changes.
- **`ToolPicker`** — already kid-driven per PRD §3.3. V3 keeps the v2 `TOOL_BY_STAGE` per-stage default-setting; the kid can override at any time. Beat 23's "click up here to switch modes" uses the existing `spotlight === "toolpicker"` mechanism, not a new toggle.
- **Cutter gesture (tap or drag)** — `PizzaPiece.tsx` already supports both via `dragMovedRef` discrimination. V3 makes no changes; the Synthesis "click to slice in half" instruction maps to a tap on a piece while in cutter mode.

### Lesson contracts

- **Hint policy** (see LESSON-V3.md § Hint policy for the per-beat split):
  - **Comprehension-heavy drag beats (10, 27)** — audio hint after ~15s of wrong-config detected.
  - **Clean-distribution beats (1, 4, 24)** — silent wait; v2's existing 30s `stuck_*` audio nudge as fallback.
  - **Per-beat visual override allowed** (wiggle / pulse) when audio doesn't fit the moment.
- **Wrong-config recovery:** state left as-is; kid re-drags to fix; the lesson never undoes the kid's work.
- **MCQ per-beat mode** is already annotated in LESSON-V3.md beat rows. Silly distractors + Y/N → `any-advances`; comprehension checks → `re-prompt-until-correct`.

### Design system constraints

All new primitives pull from the existing token set deployed in production: `bg-sb-paper`, `text-sb-ink`, `font-mono` for chrome/labels/numerals, `font-sans` for prose/speech-bubble text, the project's "active = dark" rule, `shadow-sb-accent-deep/25` (never `shadow-black`), `focus-visible:ring-sb-accent`, `h-[100dvh]`, framer-motion `spring` at stiffness 400–600 / damping 22–24. **No new colors, fonts, shadow recipes, or radii.** See [LESSON-V3.md § Design system constraints](./LESSON-V3.md) for the full reference.

### Audio

- ~50 ElevenLabs takes total: 36 verbatim Synthesis beats + 2 scene prefaces + 4 transition narrations + ~5 hint lines + ~3 MC re-prompt reactions + 1 stop-here Y/N.
- First pass uses verbatim Synthesis dialogue (with cookies → pizzas swap). Voice tuning to Freddy's "warm older brother" tone happens in a follow-up commit *before* V3 leaves the `?lesson=v3` gate.
- ElevenLabs budget: ~$50 starting balance; top-up acceptable if needed.
- Audio assets live under `public/lessons/freddy-fractions/audio/v3/` so v2 audio is untouched.

## Testing Decisions

### Philosophy

- **Test external behavior, not internals.** A good test verifies what the kid (or caller) sees or can do, not implementation details. Re-renders are not behavior.
- **TDD-first throughout.** Every step in the implementation order (LESSON-V3.md § Implementation order) writes its tests *before* the implementation. Matches the user's stated rule and the project's existing test discipline.
- **Prior art (already in the codebase):** `useSandboxPieces.test.tsx`, `sliceLogic.test.ts`, `proximity.test.ts`, `tableState.test.ts`, `LessonHost.test.ts`, `PizzaPiece.test.tsx`. These are the patterns to copy. Hooks via `renderHook`, components via `@testing-library/react`, pure logic via Vitest assertions, lesson-flow via the `LessonHost.test.ts` pattern.

### Deep modules — exhaustive unit + integration tests

- **`derivePerGuestTableState`** — pure function. Tests: empty pieces, free-only, single-guest, multi-guest, slicing inheritance (parent + children in the same guest's bucket), `undefined` guestId routes to `free`. Model: `tableState.test.ts`.
- **`GuestBox`** — renders contents stacked; drop detection triggers `onDrop(pieceId)`; hover-glow on drag-over; displays guest name; multi-instance positioning. Tests: empty box, 1 piece, multiple pieces, drop accepted vs. rejected, hover-glow lifecycle. Model: `PizzaPiece.test.tsx`.
- **`MCQ`** — both modes verified: `any-advances` advances on any pick; `re-prompt-until-correct` calls `onHint` on wrong pick and `onAnswer(correct)` only on right pick. Tests: 2-option, 6-option, both modes, accessibility (chips reachable + labeled, keyboard nav).
- **`FractionInput`** — kid types digits; fraction validates against expected; `onAnswer` fires with `(numerator, denominator)`. Tests: correct entry, wrong entry, partial entry, `NumberBar` composition correctness.
- **`SceneTransition`** — orchestration order is correct: contents-to-`DeliveryBox` → `addPizza`-slide-in → (for 3→4) new-`GuestBox`-slide-in. Tests: returns promise that resolves after sequence; intermediate state inspectable; cancel-on-unmount safety.
- **V3 stage machine + beat configuration** — per-beat predicate evaluation; stage transitions; hint timer behavior (audio nudge fires at ~15s for comprehension beats, silent for clean beats); kid-done detection for drag-distribution beats (per-guest composition match); state-driven advancement (not event-driven). Model: `LessonHost.test.ts` patterns extended for V3.

### Shallow modules — light coverage

- **`MixedNumberDisplay`** — snapshot test of common forms ("2", "2½", "¼"); responds to prop changes.
- **`ContinueButton`** — `onClick` fires; disabled-when-`disabled` state respected; matches focus-ring + chrome of the existing `Play again` button.

### End-to-end (Playwright)

- One e2e per scene in `e2e/freddy-fractions-v3/`. Each test drives the kid's golden path through that scene (drag, slice, MC, type, continue) and asserts arrival at the next scene's first beat.
- One e2e for the full happy path: Scene 1 → 5 → completion.
- One e2e for the stop-here path: Scene 1 → Scene 3 → beat 21.5 (Stop here) → completion.
- One e2e for the comprehension-miss path: beat 12 wrong-pick → re-prompt → correct.

### Manual QA

- Run `/qa-only` (gstack) on the Vercel preview after each scene lands. Captures screenshots, reports bugs.
- CV mode (camera/hand-tracking) verified per primitive — pinch-target hit detection must work for MCQ chips, `FractionInput` digits, `ContinueButton`. Verified once per primitive in step 2 of the implementation order.

## Out of Scope

- **Thirds (1/3) slicing.** `sliceLogic.ts` doesn't support thirds today and adding it cascades through the slice decomposition graph. Scene 4's 4-friend math (5÷4 = quarters) is chosen specifically to avoid this.
- **Multi-box-per-guest rendering** (e.g., Maya gets 3 wholes → 3 physical boxes appear). Future-proofed by the `guestId` data model — can evolve later with zero schema change — but explicitly not built in V3.
- **Kid-typed guest names.** Hard-coded canonical roster (Maya, Theo, Nonna, Nico) for V3. Kid name-entry would delay the math without commensurate learning gain.
- **New character art** for Nico beyond `Guest.tsx`'s colored-circle placeholder. Real PNG queued as a follow-up; placeholder is acceptable for V3 ship.
- **Voice tuning to Freddy's warm tone in the initial pass.** First pass ships with verbatim Synthesis dialogue (cookies → pizzas); rewriting to Freddy's voice is a required follow-up commit before V3 leaves the `?lesson=v3` gate.
- **Hoisting V3 primitives** (`MCQ`, `FractionInput`, `GuestBox`) to `src/platform/ui/` for cross-lesson reuse. They live in `scenes/freddy-fractions/scripted/_v3/` until they prove reusable. Hoisting is a future workstream once Acutis or ASL needs them.
- **A free-play V3 mode** building on the new primitives. V3 is scripted-only.
- **Lesson telemetry / analytics specific to V3.** Inherits whatever the platform's existing lesson telemetry produces.
- **Differentiated content for older or younger kids.** V3 targets the existing 9-year-old persona.
- **v2 retirement.** Happens after V3 validates in production. Tracked as a follow-up.

## Further Notes

- The verbatim Synthesis beat sheet lives in [LESSON-V3.md § Beat sheet](./LESSON-V3.md) as the spec annex. That doc is the source of truth for *what* each beat does; this PRD is the source of truth for *why* and *what's in scope*.
- The ADR ([0001-v3-manipulative-state-architecture.md](../docs/adr/0001-v3-manipulative-state-architecture.md)) captures the four hardest-to-reverse decisions (GuestBox = new, 1:1 stylized stacking, `guestId` field, stop-here break). Read it before refactoring anything in V3.
- The branch is `feat/freddy-synthesis-arc`. The implementation order from LESSON-V3.md drives the commit ladder; each numbered step gets its own PR (data-model migration → primitives → Scene 1 + transition → Scenes 2+3 → Scene 4+5 → audio → A/B gate → v2 retirement).
- Next skill in the chain: **`/to-issues`** to break this PRD into independently-grabbable tracer-bullet issues mapped to the 8-step implementation order, then **`/tdd`** per issue for execution. Per-PR gates: `/qa-only` on Vercel preview, `/review` before merge, `/ship` to push.
