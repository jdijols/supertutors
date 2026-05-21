import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FreddyCharacter,
  RestaurantScene,
  ToolPicker,
  ToolSprite,
} from "@/modules/world";
import {
  buildWholePiece,
  findProximityGroups,
  PizzaPiece,
  useSandboxPieces,
} from "@/modules/table";
import { Toast, fractionToastMessage } from "@/modules/toast";
import { useAppStore } from "@/store/appStore";
import { useHoldToReset } from "@/lib/useHoldToReset";
import { HandTracker, useHandLandmarks } from "@/modules/cv/HandTracker";
import { PinchRecognizer } from "@/modules/cv/gestures";
import { usePointerFromHand } from "@/modules/cv/usePointerFromHand";
import type {
  PizzaFraction,
  ProximityGroup,
  SandboxPiece,
} from "@/modules/table";

// ---------------------------------------------------------------------------
// CV mode overlay — self-contained; renders only when ?cv=true in the URL.
// Wraps HandTracker internally so the sandbox doesn't know about webcam
// lifecycle. Synthetic pointer events drive existing cut + drag handlers.
// ---------------------------------------------------------------------------

function CvModeOverlayInner() {
  const { videoRef, result, status } = useHandLandmarks();
  const recognizersRef = useRef<PinchRecognizer[]>([
    new PinchRecognizer(),
    new PinchRecognizer(),
  ]);
  const { update: updatePointer } = usePointerFromHand();

  // Drive synthetic pointer events on every detection frame
  if (result?.landmarks) {
    result.landmarks.forEach((hand, i) => {
      const state = recognizersRef.current[i]?.update(hand);
      if (state) updatePointer(state);
    });
  }

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-xl overflow-hidden shadow-xl border-2 border-mozzarella-100/60"
      style={{ width: 160, opacity: 0.5 }}
      title={status === 'ready' ? 'CV mode active' : 'Loading hand tracker…'}
    >
      <video
        ref={videoRef}
        className="w-full block"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
        muted
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-[10px] text-center px-1">
          Loading…
        </div>
      )}
    </div>
  );
}

function CvModeOverlay() {
  return (
    <HandTracker>
      <CvModeOverlayInner />
    </HandTracker>
  );
}

/**
 * CSS clip-path for each eighth slot so the wrapper is clipped to just
 * the triangle area — both visually (no change, the visible triangle is
 * what's painted in the PNG anyway) AND for pointer events. Without
 * clipping, the square 160×160 frame catches hits in its transparent
 * corners and the kid accidentally selects the wrong eighth.
 *
 * Polygon points are (x% y%) at the triangle's three vertices within
 * the square frame, going clockwise from one vertex. Matches the
 * triangle orientation in each eighth's asset (see asset gen prompts).
 *
 * Non-eighth slots return `undefined` (no clipping needed — square
 * pieces have the full square as their hit area).
 */
function clipPathForSlot(slot: import("@/modules/table").PieceSlot): string | undefined {
  switch (slot) {
    case "eighth-tl-t": // upper-right triangle within frame
    case "eighth-br-r": // upper-right triangle within frame
      return "polygon(0 0, 100% 0, 100% 100%)";
    case "eighth-tl-l": // lower-left triangle
    case "eighth-br-b": // lower-left triangle
      return "polygon(0 0, 0 100%, 100% 100%)";
    case "eighth-tr-t": // upper-left triangle
    case "eighth-bl-l": // upper-left triangle
      return "polygon(0 0, 100% 0, 0 100%)";
    case "eighth-tr-r": // lower-right triangle
    case "eighth-bl-b": // lower-right triangle
      return "polygon(100% 0, 100% 100%, 0 100%)";
    default:
      return undefined;
  }
}

/** Tracks viewport dimensions, updating on resize. Used to compute explicit
 *  drag bounds so pieces stay fully on-screen across all four edges. */
function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1980,
    h: typeof window !== "undefined" ? window.innerHeight : 1080,
  }));
  useEffect(() => {
    const onResize = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

/**
 * SandboxPreview — Beat 2 (Sandbox / Explore) mechanic preview.
 *
 * Composes everything from this build pass:
 *   - RestaurantScene background + Freddy behind the counter
 *   - One whole pizza on the counter, draggable
 *   - ToolPicker (glove ↔ cutter) bottom-right
 *   - Slicer mechanic: with cutter active, tapping a piece splits it into
 *     2 children (whole → halves → quarters → eighths). Capped at eighths.
 *   - Toast fires a fraction label for each slice
 *   - Reset button bottom-left to restart the scene
 *
 * Lives at /preview/sandbox. Pure local state — no XState yet. The state
 * machine wiring lands when Beat 2 is authored in Stately.
 */

const BASE_SIZE = 320;

/** Adapts a live SandboxPiece (with extra fields) to the ProximityPiece shape. */
function toProximityPiece(p: SandboxPiece) {
  return {
    id: p.id,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    fraction: p.fraction,
  };
}

/** Geometric center of a proximity group's bounding box, or null if empty. */
function clusterCentroid(
  group: ProximityGroup,
  piecesById: Map<string, SandboxPiece>,
): { x: number; y: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = 0;
  for (const id of group.pieceIds) {
    const piece = piecesById.get(id);
    if (!piece) continue;
    found++;
    minX = Math.min(minX, piece.x);
    minY = Math.min(minY, piece.y);
    maxX = Math.max(maxX, piece.x + piece.width);
    maxY = Math.max(maxY, piece.y + piece.height);
  }
  if (!found) return null;
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function getInitialPiecePosition() {
  if (typeof window === "undefined") {
    return { x: 430, y: 220 };
  }
  return {
    x: window.innerWidth / 2 - BASE_SIZE / 2,
    y: Math.max(140, window.innerHeight * 0.28),
  };
}

export function SandboxPreview() {
  const [initialPos] = useState(getInitialPiecePosition);
  const toolMode = useAppStore((s) => s.toolMode);
  // CV mode: prefer Zustand flag (toggled via ToolPicker) but also honour
  // the ?cv=true URL param for direct-link access (e.g. portfolio links).
  const cvModeStore = useAppStore((s) => s.cvMode);
  const setCvMode = useAppStore((s) => s.setCvMode);
  const cvMode = cvModeStore || new URLSearchParams(window.location.search).has('cv');

  // Sync Zustand when the URL param is the initial source (direct link).
  // Only runs once on mount — thereafter the ToolPicker toggle owns the state.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('cv') && !cvModeStore) {
      setCvMode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const viewport = useViewport();

  const { pieces, slice, move, reset } = useSandboxPieces(
    [
      buildWholePiece({
        id: "piece-1",
        x: initialPos.x,
        y: initialPos.y,
        baseSize: BASE_SIZE,
      }),
    ],
    { baseSize: BASE_SIZE },
  );

  // Tracks which fractions the kid has seen so the toast copy upgrades from
  // "You made halves! 1/2" (first time) to "Halves! 1/2" (repeat).
  const [seenFractions, setSeenFractions] = useState<Set<PizzaFraction>>(
    new Set(),
  );

  // Toast lifecycle. Key changes on every new message so each invocation
  // remounts the Toast component and restarts the auto-dismiss animation
  // cleanly, even on rapid back-to-back slices.
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    key: number;
  }>({ open: false, message: "", key: 0 });

  function showToast(message: string) {
    setToast((prev) => ({
      open: true,
      message,
      key: prev.key + 1,
    }));
  }

  // Flag: did the current pointer-press cause a drag-cut? Set true when
  // the window pointermove listener slices a piece during a press; reset
  // on the NEXT pointerdown. Used to suppress the click event that
  // browsers fire after pointerup, so a single drag-cut doesn't ALSO
  // trigger a second slice via the piece's onClick.
  const didDragCutRef = useRef(false);

  const handlePieceTap = useCallback(
    (pieceId: string) => {
      // If the drag-to-cut already sliced something during this press,
      // ignore the click event that fires on release — otherwise we'd
      // double-slice.
      if (didDragCutRef.current) return;
      if (toolMode !== "cutter") return; // glove tool ignores taps; drag does the moving
      const result = slice(pieceId);
      if (!result) return; // already at smallest fraction, nothing to do

      const isFirstTime = !seenFractions.has(result.childrenFraction);
      if (isFirstTime) {
        setSeenFractions((prev) => {
          const next = new Set(prev);
          next.add(result.childrenFraction);
          return next;
        });
      }
      // Only fire toast for fractions that have a message (1/2, 1/4, 1/8).
      if (
        result.childrenFraction === "1/2" ||
        result.childrenFraction === "1/4" ||
        result.childrenFraction === "1/8"
      ) {
        showToast(
          fractionToastMessage(result.childrenFraction, isFirstTime),
        );
      }
    },
    [toolMode, slice, seenFractions],
  );

  // Keep a ref to the latest handlePieceTap so the drag-to-cut listener
  // (which only re-binds on toolMode change) can always call the freshest
  // version without going stale on every render.
  const handlePieceTapRef = useRef(handlePieceTap);
  useEffect(() => {
    handlePieceTapRef.current = handlePieceTap;
  });

  /**
   * Drag-to-cut: when the cutter is the active tool, slice the FIRST
   * piece the cursor crosses during a press-and-drag — but trigger the
   * actual slice on pointer UP (end of drag), NOT during the drag.
   * Realistic physical mechanic: you roll the cutter across the pizza,
   * then on release the result of the cut materializes.
   *
   * One-slice-per-press cap is intentional: cascading cuts (whole →
   * halves → quarters in one swipe) feels out of control and undermines
   * the "I did a thing" learning moment.
   */
  const pendingCutPieceRef = useRef<string | null>(null);

  useEffect(() => {
    if (toolMode !== "cutter") return;

    function recordPieceAt(x: number, y: number) {
      // Only record the FIRST piece encountered in a drag; later pieces
      // are ignored (one slice per drag).
      if (pendingCutPieceRef.current !== null) return;
      const el = document.elementFromPoint(x, y);
      if (!el) return;
      const pieceEl = el.closest("[data-piece-id]") as HTMLElement | null;
      if (!pieceEl) return;
      const pieceId = pieceEl.dataset.pieceId;
      if (!pieceId) return;
      pendingCutPieceRef.current = pieceId;
    }

    function onPointerDown(e: PointerEvent) {
      // Reset state at the start of each press. Record whatever piece is
      // already under the pointer (in case the user pure-clicks without
      // moving).
      pendingCutPieceRef.current = null;
      didDragCutRef.current = false;
      recordPieceAt(e.clientX, e.clientY);
    }
    function onPointerMove(e: PointerEvent) {
      if (e.buttons === 0) return; // only fire while pressed
      recordPieceAt(e.clientX, e.clientY);
    }
    function onPointerUp() {
      // NOW perform the slice — at the end of the drag, not during it.
      // The cursor reverts from cutting → upright at the same moment
      // (because :active CSS goes off), giving a satisfying "slice
      // happens on release" feel.
      const pieceId = pendingCutPieceRef.current;
      pendingCutPieceRef.current = null;
      if (!pieceId) return;
      handlePieceTapRef.current(pieceId);
      // Flag the upcoming click event so the piece's onClick (which fires
      // after pointerup if mousedown + mouseup were on the same element)
      // doesn't double-slice. Flag is reset on the next pointerdown.
      didDragCutRef.current = true;
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [toolMode]);

  function handleReset() {
    reset();
    setSeenFractions(new Set());
    setToast({ open: false, message: "", key: toast.key + 1 });
  }

  // CC.2 — Hold-to-reset Freddy. Re-uses the sandbox `handleReset`.
  const freddyHoldRef = useRef<HTMLDivElement>(null);
  const { isHolding: isResetting, progress: resetProgress } = useHoldToReset({
    ref: freddyHoldRef,
    onReset: handleReset,
  });

  // Proximity detection (P2.6). Recomputed whenever pieces change — position
  // updates only land at drag-END (via `move`), so the indicator surfaces a
  // moment after release. That matches the AHA mechanic in PRD §5.1.1: the
  // kid puts the pieces down, then sees whether they match. Live mid-drag
  // tracking + snap-align animation is P5.11 polish.
  const proximityGroups = useMemo<ProximityGroup[]>(() => {
    return findProximityGroups(pieces.map(toProximityPiece));
  }, [pieces]);

  // Index pieces by id so the cluster renderer can resolve centroids.
  const piecesById = useMemo(() => {
    const map = new Map<string, SandboxPiece>();
    for (const p of pieces) map.set(p.id, p);
    return map;
  }, [pieces]);

  // Tool-driven cursor: CSS classes (defined in globals.css) swap the
  // browser cursor for the custom glove / cutter PNGs, with `:active`
  // pseudo-class swapping to the closed/cutting variant on press-down.
  //
  // The class is applied to THREE elements as redundant fallbacks —
  // html, body, AND main — because cursor inheritance was empirically
  // not propagating through every element when only body was tagged.
  // The CSS rules use `!important` to win any specificity battle
  // (Tailwind preflight sets `cursor: pointer` on buttons, etc).
  //
  // On touch devices with no pointer, these are no-ops; the ToolSprite
  // component handles touch.
  const toolClassName =
    toolMode === "cutter" ? "tool-cutter" : "tool-glove";

  useEffect(() => {
    document.documentElement.classList.add(toolClassName);
    document.body.classList.add(toolClassName);
    return () => {
      document.documentElement.classList.remove(toolClassName);
      document.body.classList.remove(toolClassName);
    };
  }, [toolClassName]);

  // Cutter tool ONLY slices — no dragging. Glove ONLY moves — drag-to-move
  // is the entire interaction (taps are no-ops). Passing `draggable` as a
  // function of toolMode enforces this at the framer-motion level: with
  // `drag={false}`, drag gestures are entirely ignored.
  const piecesDraggable = toolMode === "glove";

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden bg-mozzarella-50 ${toolClassName}`}
    >
      <RestaurantScene>
        {/* Sizing matches LessonView (the deployed lesson page) so the
            sandbox preview is visually consistent with the real lesson. */}
        <div className="absolute left-2 md:left-8 bottom-0 z-10">
          <FreddyCharacter
            pose="facing_student"
            gesture="ok"
            mouth="closed"
            className="h-[88vh] md:h-[100vh] w-auto"
          />
          {/* CC.2 — Hold-to-reset hit area over Freddy's head/torso. */}
          <div
            ref={freddyHoldRef}
            data-testid="freddy-hold-target"
            role="button"
            aria-label="Hold to restart the lesson"
            className="absolute top-[8vh] left-[10%] w-[55%] h-[40vh] rounded-3xl cursor-pointer"
          />
        </div>
      </RestaurantScene>

      {isResetting && resetProgress > 0.25 ? (
        <div
          data-testid="reset-progress-indicator"
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-sb-ink/90 text-sb-paper-soft text-xs font-mono uppercase tracking-widest shadow-lg pointer-events-none"
        >
          Restart in {Math.max(1, Math.ceil((1 - resetProgress) * 1.5))}s
        </div>
      ) : null}

      {/* Sandbox piece layer — above counter mask (z-30+) so pieces sit on top. */}
      <div className="absolute inset-0 z-30">
        {pieces.map((piece) => (
          <PizzaPiece
            key={piece.id}
            id={piece.id}
            src={piece.src}
            fraction={piece.fraction}
            initialX={piece.x}
            initialY={piece.y}
            width={piece.width}
            height={piece.height}
            draggable={piecesDraggable}
            // Triangle hit target for eighths — clips both the visual
            // (no change since the visible triangle is already what's
            // painted) AND the pointer-event area to just the triangle
            // shape. A click in the transparent corner of the eighth's
            // square frame passes through to whatever's below instead
            // of registering as a hit on the eighth.
            clipPath={clipPathForSlot(piece.slot)}
            // Explicit numeric bounds keyed off the live viewport size.
            // Left/right/bottom hug the viewport edges exactly; `top` gets
            // a small ~24px buffer so the pizza doesn't ride flush against
            // the top of the screen, which felt visually tight.
            dragConstraints={{
              left: 0,
              top: 24,
              right: viewport.w - piece.width,
              bottom: viewport.h - piece.height,
            }}
            onTap={handlePieceTap}
            onDragEnd={move}
          />
        ))}
      </div>

      {/* Proximity indicators (P2.6). Renders a small badge above each
          cluster's centroid: `≡` (basil-green) when the cluster admits an
          equal-area partition (Beat 6 AHA condition), `≠` (oven-glow) when
          the pieces are close but their areas don't match. Pointer-events
          off so it never steals input. Beat 6 wiring will consume the
          underlying `findProximityGroups` event instead of this overlay. */}
      <div
        className="absolute inset-0 z-35 pointer-events-none"
        aria-live="polite"
      >
        {proximityGroups.map((group) => {
          const centroid = clusterCentroid(group, piecesById);
          if (!centroid) return null;
          const isEqual = group.comparison === "equal";
          return (
            <div
              key={group.pieceIds.join("|")}
              data-proximity-comparison={group.comparison}
              data-proximity-piece-ids={group.pieceIds.join(",")}
              className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-2xl font-bold shadow-lg ${
                isEqual
                  ? "bg-basil-400 text-mozzarella-50 ring-4 ring-basil-400/40"
                  : "bg-mozzarella-50 text-oven-glow ring-4 ring-oven-glow/40"
              }`}
              style={{ left: centroid.x, top: centroid.y - 20 }}
            >
              {isEqual ? "≡" : "≠"}
            </div>
          );
        })}
      </div>

      {/* Tool picker bottom-right */}
      <div className="absolute bottom-6 right-6 z-40">
        <ToolPicker visible />
      </div>

      {/* Reset button bottom-left */}
      <div className="absolute bottom-6 left-6 z-40">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-mozzarella-50 border-2 border-terracotta-300 text-terracotta-600 font-medium shadow hover:bg-mozzarella-100 focus:outline-none focus:ring-4 focus:ring-terracotta-300"
        >
          Reset pizza
        </button>
      </div>

      {/* Toast at top-center, above everything */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        aria-live="polite"
      >
        <Toast
          key={toast.key}
          open={toast.open}
          message={toast.message}
          onDismiss={() => setToast((prev) => ({ ...prev, open: false }))}
        />
      </div>

      {/* Small page label so we know we're in the sandbox preview */}
      <div className="absolute top-4 right-4 z-50 bg-mozzarella-50/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-terracotta-600 shadow">
        Sandbox preview · Beat 2 mechanic
      </div>

      {/* Pointer-following tool sprite — the SOLE cursor visible. The OS
          cursor is hidden via `cursor: none` on body, and this DOM-based
          sprite follows the pointer with the right tool variant + pointing
          override over the ToolPicker. */}
      <ToolSprite toolMode={toolMode} />

      {/* CV mode overlay — mounts HandTracker + webcam thumbnail only when
          ?cv=true is in the URL. Synthetic pointer events from the pinch
          bridge drive the existing cut + drag handlers transparently. */}
      {cvMode && <CvModeOverlay />}
    </main>
  );
}
