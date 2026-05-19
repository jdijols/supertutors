/**
 * Beat 5 — AHA (fraction equivalence reveal)
 *
 * CANONICAL SOURCE for Stately authoring.
 *
 * Workflow:
 *   1. Copy the createMachine(...) call below.
 *   2. In Stately Editor → Code tab, paste it (replacing existing code).
 *   3. Stately re-renders the diagram. Refine dialogue in state/transition
 *      `description` fields. Add wrong-answer recoveries you think of.
 *   4. Copy back from Stately's Code tab and replace this file.
 *   5. Commit with message: `PT.3: Beat 5 — <what you changed>`
 *
 * See PRD §5.1, §5.1.1, and stately/README.md for the round-trip.
 *
 * Voice: Super Mario meets Jersey Shore. Warm, expressive, Italian-American
 * chef. {{NAME}} = kid's name (stitched at runtime).
 */
import { createMachine } from "xstate";

export const beat5AhaMachine = createMachine({
  id: "beat5_aha",
  initial: "setup",
  context: {
    name: "",
  },
  types: {
    context: {} as { name: string },
    events: {} as
      | { type: "DIALOGUE_DONE" }
      | { type: "ANIMATION_DONE" }
      | { type: "SLICED"; pieceId: string; parentFraction: string }
      | { type: "PROXIMITY"; comparison: "equal" | "not_equal" },
  },
  states: {
    setup: {
      description:
        "Beat 5 entry. Seeds a fresh halved pizza on the table if none exists (precondition guard — see PRD §5.1.1 Issue #1). Plays Freddy's setup line, then waits for the slice.\n\nFREDDY: \"Hey {{NAME}}, c'mere! Wanna see somethin' really cool? I just pulled this fresh pizza outta the oven — already cut in half, see? Try slicin' one of those halves one more time. Just for me, okay?\"",
      entry: ["seedHalvedPizza", "playDialogue.aha_setup"],
      on: {
        DIALOGUE_DONE: { target: "waiting_for_slice" },
      },
    },

    waiting_for_slice: {
      description:
        "Idle. Expecting the kid to slice one of the existing halves.\n\nInputs accepted: SLICED event on any piece. Branches on whether the parent piece was a 1/2 or not.\nTimeout: 30s → stuck.",
      on: {
        SLICED: [
          {
            target: "sliced_correctly",
            guard: "isHalfPiece",
          },
          {
            target: "wrong_slice",
          },
        ],
      },
      after: {
        "30000": { target: "stuck" },
      },
    },

    wrong_slice: {
      description:
        "Kid sliced something other than a half (the whole pizza, a quarter, or another piece). Warm redirect back to the half target.\n\nFREDDY: \"Whoa whoa whoa, nice cut! But hey, try slicin' one of the halves we already made, not the big pie. You got this, {{NAME}}.\"",
      entry: "playDialogue.aha_wrong_slice",
      on: {
        DIALOGUE_DONE: { target: "waiting_for_slice" },
      },
    },

    stuck: {
      description:
        "30 seconds passed with no slice. Gentle nudge — assume the kid is unsure where to tap.\n\nFREDDY: \"You okay over there, {{NAME}}? Just tap the slicer right on one of those halves and drag it across. Nothin' to it.\"",
      entry: "playDialogue.aha_stuck",
      on: {
        DIALOGUE_DONE: { target: "waiting_for_slice" },
      },
    },

    sliced_correctly: {
      description:
        "Kid successfully sliced a half into two quarters. Two new pieces appear on the table. Prompt the next step: drag-to-compare.\n\nFREDDY: \"Ohhh yeah, look at that! Now you got two pieces — two quarters! Now do me a favor — drag those two little quarters right next to the other half. Right next to it. Whatcha see?\"",
      entry: "playDialogue.aha_compare_prompt",
      on: {
        DIALOGUE_DONE: { target: "waiting_for_compare" },
      },
    },

    waiting_for_compare: {
      description:
        "Idle. Expecting the kid to drag pieces close enough together for proximity detection to fire.\n\nInputs accepted: PROXIMITY event with comparison='equal' or 'not_equal'.\nTimeout: 30s → stuck_compare.",
      on: {
        PROXIMITY: [
          {
            target: "aha_triggered",
            guard: "areasMatch",
          },
          {
            target: "not_equal",
          },
        ],
      },
      after: {
        "30000": { target: "stuck_compare" },
      },
    },

    not_equal: {
      description:
        "Kid moved pieces close together, but the total areas don't match (e.g., one quarter next to a half — not a match). Encouraging hint to align the right groups.\n\nFREDDY: \"Hmmm, close, but not quite. Try movin' those two quarters real close — right up against the half. Side by side, capisce?\"",
      entry: "playDialogue.aha_not_equal",
      on: {
        DIALOGUE_DONE: { target: "waiting_for_compare" },
      },
    },

    stuck_compare: {
      description:
        "30s passed with no proximity event. Kid is probably just looking at the pieces without moving them. Push them to slide together.\n\nFREDDY: \"Slide 'em together, {{NAME}}. The two quarters and the half — right up next to each other. You'll see somethin' cool happen.\"",
      entry: "playDialogue.aha_stuck_compare",
      on: {
        DIALOGUE_DONE: { target: "waiting_for_compare" },
      },
    },

    aha_triggered: {
      description:
        "Proximity equal! The two quarters' combined area matches the half's area. Play the cinematic snap-align + glow + chime animation. Wait for ANIMATION_DONE before delivering Freddy's reveal line.",
      entry: "playAhaAnimation",
      on: {
        ANIMATION_DONE: { target: "celebrating" },
      },
    },

    celebrating: {
      description:
        "Cinematic reveal. Freddy names the equivalence explicitly so the kid hears the math vocabulary tied to what they just saw.\n\nFREDDY: \"WHOA. WHOA WHOA WHOA. {{NAME}}, look at this! One half and two quarters — they're the SAME SIZE! Boom — that's called fraction equivalence! 1/2 equals 2/4! Mama mia, you just figured out somethin' real! Bellissimo!\"",
      entry: "playDialogue.aha_reveal",
      on: {
        DIALOGUE_DONE: { target: "done" },
      },
    },

    done: {
      description:
        "Beat 5 complete. Parent machine transitions to Beat 6 (Check for Understanding).",
      type: "final",
    },
  },
});
