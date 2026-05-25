# May 20, 2026 at 9:37 PM — Sandbox mechanics shipped end-to-end

## TL;DR

This chat took the SuperSlice sandbox preview from "raster pizza component exists" to "fully working Beat 2 mechanic" at `/preview/sandbox`. Jason generated 18 cheese-pizza PNGs (with 3 vertical-strip thirds for the Vocab lesson) + 5 tool sprite PNGs (5-finger palm-down white glove in open/closed/pointing + wood-handle chrome-blade pizza cutter in upright/cutting). Claude built `PizzaPiece` (two-layer wrapper for hit-target clipping without sacrificing the glow), `useSandboxPieces` (slice tree state), `Toast` (fraction labels), `ToolSprite` (JS-driven cursor that replaces a failed CSS-cursor approach), and the slicer mechanic — drag-to-cut fires on pointer-UP, children spawn at the parent's area split with a 32px gap, triangle eighths use clip-path so hit targets match the visible triangle. Roughly 11 task-tracker entries cleared in one session. All 114 unit tests green at every commit.

## Decisions

- **Author beats in narrative order rather than vertical-slice-first** — Jason's mental model is "writing a movie script": you can't write the AHA cold without writing the setup. Earlier vertical-slice-first plan abandoned. Safeguard: Beat 6 (AHA — renumbered from Beat 5) must be authored + wired by end-of-day Thursday or jump-skip there to lock the demo hero.
- **Pivot from procedural SVG to raster PNG for the pizza** — First-pass SVG looked flat-color clip-art against Freddy's Pixar-painted scene. Aesthetic gap can't close in our timeframe. ChatGPT/gpt-image-1 generates pixel-perfect style continuity in the same Freddy thread. PRD §3.10 + §3.12 reflect this.
- **Eliminate per-pepperoni tapping for Beat 3 vocab** — User re-read PRD §3.9: "tap pepperoni slices" means slices-with-pepperoni (the numerator over total slices = denominator), NOT individual pepperoni discs. Removed the tap-each-pepperoni concept everywhere.
- **Pizza variants: pepperoni-v1 + cheese-v1, thirds as display-only** — Cheese gets 18 PNGs (whole+halves+quarters+eighths+thirds) because Beat 3 introduces thirds as a static vocab example. Thirds are NOT part of the bisect slicing tree; added "1/3" to `PizzaFraction` for accessibility + data attribute only.
- **Compositional slice assets — don't try for pixel-perfect tile-mating** — ChatGPT can't reliably tile-match across 15 sequential generations. Each piece has its own organic pepperoni distribution; slicing animation = cutter-pass + new pieces appear, kid never sees before/after side-by-side anyway.
- **Eighths cut diagonally into right triangles, not rectangular strips** — Jason's call. 8 triangular slices per pizza, named `eighth-{quarter}-{retained-edge}.png` (e.g., `eighth-tl-t` = top-left quarter, top edge retained). Hypotenuses face inward.
- **Slice on pointer-UP, not during drag** — Drag-to-cut records the first piece the cursor crosses during a press; cut materializes at release. Realistic "roll the cutter, release, cut appears" feel. One slice per press (no cascading).
- **Cutter tool disables drag entirely** — `draggable={toolMode === "glove"}`. Cutter only slices, never moves. Glove only moves (taps are no-ops).
- **Slice positioning: children occupy parent area with 32px gap** — Previous logic used `parent.x ± offset` which overlapped because children have different dimensions than parent. New logic: whole→halves splits left/right with `parent.width/2 + halfGap` offset; half→quarters splits top/bottom; quarter→eighths uses "corner-pair" diagonal scheme (main drift perpendicular to retained crust edge + secondary drift parallel toward quarter's outer corner). Avoids X-pattern recombination.
- **Triangle hit targets via CSS clip-path** — Eighths have transparent corners in their square PNG frames; clicks/hovers in those corners would otherwise hit the wrong piece. `clip-path: polygon(...)` on the interactive wrapper clips both visual AND pointer-event area to the triangle.
- **Two-layer PizzaPiece architecture** — Original clip-path-on-wrapper clipped the drop-shadow glow too. Refactored into visual layer (drop-shadow, no clip-path, `pointer-events: none`) + interactive layer (clip-path, captures events). Both share `x`/`y` motion values for synced position.
- **Hover glow color: mozzarella-50 (#FFFBF2), not oven-glow** — Original warm orange blended into the wood counter. White-cream pops cleanly. Uses design tokens — not a random color.
- **Manual hover state via useState, not framer-motion whileHover** — `whileHover` was leaving residual filter state when motion values for x/y are driving the same element's transform. Manual `onPointerEnter`/`onPointerLeave` with explicit `animate` rest state is reliable.
- **Manual viewport clamping in onDrag** — Framer-motion's built-in `dragConstraints` (both ref-based and object-bounds) yielded asymmetric clamping (top under-clamped, bottom not clamped at all). Switched to a direct clamp on every drag frame against numeric `{ left, top: 24, right, bottom }` bounds. 24px top buffer for visual breathing room.
- **Pivot from CSS cursor URL to DOM-based ToolSprite** — Chrome on macOS silently failed to render custom `cursor: url(...)` in some regions despite the computed style being correct on every element in the inheritance chain (verified via a debug overlay). Pivoted to `cursor: none` on body + a `pointer-events: none` DOM sprite that follows the pointer with direct `style.transform` updates (no React re-renders). Variant swaps via `elementFromPoint` on every move.
- **Pointing-glove cursor over the ToolPicker** — `data-cursor-pointing` attribute on the picker container; ToolSprite detects it via `elementFromPoint().closest()` and renders the pointing variant regardless of which tool is active.
- **Update PRD/TASKS as living docs, not day-1 spec** — Feedback memory saved earlier this week: when chat decisions override an existing PRD/TASKS section, update the files in the same session. Anchoring on stale spec creates friction.

## Key Prompts & Responses

> **User:** "the whole idea of me authoring the beats in stately is not really what is going to work. What's going to work for my input is literally clicking through step by step. The entire lesson and writing it as we go. … I think of this task as more like writing a movie script. You can't just start in the middle and write a random scene."
>
> **Outcome:** Endorsed the linear-narrative authoring approach (replacing vertical-slice-first). Added a Thursday EOD safeguard for Beat 6 to lock the demo hero even if linear authoring runs long. Captured this as the new direction in TASKS Current Sprint.

> **User:** "Honestly, your SVG pizzas look really bad. I would not use them in my application. … I'm leaning towards just generating them as PNG and having a ton of variance."
>
> **Outcome:** Conceded SVG can't close the aesthetic gap with Freddy in our timeframe. Pivoted to ChatGPT-generated raster PNGs. Provided 4 sequential prompts for the user to paste into the existing Freddy ChatGPT thread. Pushed back on "ton of variance" — scoped to 15 PNGs per variant (compositional approach with independent piece styles, not pixel-perfect tile-mating).

> **User:** "On the cutter, drag to cut looks good, except we need the cut to be triggered at mouse up, not mouse down. … The cut needs to visually show with the bisected pieces after the mouse up has happened."
>
> **Outcome:** Rewrote the drag-to-cut listener. Now `pointerdown` resets a `pendingCutPieceRef`; `pointermove` records the first piece the cursor crosses; `pointerup` triggers the slice. Click-after-drag suppression flag prevents double-slicing when mouseup is on the recorded piece.

> **User:** "the cursor is still revolving back to the system cursor outside of pizza area … This is going to be very hard to debug without you seeing it. Let's do a debugging process here."
>
> **Outcome:** Added a live `CursorDebugOverlay` showing html.class, body.class, computed cursor at the pointer, and the inheritance chain. Debug confirmed the CSS was correct on every element in the chain — Chrome was silently refusing to render the custom cursor in some regions. Pivoted to JS-driven `ToolSprite` that bypasses Chrome's cursor engine entirely. Removed the debug overlay once the sprite shipped.

> **User:** "if we're cutting the quarters down to eighths, it actually appears as if the eighths are recombined into different quarters."
>
> **Outcome:** Diagnosed: original "perpendicular to diagonal" offset pulled eighths from adjacent quarters TOWARD each other in the middle; their bounding rectangles overlapped and hypotenuses crossed at the pizza center forming an X-pattern. New "corner-pair" scheme: main drift perpendicular to the retained crust edge (AWAY from pizza) + secondary drift parallel to that edge (toward the quarter's own outer corner). Triangles now form 4 distinct corner pairs matching their original quarters.

> **User:** "the polygon clipping that now clips the glow for these pieces on hover."
>
> **Outcome:** Diagnosed: `clip-path` on the wrapper clips the drop-shadow filter too. Refactored PizzaPiece into two sibling motion.divs: visual layer (drop-shadow, no clip-path, `pointer-events: none`) + interactive layer (clip-path, captures events). Shared `x`/`y` motion values keep them glued together. Glow now extends freely around the triangle silhouette while the hit target stays clipped.

> **User:** "I want to run a skill, and then, when that skill completes, another skill. … then I want us to commit and push all changes to our remote repos in GitLab and GitHub."
>
> **Outcome:** Executed the sequence: `update-docs` (this PRD/TASKS sync) → `document-chat` (this entry) → next: commit + dual-remote push.

## Files Touched

### New
- [src/modules/world/ToolSprite.tsx](src/modules/world/ToolSprite.tsx) — DOM-based pointer-following sprite, replaces CSS cursor approach
- [src/modules/table/PizzaPiece.tsx](src/modules/table/PizzaPiece.tsx) — Two-layer draggable wrapper (visual + interactive); manual hover state, viewport clamping, tap-after-drag suppression
- [src/modules/table/PizzaPiece.test.tsx](src/modules/table/PizzaPiece.test.tsx) — unit tests
- [src/modules/table/sliceLogic.ts](src/modules/table/sliceLogic.ts) — Pure slice math: PieceSlot union (whole/half/quarter/eighth), SLICE_MAP, `childOffsetsFor` with corner-pair eighth scheme, `dimsForSlot`, `assetSrcFor` with PizzaVariant ("pepperoni-v1" | "cheese-v1")
- [src/modules/table/sliceLogic.test.ts](src/modules/table/sliceLogic.test.ts) — 18 tests covering all slot decompositions + offsets + variant resolution
- [src/modules/table/useSandboxPieces.ts](src/modules/table/useSandboxPieces.ts) — React hook for slice tree state (slice/move/reset)
- [src/modules/table/useSandboxPieces.test.tsx](src/modules/table/useSandboxPieces.test.tsx) — hook tests
- [src/modules/table/index.ts](src/modules/table/index.ts) — barrel exports for the table module
- [src/modules/toast/Toast.tsx](src/modules/toast/Toast.tsx) — auto-dismissing fraction toast with spring entrance
- [src/modules/toast/fractionToastMessage.ts](src/modules/toast/fractionToastMessage.ts) — first-time vs repeat copy ("You made halves!" → "Halves!")
- [src/modules/toast/index.ts](src/modules/toast/index.ts) — barrel exports
- [src/modules/preview/SandboxPreview.tsx](src/modules/preview/SandboxPreview.tsx) — `/preview/sandbox` page wiring everything together
- [src/modules/preview/PizzaPreview.tsx](src/modules/preview/PizzaPreview.tsx) — `/preview/pizza` showing both variants + thirds
- [src/modules/preview/PizzaInScene.tsx](src/modules/preview/PizzaInScene.tsx) — `/preview/scene` for in-context visual verification
- [public/images/pizza/pepperoni-v1/](public/images/pizza/pepperoni-v1/) — 15 PNGs (whole + 2 halves + 4 quarters + 8 eighths)
- [public/images/pizza/cheese-v1/](public/images/pizza/cheese-v1/) — 18 PNGs (same matrix + 3 thirds)
- [public/images/ui/](public/images/ui/) — 5 sprite PNGs (glove-open/closed/pointing + cutter-upright/cutting) at 1000×1000 + 5 `*-cursor.png` 64×64 variants (the cursor variants are now unused but kept for reference)

### Modified
- [src/modules/table/Pizza.tsx](src/modules/table/Pizza.tsx) — Added "1/3" to PizzaFraction type + alt-text mapping
- [src/modules/world/ToolPicker.tsx](src/modules/world/ToolPicker.tsx) — Real artwork thumbnails replace emoji placeholders; `data-cursor-pointing` attribute added
- [src/modules/world/index.ts](src/modules/world/index.ts) — Exports ToolSprite
- [src/main.tsx](src/main.tsx) — `/preview/pizza`, `/preview/scene`, `/preview/sandbox` route registrations
- [src/styles/globals.css](src/styles/globals.css) — `cursor: none !important` on body/html/main when tool class is active; replaces an earlier multi-attempt CSS-cursor approach
- [PRD.md](PRD.md) — §3.12 Pizza row adds cheese-v1, thirds, two-layer PizzaPiece, clip-path triangle hit targets; Tools row replaces "Figma → SVG" with ChatGPT-generated glove + cutter rendered via DOM-based ToolSprite
- [TASKS.md](TASKS.md) — Current Sprint reflects shipped sandbox preview; P2.1–P2.5, P2.7, P2.9 marked done; new P2.12 entry for the ToolSprite system; PT.3 renumbered to Beat 6
- [README.md](README.md) — Status bumped off "Planning phase"; Tech Stack mentions ChatGPT instead of Midjourney for the manipulative/tool art

## Open Threads

- **`PRD.md` §5.1 / §5.1.1 still titled "Beat 5 (AHA)"** — Kept as-is for now (internal `aha_*` keys are stable filenames). Voice journal flagged the same. Will rename to "Beat 6 (AHA)" when the actual Stately authoring lands and we touch those sections.
- **`P2.6 — Proximity detection` not started** — Needed for Beat 7 (Check for Understanding) drag-to-compare. Not on the demo critical path until Beat 7 wiring.
- **`P2.10 — Playwright smoke test for slice + compare` not written** — Sandbox is manually verified. Could automate once Beat 6 / Beat 7 land for end-to-end coverage.
- **64×64 `*-cursor.png` variants in `public/images/ui/` are unused** — Created when we were still trying CSS cursors. Could delete in cleanup pass; harmless to keep.
- **First-pass procedural SVG Pizza component code is gone** — Replaced wholesale by the raster Pizza in this chat. No revert path other than git history.
- **`ToolSprite` size hardcoded at 56px** — Feels right at default viewport but might want a prop for per-context sizing later (e.g., bigger sprite on iPad).
- **No hit target verification on small overlapping eighth triangles when dragged on top of each other** — Current clip-path approach should handle it correctly; not stress-tested with extreme overlap scenarios.

## Next Steps

1. **Commit + dual-remote push (this session, after this entry)** — All chat work + the doc updates from `update-docs` + this journal. Push to both GitHub and GitLab via the existing dual-push `origin` remote.

2. **Author Beat 1 (Splash) in Stately (J — PT.3)** — Trivial linear beat to warm up on the Stately authoring workflow. `src/modules/tutor/tutorMachine.ts` has the placeholder. Acceptance: Stately URL public-shareable, exports to XState v5 TS without errors.

3. **Author Beat 2 (Sandbox) in Stately (J — PT.3)** — Most complex beat (free-form, many possible student actions). The mechanic is now built and stable at `/preview/sandbox` so this is purely about authoring the state machine + dialogue. Acceptance: state machine accepts SLICED + TOOL_CHANGED + READY_FOR_NEXT events with Jersey-Shore voice transitions.

4. **Wire AudioEngine into `tutorMachine.ts` playDialogue action (C — P1.3)** — Voice infrastructure is shipped (per [May-20-1142 journal](Journals/May-20-1142-voice-pipeline-shipped.md)); just needs the state-machine hookup once Beat 6 is authored. Replace the TODO at `src/modules/tutor/tutorMachine.ts:45-47` with `audioEngine.play({ dialogueKey: params.key, hasNameSlot: lineHasNameSlot(params.key), name: context.name ?? undefined, onDone: () => send({ type: 'DIALOGUE_DONE' }) })`. Acceptance: walking through any wired beat in the browser plays each dialogue line and advances the state machine on `onend`.

5. **Build Toast trigger system for Beat 2 (Sandbox)** — `src/modules/preview/SandboxPreview.tsx` already wires Toast for each slice event. When Beat 2 is wired to XState, the same toast firing needs to happen from the state machine's slice-event handler (not just the preview's local handler). Acceptance: "You made halves!" + "Now quarters!" + "Eighths!" all fire during the sandbox phase of the real `/lesson` flow.

6. **P2.6 — Proximity detection for Beat 7 (Check)** — `src/modules/table/proximity.ts` (new file). When 2+ pieces within ~20pt of each other, evaluate total area, emit `PROXIMITY_DETECTED`. Acceptance: unit test places pieces at known positions and verifies event payload; tune threshold empirically.

7. **iPad inspection (J — PT.4, PT.4 still blocked)** — Once Jason has the iPad, walk through `/preview/sandbox` on real iPad Safari. Verify: drag/slice feel responsive at touch, ToolSprite tracks finger correctly, no rubber-band scroll, audio works.

8. **(Optional cleanup) Remove unused `public/images/ui/*-cursor.png` 64×64 variants** — Created during CSS cursor attempts, superseded by full-size sprites in ToolSprite. Quick deletion + globals.css cleanup.

---

*Files to read first when resuming: [TASKS.md](TASKS.md) (Current Sprint section), [PRD.md](PRD.md) §3.9 + §3.12, and the previous journal entry [May-20-1142-voice-pipeline-shipped.md](Journals/May-20-1142-voice-pipeline-shipped.md) for the voice infrastructure context.*
