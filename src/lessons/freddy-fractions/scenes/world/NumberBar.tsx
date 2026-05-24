import { motion } from "framer-motion";

/**
 * NumberBar — horizontal 1-9 + delete keypad for iPad-native numeric input.
 *
 * Lives in the bottom-LEFT of the workspace. Visible only when an
 * InputField has focus (caller controls via `open`). Tapping a digit
 * fires `onDigit`; tapping ⌫ fires `onDelete`.
 *
 * Avoids the system keyboard so the iPad's native input doesn't slide
 * up and cause a jarring UX shift.
 */
export interface NumberBarProps {
  open: boolean;
  onDigit: (digit: number) => void;
  onDelete: () => void;
  /** Optional label describing what's being entered, e.g. "Numerator". */
  label?: string;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function NumberBar({ open, onDigit, onDelete, label }: NumberBarProps) {
  if (!open) return null;
  return (
    <motion.div
      data-testid="number-bar"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="group"
      aria-label={label ? `${label} input` : "Number input"}
      className="flex items-center gap-2 p-3 bg-sb-paper/95 backdrop-blur rounded-2xl shadow-xl shadow-sb-accent-deep/25 border-2 border-sb-ink"
    >
      {label && (
        <span className="font-mono uppercase tracking-[0.18em] text-[11px] text-sb-accent-deep px-2">
          {label}
        </span>
      )}
      {DIGITS.map((d) => (
        <motion.button
          key={d}
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 600, damping: 20 }}
          onClick={() => onDigit(d)}
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-sb-card hover:bg-sb-paper-deep active:bg-sb-ink active:text-white font-mono font-bold text-2xl text-sb-ink focus:outline-none focus:ring-2 focus:ring-sb-accent focus:ring-offset-2 focus:ring-offset-sb-paper"
          aria-label={`Enter ${d}`}
        >
          {d}
        </motion.button>
      ))}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onDelete}
        className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-sb-ink hover:bg-sb-accent-deep text-white text-2xl focus:outline-none focus:ring-2 focus:ring-sb-accent focus:ring-offset-2 focus:ring-offset-sb-paper"
        aria-label="Delete last digit"
      >
        ⌫
      </motion.button>
    </motion.div>
  );
}
