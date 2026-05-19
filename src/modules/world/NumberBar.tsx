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
      className="flex items-center gap-2 p-3 bg-white/95 backdrop-blur rounded-2xl shadow-xl shadow-terracotta-300/30 border-2 border-terracotta-200"
    >
      {label && (
        <span className="font-display text-sm text-terracotta-600 px-2">
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
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-mozzarella-100 hover:bg-mozzarella-200 active:bg-terracotta-100 font-display text-2xl text-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-300"
          aria-label={`Enter ${d}`}
        >
          {d}
        </motion.button>
      ))}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onDelete}
        className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-tomato-400 hover:bg-tomato-500 active:bg-tomato-600 text-white text-2xl focus:outline-none focus:ring-4 focus:ring-tomato-400/40"
        aria-label="Delete last digit"
      >
        ⌫
      </motion.button>
    </motion.div>
  );
}
