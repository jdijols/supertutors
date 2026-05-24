import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * AHA hero animation (P5.11) — fires when the state machine enters
 * `aha.aha_triggered`. Renders a layered "snap-equal" celebration:
 *
 *   1. A radial golden glow that scales up from the center
 *   2. A bold `≡` equivalence mark that punches in
 *   3. A screen-wide flash that fades out
 *
 * After `durationMs` we fire `onDone` so the machine advances to
 * `celebrating` (which plays the `aha_reveal` line). Cluster-anchored
 * positioning + cheese-stretch particles ship later — this is the hero
 * gesture without any manipulative integration so the demo lands even
 * when Beat 6 is triggered purely via dev controls.
 */
export interface AhaAnimationProps {
  /** Whether the animation should be visible. */
  active: boolean;
  /** Callback fired after the animation completes. Drives ANIMATION_DONE. */
  onDone: () => void;
  /** Total animation duration in ms. Default 1500. */
  durationMs?: number;
}

export function AhaAnimation({
  active,
  onDone,
  durationMs = 1500,
}: AhaAnimationProps) {
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [active, durationMs, onDone]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          data-testid="aha-animation"
          className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Layer 1 — screen flash fading out */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-mozzarella-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0] }}
            transition={{
              duration: durationMs / 1000,
              times: [0, 0.1, 0.6],
              ease: "easeOut",
            }}
          />

          {/* Layer 2 — radial glow expanding from center */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(242,169,59,0.55) 0%, rgba(242,169,59,0.18) 35%, rgba(242,169,59,0) 70%)",
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0.6, 0], scale: [0.3, 1.2, 1.6, 2] }}
            transition={{
              duration: durationMs / 1000,
              times: [0, 0.25, 0.6, 1],
              ease: "easeOut",
            }}
          />

          {/* Layer 3 — the equivalence mark, scaling in and settling */}
          <motion.div
            className="relative z-10 text-[18vw] md:text-[14vw] font-mono font-bold text-oven-glow drop-shadow-[0_8px_24px_rgba(26,26,26,0.35)] select-none"
            initial={{ opacity: 0, scale: 0.2, rotate: -8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1.1, 1, 1.05],
              rotate: [-8, 0, 0, 0],
            }}
            transition={{
              duration: durationMs / 1000,
              times: [0, 0.3, 0.6, 1],
              ease: "easeOut",
            }}
            aria-label="Equal"
          >
            ≡
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
