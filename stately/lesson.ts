/**
 * SuperTutors lesson — canonical XState v5 machine.
 *
 * CANONICAL SOURCE for Stately authoring. One machine, all 8 beats nested
 * as compound states. The top-level diagram shows the lesson flow
 * (splash → welcomeTour → sandbox → firstGuest → twoGuests → aha →
 * check → win); drill into any beat to author its internal states.
 *
 * Beat 5 (AHA) is fully fleshed out — see PRD §5.1 + §5.1.1.
 * Beats 1, 1.5, 2, 3, 4, 6, 7 are minimal stubs (entry line → done)
 * that Jason will author in Stately during P4.
 *
 * Round-trip:
 *   1. Copy the entire createMachine(...) call below.
 *   2. In Stately Editor → Code tab, paste it (replacing existing code).
 *   3. Author dialogue in state/transition `description` fields.
 *   4. Copy back from Stately's Code tab → paste over this file.
 *   5. Commit with message: `PT.3: <what changed>`
 *
 * Voice: Super Mario meets Jersey Shore. {{NAME}} = kid's name (stitched
 * at runtime per PRD §3.11).
 */
import { createMachine } from "xstate";

export const lessonMachine = createMachine({
  id: "supertutors_lesson",
  initial: "splash",
  context: {
    name: "",
  },
  types: {
    context: {} as { name: string },
    events: {} as
      | { type: "DIALOGUE_DONE" }
      | { type: "ANIMATION_DONE" }
      | { type: "NAME_ENTERED"; name: string }
      | { type: "SLICED"; pieceId: string; parentFraction: string }
      | { type: "PROXIMITY"; comparison: "equal" | "not_equal" }
      | { type: "TAPPED"; pieceId: string; hasTopping: boolean }
      | { type: "DELIVERED"; pieceId: string; guestId: string }
      | { type: "RESET" },
  },
  states: {
    // ─────────────────────────────────────────────────────────────
    // BEAT 1 — Splash
    // ─────────────────────────────────────────────────────────────
    splash: {
      description:
        'Beat 1 — Splash screen. Freddy introduces himself and asks the kid\'s name. Behind the scenes the name MP3 prefetch fires so audio is ready by Beat 1.5.\n\nFREDDY: "Heyyy, welcome to SuperSlice! I\'m Freddy Fractions. What\'s your name, kid?"\n\n(TODO: J to author in Stately)',
      initial: "greeting",
      states: {
        greeting: {
          entry: "playDialogue.splash_greet",
          on: {
            NAME_ENTERED: { target: "ready" },
          },
        },
        ready: {
          description:
            'Kid entered name. Freddy confirms warmly with the name spoken aloud.\n\nFREDDY: "Ready to slice some pizza, {{NAME}}?"',
          entry: "playDialogue.splash_ready",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        done: { type: "final" },
      },
      onDone: { target: "welcomeTour" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 1.5 — Welcome Tour ("Count the Pepperoni")
    // ─────────────────────────────────────────────────────────────
    welcomeTour: {
      description:
        'Beat 1.5 — Welcome Tour. Explicit numerator/denominator vocabulary via counting pepperoni on a sample pizza. Tools are HIDDEN — only interaction is tapping slices.\n\nFREDDY: "Before our guests arrive, lemme show ya how we talk about pizzas around here. Look at this pizza, {{NAME}} — how many slices got pepperoni?"\n\n(TODO: J to author counting sub-machine — tap pepperoni → counter increments → name numerator → tap total → name denominator → 1-2 variations → exit)',
      initial: "intro",
      states: {
        intro: {
          entry: "playDialogue.welcome_intro",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        // TODO: count_pepperoni, count_total, reveal_vocab, variation_1, variation_2
        done: { type: "final" },
      },
      onDone: { target: "sandbox" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 2 — Sandbox / Explore
    // ─────────────────────────────────────────────────────────────
    sandbox: {
      description:
        'Beat 2 — Sandbox. Tools fade in. Free play with slicer + glove. Fraction toasts on every slice. Tutorial-by-doing. Exits after a "ready" trigger (TBD — could be a timer, a min-actions count, or kid taps a "next" button).\n\nFREDDY: "Alright {{NAME}}, your turn — go ahead, try makin\' some pizzas! Slice \'em however ya want."\n\n(TODO: J to author. Most complex beat — many possible student actions.)',
      initial: "playing",
      states: {
        playing: {
          entry: "playDialogue.sandbox_intro",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        // TODO: free-play sub-states + toast triggers + ready signal
        done: { type: "final" },
      },
      onDone: { target: "firstGuest" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 3 — First Guest
    // ─────────────────────────────────────────────────────────────
    firstGuest: {
      description:
        'Beat 3 — First guest arrives at the restaurant. Asks for a simple share. Kid slices, delivers via glove, guest smiles. First win.\n\nFREDDY: "Oh hey {{NAME}}, our first customer just walked in! Let\'s see what they want."\nGUEST: "Hiya — could I please have half the pizza?"\n\n(TODO: J to author. Linear with one wrong-amount branch.)',
      initial: "arrival",
      states: {
        arrival: {
          entry: "playDialogue.first_guest_arrival",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        // TODO: order_received, waiting_for_delivery, delivered_correct, delivered_wrong
        done: { type: "final" },
      },
      onDone: { target: "twoGuests" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 4 — Two Guests, Equal Share
    // ─────────────────────────────────────────────────────────────
    twoGuests: {
      description:
        'Beat 4 — A second guest arrives. Both want equal pizza. Kid figures out halves. Both smile.\n\nFREDDY: "Lookit that, another customer! And it sounds like they want the same as the first one."\n\n(TODO: J to author. Linear with proportional-wrong branches.)',
      initial: "arrival",
      states: {
        arrival: {
          entry: "playDialogue.two_guests_arrival",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        // TODO: order_received, waiting_for_delivery, both_smile_check, unequal_branch
        done: { type: "final" },
      },
      onDone: { target: "aha" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 5 — THE AHA (fully fleshed out — see PRD §5.1 + §5.1.1)
    // ─────────────────────────────────────────────────────────────
    aha: {
      description:
        "Beat 5 — THE AHA. Fraction equivalence reveal. The load-bearing beat. See PRD §5.1 / §5.1.1.",
      initial: "setup",
      states: {
        setup: {
          description:
            'Beat 5 entry. Seeds a fresh halved pizza on the table if none exists (precondition guard — PRD §5.1.1 Issue #1). Plays Freddy\'s setup line, then waits for the slice.\n\nFREDDY: "Hey {{NAME}}, c\'mere! Wanna see somethin\' really cool? I just pulled this fresh pizza outta the oven — already cut in half, see? Try slicin\' one of those halves one more time. Just for me, okay?"',
          entry: ["seedHalvedPizza", "playDialogue.aha_setup"],
          on: {
            DIALOGUE_DONE: { target: "waiting_for_slice" },
          },
        },

        waiting_for_slice: {
          description:
            "Idle. Expecting the kid to slice one of the existing halves.\nInputs accepted: SLICED event on any piece. Branches on whether the parent piece was a 1/2 or not.\nTimeout: 30s → stuck.",
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
            'Kid sliced something other than a half (the whole pizza, a quarter, or another piece). Warm redirect.\n\nFREDDY: "Whoa whoa whoa, nice cut! But hey, try slicin\' one of the halves we already made, not the big pie. You got this, {{NAME}}."',
          entry: "playDialogue.aha_wrong_slice",
          on: {
            DIALOGUE_DONE: { target: "waiting_for_slice" },
          },
        },

        stuck: {
          description:
            'Gentle nudge after 30s of no slice.\n\nFREDDY: "You okay over there, {{NAME}}? Just tap the slicer right on one of those halves and drag it across. Nothin\' to it."',
          entry: "playDialogue.aha_stuck",
          on: {
            DIALOGUE_DONE: { target: "waiting_for_slice" },
          },
        },

        sliced_correctly: {
          description:
            'Kid successfully sliced a half into two quarters. Two new pieces appear on the table. Prompt the drag-to-compare.\n\nFREDDY: "Ohhh yeah, look at that! Now you got two pieces — two quarters! Now do me a favor — drag those two little quarters right next to the other half. Right next to it. Whatcha see?"',
          entry: "playDialogue.aha_compare_prompt",
          on: {
            DIALOGUE_DONE: { target: "waiting_for_compare" },
          },
        },

        waiting_for_compare: {
          description:
            "Idle. Expecting the kid to drag pieces close enough for proximity detection to fire.\nInputs accepted: PROXIMITY event with comparison='equal' or 'not_equal'.\nTimeout: 30s → stuck_compare.",
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
            'Pieces are close but areas don\'t match. Encouraging hint to align the right groups.\n\nFREDDY: "Hmmm, close, but not quite. Try movin\' those two quarters real close — right up against the half. Side by side, capisce?"',
          entry: "playDialogue.aha_not_equal",
          on: {
            DIALOGUE_DONE: { target: "waiting_for_compare" },
          },
        },

        stuck_compare: {
          description:
            'Kid not moving pieces after 30s. Push them to slide together.\n\nFREDDY: "Slide \'em together, {{NAME}}. The two quarters and the half — right up next to each other. You\'ll see somethin\' cool happen."',
          entry: "playDialogue.aha_stuck_compare",
          on: {
            DIALOGUE_DONE: { target: "waiting_for_compare" },
          },
        },

        aha_triggered: {
          description:
            "Proximity equal! Play the cinematic snap-align + glow + chime animation. Wait for ANIMATION_DONE before the reveal.",
          entry: "playAhaAnimation",
          on: {
            ANIMATION_DONE: { target: "celebrating" },
          },
        },

        celebrating: {
          description:
            'Cinematic reveal. Freddy names the equivalence explicitly.\n\nFREDDY: "WHOA. WHOA WHOA WHOA. {{NAME}}, look at this! One half and two quarters — they\'re the SAME SIZE! Boom — that\'s called fraction equivalence! 1/2 equals 2/4! Mama mia, you just figured out somethin\' real! Bellissimo!"',
          entry: "playDialogue.aha_reveal",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },

        done: {
          description:
            "Beat 5 complete. Parent transitions to Beat 6 (Check for Understanding).",
          type: "final",
        },
      },
      onDone: { target: "check" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 6 — Check for Understanding
    // ─────────────────────────────────────────────────────────────
    check: {
      description:
        'Beat 6 — Mastery check. 2-3 short problems using drag-to-compare proximity mechanic. Branching dialogue on wrong answers.\n\nFREDDY: "Alright {{NAME}}, let\'s see if you really got it. I\'m gonna give ya a couple little challenges."\n\n(TODO: J to author. 2-3 sub-machines, each one a mini problem.)',
      initial: "intro",
      states: {
        intro: {
          entry: "playDialogue.check_intro",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        // TODO: problem_1, problem_2, problem_3
        done: { type: "final" },
      },
      onDone: { target: "win" },
    },

    // ─────────────────────────────────────────────────────────────
    // BEAT 7 — Win
    // ─────────────────────────────────────────────────────────────
    win: {
      description:
        'Beat 7 — Celebration. All guests smile. Full-screen confetti. Freddy celebrates by name.\n\nFREDDY: "{{NAME}}, you did it! Look at all these happy customers! You\'re officially a fractions champion. Whaddaya say we do it again sometime?"',
      initial: "celebrating",
      states: {
        celebrating: {
          entry: ["playWinAnimation", "playDialogue.win_celebrate"],
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        done: {
          description:
            "Lesson complete. App can return to landing or offer replay.",
          type: "final",
        },
      },
      type: "final",
    },
  },

  on: {
    // Lesson-wide events
    RESET: { target: ".splash" },
  },
});
