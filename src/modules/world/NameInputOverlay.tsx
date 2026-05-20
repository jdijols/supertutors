import { useState } from "react";
import { motion } from "framer-motion";

/**
 * NameInputOverlay — one-time name capture during onboarding.
 *
 * This is the ONLY place in the lesson where the iPad system keyboard
 * is allowed to slide up (per design decision 2026-05-19). Every other
 * input in the lesson is in-world UI (NumberBar, tappable buttons,
 * gesture on manipulative).
 *
 * Renders as a centered card overlaid on the workspace, anchored
 * conceptually near Freddy. Auto-focuses the input on mount so the
 * keyboard slides up immediately.
 */
export interface NameInputOverlayProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

export function NameInputOverlay({ open, onSubmit }: NameInputOverlayProps) {
  const [value, setValue] = useState("");
  if (!open) return null;

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 32;

  return (
    <motion.div
      data-testid="name-input-overlay"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="bg-sb-paper rounded-3xl shadow-2xl shadow-sb-accent-deep/30 border-2 border-sb-ink p-6 max-w-md w-full"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(trimmed);
        }}
      >
        <label
          htmlFor="kid-name"
          className="block font-mono uppercase tracking-[0.18em] text-[11px] text-sb-accent-deep mb-3 text-center"
        >
          What&apos;s your name?
        </label>
        <input
          id="kid-name"
          name="name"
          type="text"
          autoFocus
          autoComplete="given-name"
          maxLength={32}
          inputMode="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your name"
          className="w-full text-2xl text-center font-sans py-4 px-5 rounded-2xl bg-sb-card border-2 border-sb-border focus:border-sb-ink focus:outline-none text-sb-ink placeholder:text-sb-subtle"
        />
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.97 } : undefined}
          className="mt-4 w-full py-4 rounded-2xl bg-sb-ink text-white font-mono uppercase tracking-[0.12em] text-base shadow-lg shadow-sb-ink/30 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sb-accent focus:ring-offset-2 focus:ring-offset-sb-paper"
        >
          {canSubmit ? `Nice to meet you, ${trimmed}` : "Tell Freddy your name"}
        </motion.button>
      </form>
    </motion.div>
  );
}
