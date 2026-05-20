import { motion } from "framer-motion";

/**
 * InputField — tappable numeric target that pairs with the NumberBar.
 *
 * The kid taps this field to focus it; the NumberBar appears and routes
 * digits into the field via the parent's state. The field shows the
 * currently-entered value (or a "?" placeholder when empty).
 *
 * Visual emphasis when focused: thicker ring, slight scale, "tap me" hint.
 */
export interface InputFieldProps {
  value: number | null;
  focused: boolean;
  onFocus: () => void;
  /** Optional aria-label describing what's being entered. */
  label?: string;
}

export function InputField({ value, focused, onFocus, label }: InputFieldProps) {
  return (
    <motion.button
      type="button"
      onClick={onFocus}
      aria-label={label || "Tap to enter a number"}
      data-testid="input-field"
      data-focused={focused}
      animate={focused ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`
        inline-flex items-center justify-center min-w-[64px] h-16 px-4
        rounded-2xl bg-sb-paper text-3xl font-mono font-bold
        text-sb-ink shadow-md shadow-sb-accent-deep/20
        transition-colors
        ${
          focused
            ? "border-2 border-sb-ink ring-2 ring-sb-accent ring-offset-2 ring-offset-sb-paper-soft"
            : "border-2 border-sb-ink/40"
        }
        focus:outline-none
      `}
    >
      {value !== null ? value : "?"}
    </motion.button>
  );
}
