import { AnimatePresence, motion } from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTutorStore } from "../../store/tutorStore";

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
 * Assets: `/lessons/freddy-fractions/images/ui/delivery-box-opened.png` and `delivery-box-closed.png`
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

// Open box is the primary visual + drop target. Closed box is only
// visible briefly during the receive → slide-off animation, and is
// sized smaller so the lid-close also reads as a perceptible shrink
// (not just an image swap). Independent constants — the two no longer
// share a derivation since the closed box was trimmed 10% on review
// without touching the open size.
const OPEN_SIZE = 252;
const CLOSED_SIZE = 189; // was 210 — 10% smaller per design pass

// Wrapper sizes to OPEN_SIZE so `contains()` bounds match the visible
// open box (the most common drop-detection case). The closed motion.div
// centers itself within this wrapper via absolute positioning + offsets.
const WRAPPER_SIZE = OPEN_SIZE;
const CLOSED_OFFSET = (WRAPPER_SIZE - CLOSED_SIZE) / 2;

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
    // Spotlight is set by LessonExploration during the opener tour — when
    // Freddy says "deliveries go in the box," the box pulses + scales to
    // draw the kid's eye. Takes priority over the cap-hint pulse below.
    const spotlit = useTutorStore((s) => s.spotlight === "delivery");

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
    const showCapPulse = pulseHint && phase === "open" && !isDragOver;
    const showSpotlight = spotlit && phase === "open" && !isDragOver;

    return (
      <div
        ref={boxRef}
        data-testid="delivery-box"
        data-phase={phase}
        data-drag-over={isDragOver}
        data-spotlight={showSpotlight}
        // z-25 — DELIBERATELY below the pieces layer (z-30). Pizzas
        // dragged over the box render ON TOP of the box, matching the
        // physical metaphor "I'm placing this into the open box."
        className={`
          fixed right-[-6px] z-[25]
          ${className}
        `}
        style={{
          // Vertically positioned in the middle-upper region of the
          // counter so it sits near the pizza's resting height but isn't
          // crammed into the bottom corner. `55% - 100px` matches the
          // shift the user dialed in.
          top: "calc(55% - 100px)",
          transform: "translateY(-25%)",
          width: WRAPPER_SIZE,
          height: WRAPPER_SIZE,
        }}
        role="region"
        aria-label="Send pizza to delivery"
      >
        <AnimatePresence mode="wait">
          {phase === "open" && (
            // Outer wrapper carries one of two CSS pulse classes —
            //   - `spotlight-pulse` while Freddy is calling out the box
            //     during the opener tour (loud, attention-grabbing).
            //   - `delivery-pulse` as the cap-hint when the table is full
            //     ("send a pizza away to make room").
            // Spotlight wins when both would apply. Both classes use CSS
            // keyframes (HMR-immune, doesn't compete with framer-motion
            // transforms inside).
            <div
              key="open-wrapper"
              data-pulse={showCapPulse}
              className={
                showSpotlight
                  ? "spotlight-pulse"
                  : showCapPulse
                    ? "delivery-pulse"
                    : ""
              }
              style={{ width: OPEN_SIZE, height: OPEN_SIZE }}
            >
              <motion.div
                key="open"
                data-glow={showGlow}
                initial={{
                  filter: "drop-shadow(0 0 0px rgba(255, 251, 242, 0))",
                }}
                animate={{
                  // Drag-over glow — same filter as PizzaPiece hover.
                  // Scale lives on the outer CSS wrapper, not here.
                  filter: showGlow
                    ? "drop-shadow(0 0 24px rgba(255, 251, 242, 0.95))"
                    : "drop-shadow(0 0 0px rgba(255, 251, 242, 0))",
                }}
                transition={{ filter: { duration: 0.18 } }}
                style={{ width: OPEN_SIZE, height: OPEN_SIZE }}
              >
                <img
                  src="/lessons/freddy-fractions/images/ui/delivery-box-opened.png"
                  alt="Open delivery box"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </motion.div>
            </div>
          )}

          {phase === "closed" && (
            <motion.div
              key="closed"
              initial={{ x: 0, opacity: 1, scale: 1 }}
              animate={{ x: 0, opacity: 1, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              // Closed box is smaller than the wrapper — center it within
              // the wrapper so the visual stays where the open box was.
              style={{
                position: "absolute",
                top: CLOSED_OFFSET,
                left: CLOSED_OFFSET,
                width: CLOSED_SIZE,
                height: CLOSED_SIZE,
              }}
            >
              <img
                src="/lessons/freddy-fractions/images/ui/delivery-box-closed.png"
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
              animate={{ x: CLOSED_SIZE + 200, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeIn" }}
              style={{
                position: "absolute",
                top: CLOSED_OFFSET,
                left: CLOSED_OFFSET,
                width: CLOSED_SIZE,
                height: CLOSED_SIZE,
              }}
            >
              <img
                src="/lessons/freddy-fractions/images/ui/delivery-box-closed.png"
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
