import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Speech bubble — overlay anchored to a speaker.
 *
 * Renders as an absolutely-positioned bubble with a tail pointing toward
 * the speaker. Caller controls position via the `anchor` prop (the
 * coordinates of the speaker), and visibility via `open`.
 *
 * Auto-dismiss is the caller's responsibility — typically the state
 * machine fires DIALOGUE_DONE after audio ends, the caller flips `open`
 * to false, and the bubble fades out.
 *
 * Tap-to-skip / tap-to-replay handled here via `onTap` callback if provided.
 */
export type BubbleSide =
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface SpeechBubbleProps {
  /** Show / hide the bubble. */
  open: boolean;
  /**
   * Where the tail attaches relative to the bubble:
   *   - "left" / "right": tail extends horizontally from the side, pointing at
   *     a speaker at roughly the same vertical position
   *   - "top-left" / "top-right": tail extends upward from the top edge,
   *     pointing at a speaker ABOVE the bubble
   *   - "bottom-left" / "bottom-right": tail extends downward from the bottom
   *     edge, pointing at a speaker BELOW the bubble (e.g., bubble at the top
   *     of the screen, Freddy in the lower portion of the scene)
   * Defaults to "left".
   */
  tailSide?: BubbleSide;
  /** Optional speaker label (e.g., "Freddy", "Guest 1"). */
  speaker?: string;
  /** Bubble content (text or rich nodes). */
  children: ReactNode;
  /** Optional tap handler — e.g., skip audio. */
  onTap?: () => void;
}

export function SpeechBubble({
  open,
  tailSide = "left",
  speaker,
  children,
  onTap,
}: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="speech-bubble"
          data-speaker={speaker}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          onClick={onTap}
          className={`
            relative max-w-md px-5 py-4
            bg-sb-paper border-2 border-sb-ink rounded-3xl
            shadow-xl shadow-sb-accent-deep/25
            text-sb-ink font-sans text-xl leading-snug
            ${onTap ? "cursor-pointer active:scale-95" : ""}
          `}
        >
          {speaker && (
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-sb-ink/70 mb-1">
              {speaker}
            </div>
          )}
          {children}
          {/* Tail */}
          {(tailSide === "left" || tailSide === "right") && (
            <div
              aria-hidden
              className={`
                absolute top-1/2 -translate-y-1/2 w-0 h-0
                border-y-[14px] border-y-transparent
                ${
                  tailSide === "left"
                    ? "left-0 -translate-x-full border-r-[18px] border-r-sb-ink"
                    : "right-0 translate-x-full border-l-[18px] border-l-sb-ink"
                }
              `}
            />
          )}
          {(tailSide === "top-left" || tailSide === "top-right") && (
            <div
              aria-hidden
              className={`
                absolute top-0 -translate-y-full w-0 h-0
                border-x-[12px] border-x-transparent
                border-b-[16px] border-b-sb-ink
                ${tailSide === "top-left" ? "left-6" : "right-6"}
              `}
            />
          )}
          {(tailSide === "bottom-left" || tailSide === "bottom-right") && (
            <div
              aria-hidden
              className={`
                absolute bottom-0 translate-y-full w-0 h-0
                border-x-[12px] border-x-transparent
                border-t-[16px] border-t-sb-ink
                ${tailSide === "bottom-left" ? "left-6" : "right-6"}
              `}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
