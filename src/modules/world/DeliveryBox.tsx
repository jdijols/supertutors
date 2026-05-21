import { AnimatePresence, motion } from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

/**
 * DeliveryBox — drop target for sending pizza pieces off the table.
 *
 * Sits fixed on the right side of the viewport, visually a pizza takeout
 * box (lid-open idle state, lid-closed mid-delivery). Kids drag pieces or
 * whole pizzas onto it; the piece slides into the closing box, the box
 * slides off-screen right, and a fresh open box slides in from the right
 * edge to take its place.
 *
 * The same hover-glow attributes as `PizzaPiece` are applied when a piece
 * is being dragged over the box, signaling "drop here." When the
 * `pulseHint` prop is true (parent passes when the pizza cap is reached),
 * the box pulses to attract attention.
 *
 * The parent calls `contains(x, y)` on drag-end to check if a release
 * happened over the box, and `receive()` to trigger the slide-off
 * animation when delivering.
 *
 * Assets: `/images/ui/delivery-box-opened.png` and `delivery-box-closed.png`
 * (Pixar/Duolingo cartoon style — see Journals/May-19-1838-freddy-world-locked-in.md).
 */

export interface DeliveryBoxHandle {
  /** True if (x, y) viewport coords are over the box's bounding rect. */
  contains: (x: number, y: number) => boolean;
  /** Trigger the receive → slide-off → replenish sequence. */
  receive: () => Promise<void>;
}

export interface DeliveryBoxProps {
  /** Pulse the box to attract attention (e.g., when pizza cap is reached). */
  pulseHint?: boolean;
  /** Optional className for additional positioning overrides. */
  className?: string;
}

type Phase = "open" | "closed" | "sliding-off";

// 50% larger than original 140 — more presence as a drop target, and
// fits a 256px whole pizza scaled to ~50% (128px) comfortably inside.
const BOX_SIZE = 210;

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export const DeliveryBox = forwardRef<DeliveryBoxHandle, DeliveryBoxProps>(
  function DeliveryBox({ pulseHint = false, className = "" }, ref) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [phase, setPhase] = useState<Phase>("open");
    // True when a piece is being dragged over the box — applies the
    // mozzarella-cream glow (same as PizzaPiece hover affordance).
    const [isDragOver, setIsDragOver] = useState(false);

    // Pointer tracking — detect "piece dragged over me" via global
    // pointermove while a primary button is pressed. PizzaPiece's
    // touch-action:none would otherwise block direct hover events.
    useEffect(() => {
      function onMove(e: PointerEvent) {
        if (e.buttons === 0) {
          setIsDragOver(false);
          return;
        }
        const rect = boxRef.current?.getBoundingClientRect();
        if (!rect) return;
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        setIsDragOver(isInside);
      }
      function onUp() {
        setIsDragOver(false);
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
    }, []);

    const contains = useCallback((x: number, y: number) => {
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return false;
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    }, []);

    const receive = useCallback(async () => {
      // 1. Close lid (image swap).
      setPhase("closed");
      // 2. Hold the "lid just closed" moment briefly so the kid sees what
      //    happened before the box flies away.
      await sleep(260);
      // 3. Slide off-screen right.
      setPhase("sliding-off");
      await sleep(420);
      // 4. Reset to open. The motion.div's `initial` puts it off-screen
      //    right; `animate` springs it in.
      setPhase("open");
    }, []);

    useImperativeHandle(
      ref,
      () => ({ contains, receive }),
      [contains, receive],
    );

    // The glow / pulse animations — both apply to the outer wrapper. Glow
    // wins visually when both are active (drag-over is the kid's direct
    // action; pulse is just a hint).
    const showGlow = isDragOver && phase === "open";
    const showPulse = pulseHint && phase === "open" && !isDragOver;

    return (
      <div
        ref={boxRef}
        data-testid="delivery-box"
        data-phase={phase}
        data-drag-over={isDragOver}
        className={`
          fixed right-4 sm:right-6 z-[55]
          ${className}
        `}
        style={{
          // Vertically aligned with the lower half of the viewport so the
          // box sits near the pizza's resting height — kid drags
          // horizontally to deliver, not diagonally up.
          top: "55%",
          transform: "translateY(-25%)",
          width: BOX_SIZE,
          height: BOX_SIZE,
        }}
        role="region"
        aria-label="Send pizza to delivery"
      >
        <AnimatePresence mode="wait">
          {phase === "open" && (
            <motion.div
              key="open"
              // Slide in from off-screen right when (a) first mount and
              // (b) replenishing after a delivery. Same spring as the
              // pizza slide-in for consistency.
              initial={{ x: BOX_SIZE + 80, opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                // Pulse hint: gentle scale loop while idle + pulseHint.
                scale: showPulse ? [1, 1.06, 1] : 1,
                // Drag-over glow — same filter as PizzaPiece hover.
                filter: showGlow
                  ? "drop-shadow(0 0 24px rgba(255, 251, 242, 0.95))"
                  : "drop-shadow(0 0 0px rgba(255, 251, 242, 0))",
              }}
              transition={{
                x: { type: "spring", stiffness: 220, damping: 24 },
                opacity: { duration: 0.2 },
                scale: showPulse
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 },
                filter: { duration: 0.18 },
              }}
              style={{ width: BOX_SIZE, height: BOX_SIZE }}
            >
              <img
                src="/images/ui/delivery-box-opened.png"
                alt="Open delivery box"
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </motion.div>
          )}

          {phase === "closed" && (
            <motion.div
              key="closed"
              initial={{ x: 0, opacity: 1, scale: 1 }}
              animate={{ x: 0, opacity: 1, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ width: BOX_SIZE, height: BOX_SIZE }}
            >
              <img
                src="/images/ui/delivery-box-closed.png"
                alt="Closed delivery box"
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </motion.div>
          )}

          {phase === "sliding-off" && (
            <motion.div
              key="sliding-off"
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: BOX_SIZE + 200, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeIn" }}
              style={{ width: BOX_SIZE, height: BOX_SIZE }}
            >
              <img
                src="/images/ui/delivery-box-closed.png"
                alt=""
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
