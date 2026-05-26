import { motion } from "framer-motion";
import { useAuth } from "./useAuth";

/**
 * SignInButton — chrome button that opens the SignInDialog. Mirror of
 * UserMenu: only renders when signed-out, sits left of MuteToggle, and
 * shares the same chrome physics (spring, shadow, border).
 *
 * `inline` strips the fixed positioning so the parent surface can compose
 * the chrome into its own header row (LandingPage). Matches the
 * UserMenu/MuteToggle pattern exactly.
 */
export function SignInButton({
  onClick,
  inline = false,
}: {
  onClick: () => void;
  inline?: boolean;
}) {
  const { status } = useAuth();

  if (status !== "signed-out") return null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-label="Open sign in dialog"
      data-cursor-pointing
      className={`
        ${inline ? "" : "fixed top-4 right-36 sm:top-6 sm:right-[11rem] z-[60]"}
        h-14 sm:h-16 px-5 sm:px-6
        rounded-2xl border border-white/15
        bg-white/[0.04] text-sb-paper-soft/80
        font-mono font-bold text-[12px] sm:text-[13px] uppercase tracking-[0.18em]
        hover:bg-white/[0.08] hover:text-sb-paper-soft hover:border-white/25
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent
        focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink
      `}
    >
      Sign in
    </motion.button>
  );
}
