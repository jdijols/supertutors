# V3 QA pass — z-index, layout, chrome, interaction-polish port, branch sync

**Date:** Monday, May 25, 2026 at 07:04 PM CDT
**Session focus:** Iterate on the V3 lesson after the initial Scenes 1–5 build — surface bugs in browser, port v2 interaction polish that didn't carry over, then merge + sync everything.

---

## TL;DR

Continuing from the prior session's V3 build. First browser QA exposed the lesson rendering as Freddy + speech bubble only (z-index issue with `RestaurantScene`'s wood-counter PNG). Fixed layout (viewport-relative positions, paper-pill labels, box right-alignment, drag z-order), added chrome (`CvToggle` + `ToolPicker`), and ported v2's interaction polish (`GuestBox` drag-over glow, `dropZoneTest` shrink, `SliceBurst` on slice, `data-cursor-pointing`). Discovered polish commits landed on a separate worktree's branch — merged into `main`, pushed to both remotes, cleaned worktrees + branches + stash. Repo is now fully clean and synced.

---

## Critical Decisions

- **`LessonV3` wrapper at `z-[25]`** — RestaurantScene's wood-counter PNG is at z-20 and was painting over all V3 content (pizzas, boxes — speech bubble worked only because it had its own z-30). Promoting the wrapper above the counter fixes the whole tree at once.
- **Viewport-relative layout via `getLayout(width, height)`** — replaced hardcoded pixel positions. Counter is bottom ~52% of viewport; pizzas live in the left half of the counter, boxes on the right.
- **Boxes right-aligned with mute-toggle right edge** — `Math.max(width - 220, 800)` for 2-guest layout; shifted up to clear room for `ToolPicker` (bottom-right) and `CvToggle` (bottom-left).
- **GuestBox label as paper pill, `z-[1]` only** — pill background (bg-sb-paper + border) makes it readable against the wood counter; minimal z-index keeps it from promoting above sibling pizzas during drag.
- **Render order: boxes BEFORE pizzas** — within the wrapper's stacking context, DOM order = paint order, so dragged pizzas always paint above any box they're hovering over.
- **Port v2 interaction polish without lesson logic** — `GuestBox` mirrors `DeliveryBox`'s pointer-tracking glow, `LessonV3` passes `dropZoneTest` to `PizzaPiece` (triggers built-in shrink-to-50%), `handlePieceTap` pushes a `SliceBurst` on successful cut, wrapper gets `data-cursor-pointing` for the platform's custom cursor CSS.
- **CvToggle conditionally rendered** — only when `cv` handle is provided (`{cv && <CvToggle cv={cv} />}`); CvToggle self-positions to fixed bottom-left z-[60], so no wrapper needed.
- **ToolPicker is chrome-only in V3 (for now)** — V3's tap-to-slice doesn't gate on `toolMode`, so picker visually present but functionally inert. Wiring tap-to-slice through toolMode flagged as a follow-up.
- **Merge `feature/landing-page-polishing` → `main` via `--no-ff`** — branches diverged after a docs commit on main, fast-forward refused; explicit merge preserves both histories.
- **Drop the day-old stash** — `WIP: bento+ASL leftovers before freddy-synthesis-arc branch` from this morning, branch no longer exists, work is on main via PR #5. Safe to drop per user authorization.

## Big Changes / Pivots

- **From hardcoded positions → viewport-relative layout** — first QA round showed pizzas and most boxes off-screen; refactored to a `getLayout(width, height)` function called once at mount via `useMemo`.
- **From "V3 is a clean slate" → "V3 inherits v2's interaction polish"** — initial build deliberately omitted v2 chrome thinking it didn't apply; user flagged that hover glow, custom cursor, slice bursts, and drop-target feedback all needed to carry over. Ported without bringing v2's lesson logic.
- **From scattered polish commits → unified on `main`** — V3 polish work landed on `feature/landing-page-polishing` (a separate worktree's branch) while main only had layout fixes. Merged + pushed so the URL the user was testing finally had the polish.

## Files Created / Modified

**Core lesson code**

- [`src/lessons/freddy-fractions/scripted/_v3/LessonV3.tsx`](src/lessons/freddy-fractions/scripted/_v3/LessonV3.tsx) — added `z-[25]` wrapper; `getLayout` viewport-relative positions; box right-alignment + upward shift; render reordered (boxes before pizzas); imports for `CvToggle`, `ToolPicker`, `SliceBurst`; `dropZoneTest` callback passed to every `PizzaPiece`; `bursts` state + `SliceBurst` render; `data-cursor-pointing` on wrapper
- [`src/lessons/freddy-fractions/scenes/table/GuestBox.tsx`](src/lessons/freddy-fractions/scenes/table/GuestBox.tsx) — paper-pill label above box edge with `z-[1]`; `isDragOver` pointer tracking via global `pointermove` listener; `motion.div` wrapper for mozzarella-cream drop-shadow filter (mirrors `DeliveryBox`); `data-drag-over` attribute

**Dev config**

- `.claude/launch.json` (tracked but ignored; modification stayed in working tree) — `autoPort: true` so preview can coexist with an existing dev server

**Docs / logs / references**

- [`Logs/May-25-1709-asl-alphabet-pivot-and-humane-lesson-ux.md`](Logs/May-25-1709-asl-alphabet-pivot-and-humane-lesson-ux.md) — another session's log (committed)
- [`Logs/May-25-1715-freddy-v3-synthesis-port-end-to-end.md`](Logs/May-25-1715-freddy-v3-synthesis-port-end-to-end.md) — prior session log (committed)
- [`Logs/May-25-1857-landing-chrome-fixes-and-worktree-env.md`](Logs/May-25-1857-landing-chrome-fixes-and-worktree-env.md) — sibling-session log (pulled + committed)
- [`Acutis-Institute/References/Encyclical Letter of His Holiness Leo XIV Magnifica Humanitas (15 May 2026).pdf`](Acutis-Institute/References/Encyclical%20Letter%20of%20His%20Holiness%20Leo%20XIV%20Magnifica%20Humanitas%20%2815%20May%202026%29.pdf) — Acutis reference asset (1.8 MB, committed)

---

## Important User Prompts

> "Checking if any of the ports are running. That link right now says the site cannot be reached."

**Why it mattered:** Opened the QA session. Forced a restart of the dev server before any visual QA was possible.

> "Okay, well, now when I open up that V3 link, the lesson just shows his dialogue. He doesn't speak the dialogue. No audio comes through, and there's zero pizzas. There are no tools, there are no delivery boxes."

**Why it mattered:** First substantive QA report. The "no pizzas" specifically pointed at a rendering bug — pizzas were in the DOM at correct positions but invisible. Led to discovering the z-index conflict with the RestaurantScene wood-counter PNG.

> "1. The pizza boxes are a little bit too much to the left… 2. When I'm dragging the pizzas, they have a lower z-index than the boxes, so when I'm dragging up here underneath the box and then when I let go, they come on top of the box."

**Why it mattered:** Two clean independent bugs in one message — drove the box right-alignment with mute-toggle + the render-order swap (boxes first, pizzas after) that fixed the drag z-order.

> "It looks like none of our interactions that we had in v2 carried over to v3, and I don't know why. This is a really big deal. Our custom cursor, none of that is implemented. Our hover states, none of that is implemented."

**Why it mattered:** Made it explicit that V3 was supposed to inherit v2's interaction polish, not be a fresh slate. Triggered the audit of `PizzaPiece`, `DeliveryBox`, `LessonTable` for what was missing, then the port (hover glow, `dropZoneTest`, `SliceBurst`, `data-cursor-pointing`).

> "Again, I'm trying to view this link, but nothing is loading. It's a blank white screen."

**Why it mattered:** Discovered that the polish commits had landed on `feature/landing-page-polishing` (a separate worktree) rather than `main`. Forced the diagnosis that revealed the branch split.

> "Yeah, go ahead and merge the feature branch into main. Let's commit and push everything so that I can start fresh with the new work tree."

**Why it mattered:** Authorized the merge + push + worktree cleanup that brought everything onto main and freed the second worktree.

> "Recheck our git history and branches. I want to ensure that everything is synced with our remote repos, that there are no work tree branches currently open, and that there are no uncommitted or unstaged changes."

**Why it mattered:** Triggered the final sync audit, which revealed main was 3 commits behind origin (sibling-session updates), surfaced the stale stash, and led to the full cleanup sweep.

---

## Action Timeline

1. Verify ports — discovered user's vite died; restarted via preview tool (port 5173).
2. User QA shows blank counter despite Freddy + speech bubble visible.
3. DOM inspection: pieces/boxes ARE in DOM at correct positions — invisible due to z-index.
4. Confirmed: RestaurantScene wood-counter PNG at z-20; LessonV3 wrapper had no z-index.
5. Fixed with `z-[25]` on LessonV3 wrapper; verified live — pieces + boxes now visible.
6. User QA round 2: box positions wrong, "MAYA" label unreadable on wood counter.
7. Refactored to viewport-relative layout via `getLayout`; reworked GuestBox label to paper pill above box edge.
8. User QA round 3: boxes too far left, drag z-order wrong.
9. Right-aligned boxes (`width - 220` ≈ mute-toggle right edge); reordered render so boxes paint below pizzas.
10. User: "move up more, add CvToggle + ToolPicker, label down 4–8px overlapping box, label z = box+1".
11. Shifted boxes up further; added `CvToggle` (self-positions) + `ToolPicker` (in absolute wrapper); label nudged to `top: -8`; label z-index lowered to `z-[1]`.
12. CvToggle errored at runtime — needed `cv` prop; passed from LessonV3's `cv` (was being ignored as `_cv`).
13. User: v2 interaction polish missing — flagged hover, custom cursor, slice burst, drop-zone reactions.
14. Read `PizzaPiece`, `DeliveryBox`, `LessonTable` for the polish hooks; PizzaPiece already had hover + drag + `dropZoneTest` baked in.
15. Ported missing pieces: `GuestBox` drag-over glow via global pointermove listener + motion.div filter; `dropZoneTest` callback in LessonV3 → shrinks pizzas over boxes; `bursts` state + `SliceBurst` triggered on tap-slice; `data-cursor-pointing` on wrapper.
16. User: blank white screen at localhost:5173.
17. Diagnosed: dev server fine (HTTP 200 + valid HTML), code clean. Polish commits had landed on `feature/landing-page-polishing` (separate worktree's branch), not `main`. The branch the user's dev server was tracking didn't have the changes.
18. User authorized merge + push: committed untracked logs + Acutis PDF; merged `feature/landing-page-polishing` into `main` via `--no-ff`; pushed to github + labs (both via `origin` push URLs).
19. User asked for full sync audit: pulled 3 sibling commits from origin; committed another untracked log; pushed again.
20. Removed stale `SuperTutors-landing-polish` worktree; deleted merged branches (`feature/landing-page-polishing`, `claude/clever-driscoll-c39c77`).
21. Dropped the day-old `WIP: bento+ASL leftovers` stash per user authorization.
22. Final state: one worktree, one branch (`main`), in sync with both remotes, clean working tree, no stashes.

---

## Open Threads / Next Steps

- **ToolPicker is non-functional in V3.** It renders but V3's `handlePieceTap` calls `slice()` regardless of `toolMode`. One-line fix in `handlePieceTap` to gate on `useTutorStore.getState().toolMode === "cutter"` — flagged but not implemented.
- **Hover glow / shrink / slice burst not visually verified.** Static screenshots can't capture dynamic interactions; need user to drag a pizza over a box and tap to slice to confirm the polish actually fires in the live browser.
- **Audio still not recorded.** Text bubbles only across all 36 beats. ~50 ElevenLabs takes queued from the prior session; nothing recorded yet.
- **CV mode integration is button-only.** `CvToggle` shows in bottom-left, but the full CV pointer pipeline (HandTracker, `usePointerFromHand`, overlay) isn't wired into V3.
- **Scene transitions still instant** (`resetTo` swap, no animation). PRD calls for in-world flow (old box contents → DeliveryBox, new pizzas via `addPizza` slide-in).
- **E2E tests for V3 still missing.** Unit + primitive tests exist; no Playwright flow covering the 36-beat happy path or the stop-here branch.
- **Voice tuning** — current text is verbatim Synthesis (with cookies → pizzas swap). Required follow-up commit per ADR §4.
