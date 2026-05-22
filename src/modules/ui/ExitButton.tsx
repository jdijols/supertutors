import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * ExitButton — global, fixed-position "back to landing" control.
 *
 * Sits immediately to the left of MuteToggle, sharing its height and chrome.
 * Hidden on the landing route itself since it would be a no-op there.
 */
export function ExitButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  return (
    <motion.button
      type="button"
      onClick={() => navigate("/")}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-label="Exit lesson and return to home"
      data-testid="exit-button"
      data-cursor-pointing
      className="
        fixed top-4 right-20 sm:top-6 sm:right-24 z-[60]
        h-14 sm:h-16 px-4 sm:px-5
        rounded-2xl border-2 border-sb-ink
        shadow-xl shadow-sb-accent-deep/25
        flex items-center justify-center cursor-pointer
        bg-sb-paper text-sb-ink hover:bg-sb-paper-deep
        font-mono font-bold uppercase tracking-[0.18em]
        text-sm sm:text-base
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
      "
    >
      Exit
    </motion.button>
  );
}
