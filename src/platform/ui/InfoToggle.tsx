import { motion } from "framer-motion";

/**
 * InfoToggle — fixed-position "About" button for the landing page.
 *
 * Sits in the same slot as ExitButton (immediately left of MuteToggle).
 * ExitButton is hidden on the landing route and InfoToggle is rendered
 * only on the landing route, so the two never co-exist.
 *
 * Visual state follows the system-wide "feature is ON = dark/active"
 * rule shared by MuteToggle, CvToggle, and ToolPicker: when the About
 * modal is open, the button is inverted (sb-ink fill + white icon);
 * when closed, it sits at rest (sb-paper fill + ink icon).
 */
export function InfoToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-label={active ? "Close about" : "About SuperTutors"}
      aria-pressed={active}
      data-testid="info-toggle"
      data-active={active}
      data-cursor-pointing
      className={`
        fixed top-4 right-20 sm:top-6 sm:right-24 z-[60]
        w-14 h-14 sm:w-16 sm:h-16
        rounded-2xl border-2 border-sb-ink
        shadow-xl shadow-sb-accent-deep/25
        flex items-center justify-center cursor-pointer
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
        ${
          active
            ? "bg-sb-ink text-white"
            : "bg-sb-paper text-sb-ink hover:bg-sb-paper-deep"
        }
      `}
    >
      <InfoIcon />
    </motion.button>
  );
}

function InfoIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.5" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <circle cx="12" cy="7.5" r="0.4" fill="currentColor" stroke="none" strokeWidth="2" />
    </svg>
  );
}
