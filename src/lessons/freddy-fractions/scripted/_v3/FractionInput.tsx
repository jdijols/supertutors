import { useState } from "react";
import { motion } from "framer-motion";
import { NumberBar } from "../../scenes/world";

/**
 * FractionInput — kid types a fraction's numerator + denominator (V3).
 *
 * UX: two stacked boxes (numerator above, fraction bar, denominator
 * below). The kid types digits via the in-world `NumberBar` keypad
 * (no iPad system keyboard — see NameInputOverlay's comment for why).
 *
 * Fill order: numerator first, then denominator. The currently-empty
 * box is highlighted. When both boxes are filled, the input commits
 * once — either onAnswer (correct, or no expected) or onWrong
 * (validation failed).
 *
 * Delete removes the most recently typed digit. Parent can reset via
 * `key` prop change.
 */

export interface FractionInputProps {
  /** If provided, the input validates against this fraction. */
  expected?: { numerator: number; denominator: number };
  /** Fires when the kid completes the fraction and it matches `expected`
   *  (or when `expected` is undefined). */
  onAnswer: (numerator: number, denominator: number) => void;
  /** Fires when the kid completes with a wrong fraction. Parent should
   *  display a hint; this component does not auto-reset. */
  onWrong?: (numerator: number, denominator: number) => void;
}

export function FractionInput({
  expected,
  onAnswer,
  onWrong,
}: FractionInputProps) {
  const [numerator, setNumerator] = useState<number | undefined>(undefined);
  const [denominator, setDenominator] = useState<number | undefined>(undefined);
  const [committed, setCommitted] = useState(false);

  function commit(num: number, den: number) {
    if (committed) return;
    setCommitted(true);
    if (expected) {
      if (num === expected.numerator && den === expected.denominator) {
        onAnswer(num, den);
      } else {
        onWrong?.(num, den);
      }
    } else {
      onAnswer(num, den);
    }
  }

  function handleDigit(digit: number) {
    if (committed) return;
    if (numerator === undefined) {
      setNumerator(digit);
      return;
    }
    if (denominator === undefined) {
      setDenominator(digit);
      commit(numerator, digit);
    }
  }

  function handleDelete() {
    if (committed) return;
    if (denominator !== undefined) {
      setDenominator(undefined);
      return;
    }
    if (numerator !== undefined) {
      setNumerator(undefined);
    }
  }

  const numeratorActive = numerator === undefined;
  const denominatorActive = !numeratorActive && denominator === undefined;

  return (
    <div data-testid="fraction-input" className="flex flex-col gap-3 items-center">
      <div className="flex flex-col items-center gap-1">
        <Slot
          testId="fraction-input-numerator"
          value={numerator}
          active={numeratorActive}
        />
        <div className="w-20 h-[3px] bg-sb-ink rounded-full" />
        <Slot
          testId="fraction-input-denominator"
          value={denominator}
          active={denominatorActive}
        />
      </div>
      <NumberBar
        open
        onDigit={handleDigit}
        onDelete={handleDelete}
        label={numeratorActive ? "Top number" : "Bottom number"}
      />
    </div>
  );
}

interface SlotProps {
  testId: string;
  value: number | undefined;
  active: boolean;
}

function Slot({ testId, value, active }: SlotProps) {
  return (
    <motion.div
      data-testid={testId}
      data-active={active}
      animate={{
        borderColor: active ? "#1A1A1A" : "rgba(26, 26, 26, 0.25)",
        scale: active ? 1 : 0.95,
      }}
      transition={{ duration: 0.18 }}
      className="w-20 h-20 grid place-items-center rounded-2xl bg-sb-paper border-2 font-mono font-bold text-4xl text-sb-ink"
    >
      {value !== undefined ? value : ""}
    </motion.div>
  );
}
