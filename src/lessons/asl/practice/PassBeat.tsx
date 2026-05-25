import { motion, AnimatePresence } from "framer-motion";

/**
 * PassBeat — celebratory full-screen flash on successful pass.
 *
 * Spring scale animation. Uses framer-motion (acceptable here since
 * this only fires during active demo / use, not in hidden tabs).
 */
export function PassBeat({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="pass-beat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
        >
          {/* Green wash */}
          <div className="absolute inset-0 bg-basil-400/30" />

          {/* Checkmark with spring */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 18,
            }}
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-basil-400 flex items-center justify-center shadow-2xl shadow-basil-400/50"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              width="64"
              height="64"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="5 13 10 18 19 7" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
