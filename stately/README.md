# Stately — canonical machine source

This folder holds the **canonical XState v5 machine for each lesson beat**. These files are the source of truth that gets pasted into the [Stately Editor](https://stately.ai/registry/editor/embed/ce0f4ea4-b58e-44d6-9305-afb270205f0a?machineId=2e541cb9-eef4-4c18-8720-0f4719b24692&mode=design) for visual authoring, and pasted back when Jason exports refinements.

## Round-trip workflow

1. **Edit a beat in Stately:**
   - Open the machine in Stately
   - Click the **Code** tab at the top of the canvas
   - Select all the existing code and replace it with the contents of (e.g.) `beat5-aha.ts`
   - Stately re-renders the diagram from the code
2. **Author / refine** dialogue in state and transition descriptions (right-side panel when a node or arrow is selected)
3. **Export back to the repo:**
   - In the **Code** tab, select all → copy
   - Paste back into the corresponding `stately/beatN-*.ts` file (replacing the previous contents)
   - Commit with message `PT.3: Beat 5 — refined dialogue / branches`
4. **Claude integrates** the updated beat into `src/modules/tutor/tutorMachine.ts` and runs `npm run generate-voice` to produce MP3s.

## File-per-beat convention

| File | Beat | Status |
|---|---|---|
| `beat5-aha.ts` | Beat 5 — the AHA | initial skeleton ready for Jason to paste into Stately |
| `beat1-splash.ts` | Beat 1 — Splash | TBD (P4.1) |
| `beat1.5-welcome-tour.ts` | Beat 1.5 — Welcome Tour | TBD (P4.2) |
| `beat2-sandbox.ts` | Beat 2 — Sandbox | TBD (P4.3) |
| `beat3-first-guest.ts` | Beat 3 — First Guest | TBD (P4.4) |
| `beat4-two-guests.ts` | Beat 4 — Two Guests | TBD (P4.5) |
| `beat6-check.ts` | Beat 6 — Check | TBD (P4.6) |
| `beat7-win.ts` | Beat 7 — Win | TBD (P4.7) |

## Dialogue convention

Dialogue lives in state and transition **`description`** fields, prefixed with `FREDDY:` so it's scannable in Stately's right-side panel. The `{{NAME}}` placeholder marks where the kid's name MP3 gets stitched at runtime (see PRD §3.11).

When Claude integrates an updated beat, the dialogue text gets extracted into `src/modules/tutor/dialogue.json` (via the planned `npm run extract-dialogue` script) and fed to the ElevenLabs voice pipeline.
