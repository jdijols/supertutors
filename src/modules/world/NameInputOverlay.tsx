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
 * Chat-style row: small "WHAT'S YOUR NAME?" caption on top, then text
 * field on the left with a paper-plane send button on the right.
 * Compact so it sits unobtrusively at the bottom edge of the counter
 * (parent anchors this to align with the tool picker's bottom edge).
 * Auto-focuses on mount so the keyboard slides up immediately.
 */
export interface NameInputOverlayProps {
  open: boolean;
  onSubmit: (name: string) => void;
  /**
   * When true AND the input is empty, the whole container pulses (same
   * animation as the DeliveryBox cap-hint) to nudge the kid that it's
   * their turn. Stops automatically once they start typing.
   */
  pulse?: boolean;
}

export function NameInputOverlay({
  open,
  onSubmit,
  pulse = false,
}: NameInputOverlayProps) {
  const [value, setValue] = useState("");
  if (!open) return null;

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 32;
  // Pulse only when the parent asked for it AND the kid hasn't typed yet —
  // the moment they engage, kill the animation so it doesn't compete with
  // the active input.
  const shouldPulse = pulse && value.length === 0;

  return (
    <motion.div
      data-testid="name-input-overlay"
      data-cursor-pointing
      data-pulsing={shouldPulse}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`bg-sb-paper rounded-2xl shadow-2xl shadow-sb-accent-deep/30 border-2 border-sb-ink px-4 py-3 max-w-md w-full ${
        shouldPulse ? "delivery-pulse" : ""
      }`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(trimmed);
        }}
      >
        <label
          htmlFor="kid-name"
          className="block font-mono uppercase tracking-[0.18em] text-[10px] text-sb-ink mb-2 text-center"
        >
          What&apos;s your name?
        </label>
        <div className="flex items-center gap-2">
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
            data-cursor-text
            className="flex-1 min-w-0 text-lg font-sans py-2.5 px-4 rounded-xl bg-sb-card border-2 border-sb-border focus:border-sb-ink focus:outline-none text-sb-ink placeholder:text-sb-subtle"
          />
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.92 } : undefined}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            aria-label={
              canSubmit ? `Send name: ${trimmed}` : "Type your name to send"
            }
            className="shrink-0 w-12 h-12 grid place-items-center rounded-xl bg-sb-ink text-white shadow-lg shadow-sb-ink/30 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sb-accent focus:ring-offset-2 focus:ring-offset-sb-paper transition-opacity"
          >
            <PaperPlaneIcon />
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

function PaperPlaneIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Classic paper-plane silhouette: outer triangle + fold crease */}
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}
