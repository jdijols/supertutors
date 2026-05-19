# Stately — canonical machine source

This folder holds the **canonical XState v5 lesson machine** — the source of truth that gets pasted into the [Stately Editor](https://stately.ai/registry/editor/embed/ce0f4ea4-b58e-44d6-9305-afb270205f0a?machineId=2e541cb9-eef4-4c18-8720-0f4719b24692&mode=design) for visual authoring, and pasted back when Jason exports refinements.

## One machine, all beats nested

We use a **single root machine** with each of the 8 lesson beats nested as a **compound state**. This is the standard XState v5 hierarchical pattern.

**Why one machine, not eight:**
- The top-level diagram shows the full lesson flow in one view (splash → welcomeTour → sandbox → firstGuest → twoGuests → aha → check → win)
- Beat-to-beat transitions are explicit (`onDone` on each compound state)
- Stately's editor supports drill-down — collapse the parent view to author one beat at a time without losing the whole flow
- Lesson-wide events (RESET, demo-mode beat jumps) live at the root cleanly
- One file is the source of truth — no duplication, no sync issues, no drift

Production code (`src/modules/tutor/tutorMachine.ts`) imports the same machine — what runs in the app is what you see in Stately.

## Round-trip workflow

1. **Open the machine in Stately** (the URL above — your Drafts → Untitled machine)
2. **Click the `<> Code` tab** at the top of the canvas
3. **Select all → paste in the contents of `lesson.ts`** (replaces existing code; Stately re-renders the diagram automatically)
4. **Author / refine** in the visual editor — dialogue goes in state and transition `description` fields (right-side panel when a node or arrow is selected)
5. **Round-trip back to the repo:** Code tab → select all → copy → paste over `stately/lesson.ts` in your local editor → commit with `PT.3: <what changed>` → push
6. **Claude integrates** the updated machine into `src/modules/tutor/tutorMachine.ts` and runs `npm run generate-voice` to produce MP3s

## Files

| File | Purpose |
|---|---|
| `lesson.ts` | Canonical lesson machine — all 8 beats. Round-trip target. |
| `README.md` | This file — workflow + conventions. |

## Beat-authoring status

| Beat | State in `lesson.ts` | Status |
|---|---|---|
| 1 — Splash | `states.splash` | stub (greeting → ready → done) — TODO J |
| 1.5 — Welcome Tour | `states.welcomeTour` | stub (intro → done) — TODO J |
| 2 — Sandbox | `states.sandbox` | stub (playing → done) — TODO J |
| 3 — First Guest | `states.firstGuest` | stub (arrival → done) — TODO J |
| 4 — Two Guests | `states.twoGuests` | stub (arrival → done) — TODO J |
| **5 — AHA** | **`states.aha`** | **✓ fleshed out (10 sub-states matching PRD §5.1 + §5.1.1) — Jason refines** |
| 6 — Check | `states.check` | stub (intro → done) — TODO J |
| 7 — Win | `states.win` | stub (celebrating → done) — TODO J |

## Dialogue convention

Dialogue lives in state and transition **`description`** fields, prefixed with `FREDDY:` (or `GUEST:` for non-Freddy lines) so it's scannable in Stately's right-side panel. The `{{NAME}}` placeholder marks where the kid's name MP3 gets stitched at runtime (see PRD §3.11).

When Claude integrates the updated machine, dialogue text gets extracted into `src/modules/tutor/dialogue.json` (via the planned `npm run extract-dialogue` script) and fed to the ElevenLabs voice pipeline.
