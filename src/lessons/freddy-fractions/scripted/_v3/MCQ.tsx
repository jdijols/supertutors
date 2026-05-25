import { motion } from "framer-motion";

/**
 * MCQ — chip-style multiple-choice selector for V3 lesson beats.
 *
 * Two modes per the contract in `Freddy-Fractions/CONTEXT.md`:
 *
 *   - `any-advances`: any pick fires `onAnswer(value)` and the lesson
 *     advances. Used for silly distractors ("give it to the dog") and
 *     Yes/No checkpoints where both routes are valid.
 *   - `re-prompt-until-correct`: only `correctValue` advances the lesson;
 *     wrong picks fire `onWrong(value)` so the parent can play a hint
 *     line, then the kid picks again. Used for genuine comprehension
 *     checks where the wrong answer reveals a misconception that should
 *     be corrected, not papered over.
 *
 * Pure render — caller manages re-prompt state via the `onWrong`
 * callback (typically by setting hint text in a speech bubble, then
 * leaving the MCQ visible so the kid can re-pick).
 */

export type MCQMode = "any-advances" | "re-prompt-until-correct";

export interface MCQOption<T = string> {
  /** Stable value passed to onAnswer / onWrong when this option is picked. */
  value: T;
  /** Label rendered on the chip. */
  label: string;
}

export interface MCQProps<T = string> {
  /** Question text rendered above the chips. */
  question: string;
  /** The choices to render as chips. 2–6 typical. */
  options: MCQOption<T>[];
  /** Required for re-prompt-until-correct mode. Must equal one of the
   *  `options[].value` and counts as the only answer that advances. */
  correctValue?: T;
  /** Defaults to `any-advances`. */
  mode?: MCQMode;
  /** Fires when an answer should advance the lesson:
   *  - any-advances: on any pick
   *  - re-prompt-until-correct: only when `correctValue` is picked */
  onAnswer: (value: T) => void;
  /** Fires when the kid picks a wrong answer in re-prompt mode.
   *  The parent should display a hint and leave the MCQ visible so
   *  the kid can pick again. No-op in any-advances mode. */
  onWrong?: (value: T) => void;
}

export function MCQ<T = string>({
  question,
  options,
  correctValue,
  mode = "any-advances",
  onAnswer,
  onWrong,
}: MCQProps<T>) {
  function handlePick(value: T) {
    if (mode === "any-advances") {
      onAnswer(value);
      return;
    }
    // re-prompt-until-correct
    if (value === correctValue) {
      onAnswer(value);
    } else {
      onWrong?.(value);
    }
  }

  return (
    <div data-testid="mcq" className="flex flex-col gap-3">
      <p
        data-testid="mcq-question"
        className="font-sans text-base text-sb-ink"
      >
        {question}
      </p>
      <div
        data-testid="mcq-options"
        role="group"
        aria-label="Answer choices"
        className="flex flex-wrap gap-2"
      >
        {options.map((opt) => (
          <motion.button
            key={String(opt.value)}
            data-testid="mcq-chip"
            data-value={String(opt.value)}
            type="button"
            onClick={() => handlePick(opt.value)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            className="px-4 py-2 rounded-full bg-sb-paper text-sb-ink border-2 border-sb-ink font-mono uppercase tracking-[0.14em] text-sm shadow-xl shadow-sb-accent-deep/25 hover:bg-sb-paper/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface transition-colors duration-200 cursor-pointer"
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
