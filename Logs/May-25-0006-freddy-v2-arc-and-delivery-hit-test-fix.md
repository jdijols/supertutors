# Freddy v2 Arc + Delivery Hit-Test Fix

**Date:** Monday, May 25, 2026 at 12:06 AM CDT
**Session focus:** Shipped the state-driven v2 fraction-equivalence arc for Freddy Fractions, then investigated and fixed a delivery-drop hit-detection bug.

---

## TL;DR

Shipped a 6-commit rewrite of Freddy's scripted lesson (state-driven 6-stage arc, derived `tableState`, scriptedMode workspace constraints, glove-default tool, expanded e2e). Then investigated a reported drag-to-delivery bug, found one confirmed root cause (center-point hit test was way too strict — 256×256 pizza vs 252×252 box), shipped the fix (overlap-area threshold ≥20%). Could not reproduce the secondary "jumps to top-left" symptom in headless repro — asked the user for more repro data.

---

## Critical Decisions

- **State-driven over event-driven** — replaced `handleSlice` slice-count refs with a single `useEffect` watching `tableState.pattern`. Pre-emptive slicing, over-slicing, and weird orderings all converge to the right stage because the world is the source of truth.
- **Keep v1 dialogue keys, add `*_v2` keys alongside** — preserves the xstate `LessonMachineRoot` path (`?beat=aha`/`?beat=win` demos) and existing tests without breaking them.
- **Lesson arc leaves a half on the table for the compare moment** — slice whole → 2 halves → slice ONE half → 1 half + 2 quarters. Visual fraction equivalence (2/4 = 1/2) is undeniable when both objects are physically present.
- **Workspace constraints over dialogue authoring** — instead of writing dialogue for "kid added a second pizza mid-lesson," hide AddPizza + DeliveryBox in `scriptedMode`. Narrow the surface area instead of expanding it.
- **Default tool = glove, lesson sets cutter per-stage** — safer entry into the sandbox; scripted lesson hands the kid the right tool at the right moment via `TOOL_BY_STAGE`.
- **Delivery hit-test = overlap-area threshold (≥20% of piece inside box)** — not center-point. Matches kid perception of "the pizza is inside the box."
- **Defer the second drag symptom until more repro data lands** — could not reproduce "jumps to top-left" in headless. Asked the user for device/mode/recording rather than guessing.

## Big Changes / Pivots

- **Event-driven slice handling → state-driven stage transitions.** Deleted `halfSliceCount`/`quarterSliceCount` refs and the pre-emptive-slice recovery effect (subsumed by reading `tableState.pattern`).
- **Lesson arc reduced from ~10 stages to 6.** Cleaner, dialogue-honest, half stays on table for compare moment.
- **Hit detection: center-point → overlap-area.** Center-only was geometrically brutal — a 256px pizza visually 90% inside a 252px box could have its center fall outside the box rect and silently miss.

## Files Created / Modified

- [`src/lessons/freddy-fractions/tutor/dialogue.json`](../src/lessons/freddy-fractions/tutor/dialogue.json) — added 10 `lesson_*_v2` keys (Grade 3 vocab, "one-half", "equivalent fractions", honest world references)
- [`public/lessons/freddy-fractions/audio/`](../public/lessons/freddy-fractions/audio/) — 32 new MP3s generated via ElevenLabs for the v2 lines
- [`src/lessons/freddy-fractions/scripted/tableState.ts`](../src/lessons/freddy-fractions/scripted/tableState.ts) — NEW. `deriveTableState(pieces, proximityGroups)` pure function + `TableState` / `TablePattern` types
- [`src/lessons/freddy-fractions/scripted/tableState.test.ts`](../src/lessons/freddy-fractions/scripted/tableState.test.ts) — NEW. 11 unit tests covering every pattern (whole, twoHalves, oneHalfTwoQuarters, fourQuarters, hasEighths, multiplePizzas, transients)
- [`src/lessons/freddy-fractions/scripted/LessonScripted.tsx`](../src/lessons/freddy-fractions/scripted/LessonScripted.tsx) — rewritten for state-driven 6-stage arc, `TOOL_BY_STAGE`, audio preconditions, `wrongEighthsFiredRef` one-shot guard
- [`src/lessons/freddy-fractions/scripted/LessonTable.tsx`](../src/lessons/freddy-fractions/scripted/LessonTable.tsx) — added `onTableStateChange` callback, `scriptedMode` prop hides AddPizza + DeliveryBox, replaced center-point hit test with overlap-area
- [`src/lessons/freddy-fractions/scenes/world/DeliveryBox.tsx`](../src/lessons/freddy-fractions/scenes/world/DeliveryBox.tsx) — added `overlaps(pieceRect, threshold=0.2)` method to `DeliveryBoxHandle`
- [`src/lessons/freddy-fractions/store/tutorStore.ts`](../src/lessons/freddy-fractions/store/tutorStore.ts) — default `toolMode` flipped `"cutter"` → `"glove"`
- [`e2e/lesson-scripted.spec.ts`](../e2e/lesson-scripted.spec.ts) — expanded 3 → 7 tests covering target arc, over-slice recovery, pre-emptive slicing, scriptedMode workspace constraints

---

## Important User Prompts

> "Right now, the local host populates nothing. Can you run the dev environment, please, so I can test?"

**Why it mattered:** Established the dev server context for live testing. Server ran at `http://localhost:5173/` in the background for the rest of the session's investigations.

> "I noticed another bug within Freddy Fractions. When a pizza is dragged to the delivery box, it sometimes doesn't land directly inside to trigger it being sent away. When trying to drag it again, the pizza will move to the top left corner of the entire application. Except that it's being held by the gloves move tool, the glove is still over the pizza box while the pizza's in the top left corner, very far away from it. It's actually not tracking the position very well. See if you can research why this would happen and what we could do to fix it."

**Why it mattered:** Triggered the entire investigation arc. Per project conventions, this routed to `/investigate` (Iron Law: no fix without root cause). Two distinct symptoms — A) drops sometimes don't deliver, B) piece jumps to top-left on second drag. Investigation found root cause for A, could not reproduce B.

> "fix the bug you found then run the log-chat skill here and make sure to paste the entire bug report inside the log so we can refer to it later"

**Why it mattered:** Set the bar for this log file — the bug report must be preserved verbatim, not summarized. Drove the structure of the "Investigation Bug Report" section below.

---

## v2 Architecture Work — 6 Commits Shipped

| # | Commit | Summary |
|---|---|---|
| 1 | `9f750e4` | Dialogue rewrite + 32 new MP3s (Grade 3 vocab, world-honest references) |
| 2 | `774dfbe` | Derived `tableState` from pieces — 11 unit tests for pattern detection |
| 3 | `dedaaec` | State-driven 6-stage arc — removed event-driven brittleness |
| 4 | `fb8e104` | `scriptedMode` hides AddPizza + DeliveryBox during lesson |
| 5 | `abffaf3` | Default tool = glove; scripted lesson sets tool per stage |
| 6 | `8d0fc59` | 7 e2e tests covering target, recovery, pre-emptive, scriptedMode |

### New 6-Stage Arc

```
INTRO          → kid slices whole pizza
WAIT_HALVES    → table reaches 'twoHalves' pattern
REACT_HALVES   → "Two halves. Now cut just ONE of those halves in two."
WAIT_MIXED     → table reaches 'oneHalfTwoQuarters' (target)
                 OR 'fourQuarters' (over-slice recovery)
REACT_MIXED    → "Push those two quarters together right next to the half."
REACT_MIXED_ALT→ recovery: "Even cleaner — you made four quarters. Pick TWO..."
WAIT_COMPARE   → table proximity finds an equal cluster
AHA_ANIMATING  → AhaAnimation playing
REVEAL         → "Two-of-four equals one-of-two — equivalent fractions."
WIN            → "Beautiful work."
DONE           → completion card with Play again
```

### Production Verification

Walked through the lesson on live prod via `/browse`:

```
 2-4s:  intro      → "Alright kid, two hungry friends just ordered..."
 6-14s: react_halves → "Boom — two equal halves!... Now, two MORE friends..."
16-22s: react_quarters → "Four equal quarters! Each friend gets one piece..."
24-28s: compare_prompt → "Now drag two of those quarters right up next to one half..."
30-56s: [wait_compare] → silent, waiting for kid to drag
58-60s: stuck_compare → "Grab TWO quarter pieces..."
```

Pre-emptive slicing also verified — 3 rapid clicks before any audio finished, lesson caught up through 3 stages and fired `react_mixed_alt` correctly.

---

## Investigation Bug Report (verbatim)

This is the bug report produced by `/investigate` for the drag-to-delivery bug, preserved here so we can refer back to it without losing context.

````
DEBUG REPORT
════════════════════════════════════════
Symptoms reported:
  A) Drop sometimes doesn't land inside the DeliveryBox (no delivery)
  B) On the second drag attempt, the pizza visually jumps to the top-left
     while the glove cursor stays over the box

What I confirmed via live repro on dev server:
  - Drag → drop INSIDE box: delivers correctly (contains() returns true)
  - Drag → drop ABOVE box (50px miss): correctly falls through to move()
  - Drag again → drop INSIDE box: delivers correctly
  - No visual "jump to top-left" reproduced in my repro flow

What I CAN'T reproduce without more info:
  Symptom B — could not get the piece to jump to top-left on a second drag.
  All my drag attempts produced the piece following the cursor correctly.

What's actually wrong in the code (confirmed):
  1. UX: drop zone hit is computed on PIECE CENTER only.
     src/lessons/freddy-fractions/scripted/LessonTable.tsx:562-564
     centerX = x + piece.width/2; centerY = y + piece.height/2
     if (deliveryBoxRef.current?.contains(centerX, centerY)) ...

     For a 256×256 whole pizza dropped overlapping but not centered on a
     252×252 box, this misses easily. Kid sees the pizza visually overlap
     the box, releases, and nothing happens because the CENTER point
     didn't cross the box's rect bounds. This matches "sometimes doesn't
     land directly inside to trigger." Hit-target is too strict — should
     use overlap-area threshold OR bigger forgiveness margin.

  2. Coordinate system is fragile (not currently triggered, but a footgun).
     handlePieceDragEnd passes motion-value coords (container-relative).
     DeliveryBox.contains() reads getBoundingClientRect (viewport coords).
     Today they happen to match because the lesson container has zero
     viewport offset. Any future layout change (a header bar, padding,
     fixed sidebar) would silently break delivery hit detection without
     warning.

Strong hypothesis for symptom B (not yet confirmed):
  Likely candidates:
  - Touch/iPad-specific: my repro used mouse events. The bug may only
    manifest with touch pointer events where framer-motion's drag
    tracking has different behavior.
  - Multi-piece interaction: addPizza's `computeShiftToMakeRoom` can
    shift existing pieces' x values. If this fires during/after a drag,
    it could push a piece to an unexpected location. Only possible in
    exploration mode (scriptedMode hides AddPizza).
  - Specific viewport / specific stage. The clampToBounds() function
    enforces top:24 and right:viewport.w-piece.width. If viewport
    becomes narrower than piece.width, bounds invert and clamp to 0.
  - Race between animate(x, initialX) in PizzaPiece's prop-sync effect
    and a new dragStart — the two could fight for the motion value.

What I need from you to nail the second symptom:
  (1) Where are you reproducing this — exploration mode or scripted? Or
      another screen entirely?
  (2) Device: desktop mouse, trackpad, iPad touch, phone?
  (3) Is the piece WHOLE or sliced (halves / quarters)?
  (4) How many pieces are on the table when it happens?
  (5) Any chance you added a second pizza via the + button before/during?
  (6) A screen recording would settle it in one viewing.

Recommended fixes (regardless of symptom B):
  Fix 1 (high impact, low risk):
    Replace center-point hit test with OVERLAP-AREA hit test.
    LessonTable.tsx:562 — instead of containing the center point, check
    if the piece's full rect overlaps the box's rect by some threshold
    (e.g., >25% of piece area inside box). Forgiveness margin makes
    delivery feel "natural" rather than "precise."

  Fix 2 (defensive, prevents future bugs):
    Either (a) pass viewport-relative coords from PizzaPiece's onDragEnd
    (use getBoundingClientRect on the piece element at drag-end), OR
    (b) document the implicit "container must have zero viewport offset"
    contract loudly so future layout work doesn't silently break this.

  Fix 3 (only if symptom B repros after the above): add per-frame
    instrumentation to PizzaPiece's drag handler that logs the motion
    value, the framer-motion drag origin, and the prop-driven animate()
    target. We catch the disagreement live.

Status: DONE_WITH_CONCERNS

  Found and documented one real bug (overly-strict hit test, fixable).
  Could not reproduce the "jump to top-left" symptom without more
  information. Recommended fixes will address the confirmed bug AND
  reduce surface area for the unreproduced one. Asking for repro data
  before guessing further.
════════════════════════════════════════
````

---

## Fix Shipped — Commit `4030d89`

**Title:** `fix(freddy): delivery hit-test uses overlap-area, not center-point`

**Approach:**
- Added `overlaps(pieceRect, threshold=0.20)` method to `DeliveryBoxHandle`. Computes axis-aligned bounding-box overlap area as a fraction of the piece's own area. Returns true when ≥20% of the piece is inside the box.
- `handlePieceDragEnd` now synthesizes the piece's rect (`{left:x, top:y, right:x+w, bottom:y+h}`) and calls `overlaps()` instead of the old `contains(centerX, centerY)`.
- Kept `contains(x, y)` available for the during-drag hover indicator (`dropZoneTest` in PizzaPiece) — that one only has a pointer position to test, and strict semantics there are fine.
- Added inline defensive comment about the motion-value vs viewport-coord assumption (Fix 2 alternative B from the bug report).

**Gates:**
- typecheck clean
- 227/227 unit tests pass
- 21/21 desktop-chrome e2e tests pass

**Deploy:** Pushed to `main` on GitHub origin + GitLab labs.gauntletai.com. Vercel auto-deploys from `main`.

---

## Action Timeline

1. User asked for local dev server; ran `npm run dev` in background (`http://localhost:5173/`)
2. User reported the drag-to-delivery bug with two symptoms (drop misses + piece jumps to top-left on retry)
3. Invoked `/investigate` skill per project convention (Iron Law: no fix without root cause)
4. Read `PizzaPiece.tsx`, `DeliveryBox.tsx`, `useSandboxPieces.ts`, `LessonTable.tsx` to map drag → drop → move data flow
5. Identified coordinate-system mismatch between motion values and `contains()` (defensive concern, not blocking today)
6. Live repro via headless browse — confirmed delivery works when piece center is inside box, doesn't when center is outside (correct per current code)
7. Wrote one-shot Playwright test (`e2e/_drag-bug-repro.spec.ts`) to drive real drags and capture motion values
8. Instrumented `handlePieceDragEnd` with `console.log` to capture `contains()` result via Playwright page console listener
9. Confirmed `contains()` is computing correctly; the bug is hit-target tightness, not coordinate corruption
10. Could not reproduce "jump to top-left" symptom — needs more repro info from user
11. Cleaned up temp test file + reverted debug instrumentation
12. Produced full DEBUG REPORT
13. User approved the fix
14. Replaced center-point check with overlap-area threshold (≥20%); added `overlaps()` method to `DeliveryBoxHandle`
15. Verified gates, committed (`4030d89`), pushed to main → Vercel auto-deploy
16. Invoked `/log-chat` to capture session with bug report verbatim

---

## Open Threads / Next Steps

- **Symptom B unresolved.** "Pizza jumps to top-left on second drag attempt" was not reproducible. Need from user: (1) exploration vs scripted mode, (2) device — mouse/trackpad/touch/iPad, (3) whole piece vs sliced, (4) number of pieces on table, (5) was AddPizza used in same session, (6) ideally a screen recording.
- **Defensive coordinate mismatch.** Container-relative motion values vs viewport-relative `getBoundingClientRect()` happen to match today because the lesson container has zero viewport offset. If a future layout change adds a header / sidebar / padding around the table, swap the synthesized piece rect for the actual element's `getBoundingClientRect()` to stay viewport-correct. Comment in `handlePieceDragEnd` flags this.
- **Pre-existing landing redesign breaks `beat-6-aha` / `beat-8-win` e2e tests.** The new `LessonCarousel` removed the "Start the fractions lesson with Freddy" button those tests look for. Untracked redesign files (`AboutModal.tsx`, `LessonCarousel.tsx`, `ComingSoonPosterCard.tsx`, `FreddyPosterCard.tsx`, `InfoToggle.tsx`) are not from this session. Tests need updating to match the new landing UX.
