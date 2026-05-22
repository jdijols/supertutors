import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Pizza, type PizzaFraction } from "./Pizza";

/** Numeric drag bounds, used to clamp a piece within a known box. */
export interface DragBounds {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

/**
 * PizzaPiece — a draggable, tappable wrapper around the Pizza visual.
 *
 * Positioning model:
 *   - Element is `position: absolute` with `left: 0, top: 0`, and its actual
 *     screen position is driven by the `x` / `y` Framer Motion motion values
 *     applied via the CSS transform. This is the canonical framer-motion
 *     pattern for controlled-position drag — using `left`/`top` directly
 *     would double-position when drag-in-progress transforms layer on top.
 *   - External position updates (slice spawn, reset) come in as new
 *     `initialX` / `initialY` props; a `useEffect` writes them into the
 *     motion values, keeping React state and framer-motion in sync.
 *
 * Drag-vs-tap discrimination:
 *   - `dragMovedRef` flips true once the pointer has moved >4px during a
 *     drag gesture. On `onClick`, we suppress tap-after-drag so dragging
 *     a piece doesn't accidentally slice it when cutter is the active tool.
 *
 * Viewport bounding:
 *   - `dragConstraintsRef` points to a container element; framer-motion
 *     measures it and clamps drag so the piece can't leave its bounds.
 *     SandboxPreview passes its `<main>` ref so pieces stay on-screen.
 */

export interface PizzaPieceProps {
  /** Unique ID — used for React keys and identifying the piece in handlers. */
  id: string;
  /** Asset path (e.g., "/images/pizza/pepperoni-v1/whole.png"). */
  src: string;
  /** What fraction of a whole pizza this piece is. */
  fraction: PizzaFraction;
  /** Current position in pixels (container-relative). Updates flow in via
      slice spawn / reset / external state changes. */
  initialX: number;
  initialY: number;
  /** Rendered width in pixels. */
  width: number;
  /** Rendered height in pixels. */
  height: number;
  /** Whether the piece can be dragged. Default true. */
  draggable?: boolean;
  /** Tap handler — slicer wires this when cutter is the active tool. */
  onTap?: (id: string) => void;
  /** Fired on drag end with the final container-relative position. */
  onDragEnd?: (id: string, x: number, y: number) => void;
  /** Cursor override (e.g., a custom cutter cursor when cutter is active). */
  cursor?: string;
  /** Bounds for drag. Accepts either:
   *  - a ref to a container element (framer-motion measures it), or
   *  - explicit numeric bounds `{top, left, right, bottom}` on the motion
   *    value space (recommended — deterministic and avoids ambiguity in
   *    ref-based measurement).
   */
  dragConstraints?: RefObject<HTMLElement | null> | DragBounds;
  /** Optional CSS clip-path applied to the wrapper. For triangular
   *  eighths, this clips both the visual AND the pointer-event area to
   *  the triangle — so a click in the (transparent) square-frame corners
   *  passes through to whatever's below instead of selecting the eighth. */
  clipPath?: string;
  /** Optional className for additional styling. */
  className?: string;
  /**
   * If provided, the motion value initializes at this x (off-screen) and
   * springs into `initialX` on mount — produces the "pizza slides in from
   * the oven side" feel when adding a new pizza. Undefined = no slide-in.
   */
  enterFromX?: number;
  /**
   * Optional predicate called during drag with the pointer's client
   * coords. When it returns true (e.g. pointer is over the delivery box),
   * the piece scales down to ~50% so it visually "fits inside" the drop
   * target. Resets to normal scale on drag-end.
   */
  dropZoneTest?: (x: number, y: number) => boolean;
}

export function PizzaPiece({
  id,
  src,
  fraction,
  initialX,
  initialY,
  width,
  height,
  draggable = true,
  onTap,
  onDragEnd,
  cursor,
  dragConstraints,
  clipPath,
  className = "",
  enterFromX,
  dropZoneTest,
}: PizzaPieceProps) {
  // Initialize motion values:
  //   - With `enterFromX`: start off-screen so the mount-effect's animate()
  //     produces a slide-in. Used when `addPizza()` adds a fresh pizza.
  //   - Without: start at `initialX` directly. Used for slice-spawned
  //     children + reset.
  const x = useMotionValue(enterFromX ?? initialX);
  const y = useMotionValue(initialY);

  // Sync external position updates back into the motion values. Uses
  // animate() (not set()) so prop-driven repositioning is SMOOTH —
  // critical for the shift-existing-pieces-rightward animation when a
  // new pizza enters. No-op visually if the motion value is already at
  // the target (drag-end case, slice-spawn case, reset case).
  useEffect(() => {
    animate(x, initialX, { duration: 0.3, ease: "easeOut" });
    animate(y, initialY, { duration: 0.3, ease: "easeOut" });
  }, [initialX, initialY, x, y]);

  const dragMovedRef = useRef(false);

  // Manual hover state so we can guarantee the glow + scale revert on
  // pointer-leave. Framer-motion's `whileHover` was leaving residual filter
  // state when motion values for x/y are driving the same element's
  // transform — onPointerEnter/Leave + an explicit rest state in `animate`
  // is more predictable.
  const [isHovering, setIsHovering] = useState(false);

  // Scale-down state for "piece dragged over the delivery box." Tracked
  // via a ref to avoid render thrash during drag, then mirrored to state
  // only on transitions so the visual animation updates.
  const isOverDropZoneRef = useRef(false);
  const [isOverDropZone, setIsOverDropZone] = useState(false);

  // True while a drag is in progress. Used to suppress the mozzarella-cream
  // drop-shadow during drag — Safari (desktop + iPad) leaves filter-paint
  // trail artifacts when a filtered element is transformed at speed, so we
  // turn the glow off as soon as the kid starts moving the piece.
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart() {
    dragMovedRef.current = false;
    isOverDropZoneRef.current = false;
    setIsOverDropZone(false);
    setIsDragging(true);
  }

  /**
   * Resolves `dragConstraints` to a numeric `DragBounds` object we can clamp
   * against. Ref-based constraints can't be measured synchronously here, so
   * we return `null` for refs (their clamping is delegated back to
   * framer-motion via the prop pass-through below).
   */
  function resolvedBounds(): DragBounds | null {
    if (!dragConstraints) return null;
    if ("current" in dragConstraints) return null; // RefObject form
    return dragConstraints;
  }

  /** Clamp the motion values to the resolved bounds, mutating them in place. */
  function clampToBounds() {
    const bounds = resolvedBounds();
    if (!bounds) return;
    const cx = x.get();
    const cy = y.get();
    const minX = bounds.left ?? Number.NEGATIVE_INFINITY;
    const maxX = bounds.right ?? Number.POSITIVE_INFINITY;
    const minY = bounds.top ?? Number.NEGATIVE_INFINITY;
    const maxY = bounds.bottom ?? Number.POSITIVE_INFINITY;
    const clampedX = Math.max(minX, Math.min(cx, maxX));
    const clampedY = Math.max(minY, Math.min(cy, maxY));
    if (cx !== clampedX) x.set(clampedX);
    if (cy !== clampedY) y.set(clampedY);
  }

  function handleDrag(_event: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > 4 || Math.abs(info.offset.y) > 4) {
      dragMovedRef.current = true;
    }
    // Drop-zone hover check — only re-render when transitioning across
    // the boundary so the drag stays smooth.
    if (dropZoneTest) {
      const over = dropZoneTest(info.point.x, info.point.y);
      if (over !== isOverDropZoneRef.current) {
        isOverDropZoneRef.current = over;
        setIsOverDropZone(over);
      }
    }
    // framer-motion's built-in `dragConstraints` with numeric bounds wasn't
    // reliably clamping top/bottom in our setup, so we enforce bounds
    // manually on every drag frame. The piece can never escape the bounds
    // visually — when the pointer moves past, this clamp pulls the motion
    // values back inside on the next frame, and the element stays glued
    // to the constraint edge.
    clampToBounds();
  }

  function handleDragEnd() {
    // Final guard in case the last drag event was missed.
    clampToBounds();
    isOverDropZoneRef.current = false;
    setIsOverDropZone(false);
    setIsDragging(false);
    onDragEnd?.(id, x.get(), y.get());
  }

  function handleClick() {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    onTap?.(id);
  }

  return (
    <>
      {/* VISUAL layer — position-only, gets the hover glow + scale, NO
          clip-path so the drop-shadow can extend freely around the
          triangle's actual painted pixels. Pointer events skip this
          entirely so they fall through to the interactive layer below. */}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          x,
          y,
          width,
          height,
          pointerEvents: "none",
          // Hint to the compositor that this element will be transformed
          // continuously. Without this, Safari (desktop + iPad) can leave
          // filter-paint trails behind the dragged piece.
          willChange: "transform",
        }}
        animate={{
          // Scale priority:
          //   - Over a drop zone (delivery box) → shrink to 50% so it
          //     looks like the piece is "fitting inside" the box.
          //   - Hovering normally → subtle 4% bump as an "I'm interactive"
          //     affordance.
          //   - Otherwise → rest scale 1.
          // Glow filter (mozzarella-cream drop-shadow) only on the
          // normal hover state — when shrinking into the box the box
          // itself glows instead. DISABLED during drag because Safari
          // leaves drop-shadow paint trails when the element is being
          // continuously transformed.
          scale: isOverDropZone ? 0.5 : isHovering ? 1.04 : 1,
          filter:
            isHovering && !isOverDropZone && !isDragging
              ? "drop-shadow(0 0 20px rgba(255, 251, 242, 0.95))"
              : "drop-shadow(0 0 0px rgba(255, 251, 242, 0))",
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Pizza src={src} fraction={fraction} width={width} height={height} />
      </motion.div>

      {/* INTERACTIVE layer — clip-path so the hit area matches the visible
          triangle (not the square frame). Sits above the visual layer in
          DOM order, captures all pointer events. Transparent — its visual
          job is delegated to the visual layer above; this layer only
          exists for drag/tap/hover detection. */}
      <motion.div
        data-testid="pizza-piece"
        data-piece-id={id}
        data-fraction={fraction}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          x,
          y,
          width,
          height,
          cursor,
          touchAction: "none",
          // Wrapper around all pieces is `pointer-events: none` so empty
          // viewport doesn't intercept clicks elsewhere; this interactive
          // layer re-opts in so the piece itself remains drag/tap-able.
          pointerEvents: "auto",
          clipPath,
        }}
        drag={draggable}
        dragMomentum={false}
        dragElastic={0}
        // Belt-and-suspenders on inertia: `dragMomentum={false}` alone
        // leaves residual velocity-based settling in v12 (the piece
        // "throws" further when released after a fast drag). Setting the
        // underlying transition to zero power + zero time constant kills
        // any post-release animation.
        dragTransition={{ power: 0, timeConstant: 0 }}
        // dragConstraints intentionally NOT passed — the manual clamp in
        // onDrag is the sole bounding mechanism.
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={() => setIsHovering(false)}
        className={className}
      />
    </>
  );
}
