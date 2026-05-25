import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import type { SandboxPiece } from "./useSandboxPieces";

/**
 * GuestBox — a named recipient pizza box on the table (V3).
 *
 * Multi-instance, one per guest (1:1, not per pizza — see ADR §2 in
 * `docs/adr/0001-v3-manipulative-state-architecture.md`). Renders the
 * open delivery-box visual + a name label below + the guest's currently-
 * assigned pieces stacked inside the lid.
 *
 * **Not the same as `DeliveryBox`.** DeliveryBox is the singleton off-
 * screen send-away affordance for v2 onboarding (lid closes, slides
 * off, replenishes). GuestBox holds contents persistently, sized to one
 * guest's portion. See `Freddy-Fractions/CONTEXT.md` for the distinction.
 *
 * Visual recipe (open-box PNG, AABB overlap math) is the same as
 * DeliveryBox — no new art required.
 *
 * Parents pass the full `pieces` array filtered to this guest, e.g.
 * `pieces.filter(p => p.guestId === "maya")`. The box itself does no
 * filtering; rendering + `contains` / `overlaps` are pure functions of
 * props and the rendered DOM rect.
 */

export interface PieceRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface GuestBoxHandle {
  /** True if (x, y) viewport coords are over this box's bounding rect. */
  contains: (x: number, y: number) => boolean;
  /** True if the given piece rect overlaps this box by at least
   *  `threshold` fraction of the piece's area (default 0.20 = 20%).
   *  Matches DeliveryBox overlap semantics so drop-detection feels
   *  consistent across both box types. */
  overlaps: (pieceRect: PieceRect, threshold?: number) => boolean;
}

export interface GuestBoxProps {
  /** Stable id matching `SandboxPiece.guestId`, e.g. "maya". */
  guestId: string;
  /** Display label rendered beneath the box, e.g. "Maya". */
  label: string;
  /** Container-relative x position (px) of the box's top-left corner. */
  x: number;
  /** Container-relative y position (px) of the box's top-left corner. */
  y: number;
  /** Pieces currently assigned to this guest. */
  pieces: SandboxPiece[];
  /** Box width/height in pixels. Default 200. */
  size?: number;
}

const DEFAULT_SIZE = 200;

export const GuestBox = forwardRef<GuestBoxHandle, GuestBoxProps>(
  function GuestBox(
    { guestId, label, x, y, pieces, size = DEFAULT_SIZE },
    ref,
  ) {
    const boxRef = useRef<HTMLDivElement>(null);

    // Pointer tracking: true while the kid drags a piece over the box.
    // Drives the mozzarella-cream glow filter (matches DeliveryBox).
    // Uses a global pointermove listener because PizzaPiece's
    // touch-action:none would otherwise block direct hover events.
    const [isDragOver, setIsDragOver] = useState(false);
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

    const contains = useCallback((px: number, py: number): boolean => {
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return false;
      return (
        px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom
      );
    }, []);

    const overlaps = useCallback(
      (pieceRect: PieceRect, threshold: number = 0.2): boolean => {
        const rect = boxRef.current?.getBoundingClientRect();
        if (!rect) return false;
        const overlapW = Math.max(
          0,
          Math.min(pieceRect.right, rect.right) -
            Math.max(pieceRect.left, rect.left),
        );
        const overlapH = Math.max(
          0,
          Math.min(pieceRect.bottom, rect.bottom) -
            Math.max(pieceRect.top, rect.top),
        );
        if (overlapW <= 0 || overlapH <= 0) return false;
        const overlapArea = overlapW * overlapH;
        const pieceArea =
          (pieceRect.right - pieceRect.left) *
          (pieceRect.bottom - pieceRect.top);
        if (pieceArea <= 0) return false;
        return overlapArea / pieceArea >= threshold;
      },
      [],
    );

    useImperativeHandle(
      ref,
      () => ({ contains, overlaps }),
      [contains, overlaps],
    );

    return (
      <div
        ref={boxRef}
        data-testid="guest-box"
        data-guest-id={guestId}
        data-drag-over={isDragOver}
        className="absolute select-none"
        style={{ left: x, top: y, width: size, height: size }}
        role="region"
        aria-label={`${label}'s pizza box`}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            filter: isDragOver
              ? "drop-shadow(0 0 24px rgba(255, 251, 242, 0.95))"
              : "drop-shadow(0 0 0px rgba(255, 251, 242, 0))",
          }}
          transition={{ filter: { duration: 0.18 } }}
        >
          <img
            src="/lessons/freddy-fractions/images/ui/delivery-box-opened.png"
            alt=""
            aria-hidden
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        </motion.div>
        {/* Contents stacked inside the lid — small grid for countability. */}
        <div
          data-testid="guest-box-contents"
          className="absolute inset-0 grid grid-cols-2 gap-1 p-6 place-items-center pointer-events-none"
        >
          {pieces.map((p) => (
            <img
              key={p.id}
              src={p.src}
              alt=""
              aria-hidden
              draggable={false}
              className="max-w-full max-h-full object-contain"
            />
          ))}
        </div>
        {/* Name label as a paper pill that overlaps the box top edge.
            z-[1] keeps the label just above the box image — NOT above
            sibling elements outside the box (like dragged pizzas). */}
        <div
          data-testid="guest-box-label"
          className="absolute left-1/2 -translate-x-1/2 bg-sb-paper border-2 border-sb-ink rounded-full px-3 py-1 font-mono uppercase tracking-[0.14em] text-[11px] text-sb-ink shadow-lg shadow-sb-accent-deep/25 whitespace-nowrap z-[1]"
          style={{ top: -8 }}
        >
          {label}
        </div>
      </div>
    );
  },
);
