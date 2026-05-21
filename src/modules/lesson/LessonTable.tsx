import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToolPicker, ToolSprite } from "@/modules/world";
import {
  buildWholePiece,
  findProximityGroups,
  PizzaPiece,
  useSandboxPieces,
} from "@/modules/table";
import { SliceBurst } from "@/modules/table/SliceBurst";
import { AhaAnimation } from "@/modules/lesson/AhaAnimation";
import { WinConfetti } from "@/modules/lesson/WinConfetti";
import { Toast, fractionToastMessage } from "@/modules/toast";
import { useAppStore } from "@/store/appStore";
import { HandTracker, useHandLandmarks } from "@/modules/cv/HandTracker";
import { PinchRecognizer } from "@/modules/cv/gestures";
import { usePointerFromHand } from "@/modules/cv/usePointerFromHand";
import type {
  PieceSlot,
  PizzaFraction,
  ProximityGroup,
  SandboxPiece,
} from "@/modules/table";

// ---------------------------------------------------------------------------
// CV mode overlay — self-contained; renders only when cvMode is true.
// Lives in this file because it's tightly coupled to the table's pointer-
// event-driven slice + drag handlers (it dispatches synthetic pointer events
// that the pieces' own listeners pick up transparently).
// ---------------------------------------------------------------------------

const PRIVACY_NOTICE =
  "SuperSlice uses your camera to track hand gestures. No video is recorded or sent anywhere — all processing happens on your device.";

const CV_NOTICE_KEY = "supertutors:cv-notice-shown";

const THUMB_TIP = 4;
const INDEX_TIP = 8;

const CURSOR_COLOR_IDLE = "#f5e6c8";
const CURSOR_COLOR_PINCH = "#ff8c42";

function CvModeOverlayInner() {
  const { videoRef, result, status, error } = useHandLandmarks();
  const setCvMode = useAppStore((s) => s.setCvMode);
  const recognizersRef = useRef<PinchRecognizer[]>([
    new PinchRecognizer(),
    new PinchRecognizer(),
  ]);
  const { update: updatePointer } = usePointerFromHand();

  useEffect(() => {
    if (status === "error") {
      setCvMode(false);
      const url = new URL(window.location.href);
      url.searchParams.delete("cv");
      window.history.replaceState(null, "", url.toString());
    }
  }, [status, setCvMode]);

  const pinchStates =
    result?.landmarks.map((hand, i) => {
      const state = recognizersRef.current[i]?.update(hand);
      if (state) updatePointer(state);
      return state;
    }) ?? [];

  if (status === "error") {
    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-mozzarella-50/95 border-2 border-terracotta-300 text-terracotta-600 text-xs text-center max-w-xs shadow-xl">
        Hand tracking unavailable{error ? `: ${error}` : ""}
      </div>
    );
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  return (
    <>
      {result && result.landmarks.length > 0 && (
        <svg
          className="fixed inset-0 pointer-events-none"
          style={{ width: vw, height: vh, zIndex: 55 }}
          viewBox={`0 0 ${vw} ${vh}`}
        >
          {result.landmarks.map((hand, hi) => {
            const isPinching = pinchStates[hi]?.isPinching ?? false;
            const color = isPinching ? CURSOR_COLOR_PINCH : CURSOR_COLOR_IDLE;
            const thumbTip = hand[THUMB_TIP];
            const indexTip = hand[INDEX_TIP];
            if (!thumbTip || !indexTip) return null;
            const tx = (1 - thumbTip.x) * vw;
            const ty = thumbTip.y * vh;
            const ix = (1 - indexTip.x) * vw;
            const iy = indexTip.y * vh;
            return (
              <g key={hi}>
                <line
                  x1={tx}
                  y1={ty}
                  x2={ix}
                  y2={iy}
                  stroke={color}
                  strokeWidth={isPinching ? 3 : 2}
                  strokeOpacity={0.7}
                  strokeLinecap="round"
                />
                <circle
                  cx={ix}
                  cy={iy}
                  r={isPinching ? 10 : 7}
                  fill={color}
                  fillOpacity={0.85}
                />
                <circle
                  cx={tx}
                  cy={ty}
                  r={5}
                  fill={color}
                  fillOpacity={0.6}
                />
              </g>
            );
          })}
        </svg>
      )}

      <div
        className="absolute bottom-24 right-6 z-50 rounded-xl overflow-hidden shadow-xl border-2 border-mozzarella-100/60"
        style={{ width: 160, opacity: 0.4 }}
        title={status === "ready" ? "CV mode active" : "Loading…"}
      >
        <video
          ref={videoRef}
          className="w-full block"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
        />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-[10px] text-center px-1">
            Loading…
          </div>
        )}
      </div>
    </>
  );
}

function CvModeOverlay() {
  const [noticeAccepted, setNoticeAccepted] = useState(() =>
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(CV_NOTICE_KEY) === "1"
      : false,
  );
  const setCvMode = useAppStore((s) => s.setCvMode);

  function handleAccept() {
    window.sessionStorage.setItem(CV_NOTICE_KEY, "1");
    setNoticeAccepted(true);
  }

  function handleDecline() {
    setCvMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("cv");
    window.history.replaceState(null, "", url.toString());
  }

  if (!noticeAccepted) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Camera permission notice"
        className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <div className="mx-4 max-w-sm bg-sb-paper rounded-2xl shadow-2xl border-2 border-sb-ink p-6 flex flex-col gap-4">
          <p className="text-2xl text-center">🖐️</p>
          <p className="text-sb-ink text-sm leading-relaxed">{PRIVACY_NOTICE}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 py-2 rounded-xl border-2 border-sb-ink text-sb-ink text-sm font-medium hover:bg-sb-card focus:outline-none focus:ring-2 focus:ring-sb-accent"
            >
              No thanks
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 py-2 rounded-xl bg-sb-ink text-sb-paper text-sm font-medium hover:bg-sb-ink/90 focus:outline-none focus:ring-2 focus:ring-sb-accent"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HandTracker>
      <CvModeOverlayInner />
    </HandTracker>
  );
}

// ---------------------------------------------------------------------------
// Geometry helpers — pure functions, unchanged from SandboxPreview.
// ---------------------------------------------------------------------------

/**
 * CSS clip-path for each eighth slot so the wrapper is clipped to just
 * the triangle area — both visually (no change, the visible triangle is
 * what's painted in the PNG anyway) AND for pointer events. Without
 * clipping, the square 160×160 frame catches hits in its transparent
 * corners and the kid accidentally selects the wrong eighth.
 */
function clipPathForSlot(slot: PieceSlot): string | undefined {
  switch (slot) {
    case "eighth-tl-t":
    case "eighth-br-r":
      return "polygon(0 0, 100% 0, 100% 100%)";
    case "eighth-tl-l":
    case "eighth-br-b":
      return "polygon(0 0, 0 100%, 100% 100%)";
    case "eighth-tr-t":
    case "eighth-bl-l":
      return "polygon(0 0, 100% 0, 0 100%)";
    case "eighth-tr-r":
    case "eighth-bl-b":
      return "polygon(100% 0, 100% 100%, 0 100%)";
    default:
      return undefined;
  }
}

/** Tracks viewport dimensions, updating on resize. */
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

const BASE_SIZE = 320;

function defaultInitialPosition() {
  if (typeof window === "undefined") {
    return { x: 430, y: 220 };
  }
  return {
    x: window.innerWidth / 2 - BASE_SIZE / 2,
    y: Math.max(140, window.innerHeight * 0.28),
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Payload for the parent's `onSlice` callback. */
export interface LessonTableSliceEvent {
  childrenFraction: PizzaFraction;
  isFirstTime: boolean;
}

export interface LessonTableProps {
  /** Initial pizza position. Defaults to viewport-centered, ~28% from top. */
  initialPiecePosition?: { x: number; y: number };
  /**
   * Whether to render the in-table AHA / Win animations. Defaults to true.
   * Parents that render their own (e.g. driven by a state machine) can
   * pass false to avoid duplication.
   */
  renderHeroAnimations?: boolean;
  /** Fired immediately after a slice — useful for Freddy reactions / toast overrides. */
  onSlice?: (event: LessonTableSliceEvent) => void;
  /**
   * Fired the FIRST time per reset cycle that proximity finds an
   * equal-area cluster. (Beat 6 AHA condition.)
   */
  onAha?: () => void;
  /**
   * Fired the FIRST time per reset cycle that proximity finds a cluster
   * whose total area equals one whole pizza. (Beat 8 Win condition.)
   */
  onWin?: () => void;
}

export interface LessonTableHandle {
  /** Reset the table to a single whole pizza. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// LessonTable — the manipulative workspace.
//
// Self-contained: owns pieces, tools, slicing, drag, proximity, toast,
// CV mode overlay, tool-sprite cursor, slice particles, and (by default)
// the AHA + Win hero animations. Parents (SandboxPreview, LessonView)
// render their own world chrome (RestaurantScene, FreddyCharacter,
// hold-to-reset hit area, page-specific labels) and mount LessonTable
// inside that positioned context.
//
// Props expose `onSlice`, `onAha`, `onWin` callbacks so a lesson can drive
// Freddy reactions in response to the kid's actions. A ref-based `reset()`
// lets the parent's hold-to-reset gesture restart the table without
// reaching into internals.
// ---------------------------------------------------------------------------

export const LessonTable = forwardRef<LessonTableHandle, LessonTableProps>(
  function LessonTable(
    {
      initialPiecePosition,
      renderHeroAnimations = true,
      onSlice,
      onAha,
      onWin,
    },
    ref,
  ) {
    const [initialPos] = useState(
      () => initialPiecePosition ?? defaultInitialPosition(),
    );
    const toolMode = useAppStore((s) => s.toolMode);
    const cvModeStore = useAppStore((s) => s.cvMode);
    const setCvMode = useAppStore((s) => s.setCvMode);
    const cvMode =
      cvModeStore ||
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("cv"));

    // Sync Zustand when the URL param is the initial source (direct link).
    useEffect(() => {
      if (
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("cv") &&
        !cvModeStore
      ) {
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

    const [seenFractions, setSeenFractions] = useState<Set<PizzaFraction>>(
      new Set(),
    );

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

    const [ahaActive, setAhaActive] = useState(false);
    const ahaFiredRef = useRef(false);
    const [winActive, setWinActive] = useState(false);
    const winFiredRef = useRef(false);

    const didDragCutRef = useRef(false);
    const burstIdRef = useRef(0);
    const lastPressPosRef = useRef({ x: 0, y: 0 });
    const [bursts, setBursts] = useState<
      { id: number; x: number; y: number }[]
    >([]);

    const handlePieceTap = useCallback(
      (pieceId: string) => {
        if (didDragCutRef.current) return;
        if (toolMode !== "cutter") return;
        const result = slice(pieceId);
        if (!result) return;

        const isFirstTime = !seenFractions.has(result.childrenFraction);
        if (isFirstTime) {
          setSeenFractions((prev) => {
            const next = new Set(prev);
            next.add(result.childrenFraction);
            return next;
          });
        }
        if (
          result.childrenFraction === "1/2" ||
          result.childrenFraction === "1/4" ||
          result.childrenFraction === "1/8"
        ) {
          showToast(
            fractionToastMessage(result.childrenFraction, isFirstTime),
          );
        }
        onSlice?.({
          childrenFraction: result.childrenFraction,
          isFirstTime,
        });
      },
      [toolMode, slice, seenFractions, onSlice],
    );

    const handlePieceTapRef = useRef(handlePieceTap);
    useEffect(() => {
      handlePieceTapRef.current = handlePieceTap;
    });

    /**
     * Drag-to-cut: when the cutter is active, slice the FIRST piece the
     * cursor crosses during a press-and-drag — but trigger the actual
     * slice on pointer UP (end of drag), NOT during the drag.
     */
    const pendingCutPieceRef = useRef<string | null>(null);

    useEffect(() => {
      if (toolMode !== "cutter") return;

      function recordPieceAt(x: number, y: number) {
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
        pendingCutPieceRef.current = null;
        didDragCutRef.current = false;
        lastPressPosRef.current = { x: e.clientX, y: e.clientY };
        recordPieceAt(e.clientX, e.clientY);
      }
      function onPointerMove(e: PointerEvent) {
        if (e.buttons === 0) return;
        lastPressPosRef.current = { x: e.clientX, y: e.clientY };
        recordPieceAt(e.clientX, e.clientY);
      }
      function onPointerUp() {
        const pieceId = pendingCutPieceRef.current;
        pendingCutPieceRef.current = null;
        if (!pieceId) return;
        handlePieceTapRef.current(pieceId);
        const { x, y } = lastPressPosRef.current;
        setBursts((prev) => [
          ...prev,
          { id: ++burstIdRef.current, x, y },
        ]);
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

    const handleReset = useCallback(() => {
      reset();
      setSeenFractions(new Set());
      setToast((prev) => ({ ...prev, open: false, key: prev.key + 1 }));
      setBursts([]);
      ahaFiredRef.current = false;
      setAhaActive(false);
      winFiredRef.current = false;
      setWinActive(false);
    }, [reset]);

    useImperativeHandle(ref, () => ({ reset: handleReset }), [handleReset]);

    const proximityGroups = useMemo<ProximityGroup[]>(() => {
      return findProximityGroups(pieces.map(toProximityPiece));
    }, [pieces]);

    const piecesById = useMemo(() => {
      const map = new Map<string, SandboxPiece>();
      for (const p of pieces) map.set(p.id, p);
      return map;
    }, [pieces]);

    // Fire AHA + Win callbacks the first time per reset cycle each
    // condition holds. State updates are batched so parents see both
    // the local `setAhaActive` glow AND the `onAha` callback in the
    // same render.
    useEffect(() => {
      const WHOLE = 1 - 1e-9;
      if (!ahaFiredRef.current) {
        const hasEqual = proximityGroups.some((g) => g.comparison === "equal");
        if (hasEqual) {
          ahaFiredRef.current = true;
          setAhaActive(true);
          onAha?.();
        }
      }
      if (!winFiredRef.current) {
        const hasWhole = proximityGroups.some((g) => g.totalArea >= WHOLE);
        if (hasWhole) {
          winFiredRef.current = true;
          setWinActive(true);
          onWin?.();
        }
      }
    }, [proximityGroups, onAha, onWin]);

    // Tool-driven cursor classes on documentElement + body (the ToolSprite
    // also follows the pointer via JS). See SandboxPreview's earlier
    // comment for the three-layer redundancy rationale.
    const toolClassName = toolMode === "cutter" ? "tool-cutter" : "tool-glove";

    useEffect(() => {
      document.documentElement.classList.add(toolClassName);
      document.body.classList.add(toolClassName);
      return () => {
        document.documentElement.classList.remove(toolClassName);
        document.body.classList.remove(toolClassName);
      };
    }, [toolClassName]);

    const piecesDraggable = toolMode === "glove";

    return (
      <>
        {/* Sandbox piece layer — pieces sit above the counter mask. */}
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
              clipPath={clipPathForSlot(piece.slot)}
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

        {/* Proximity indicators. */}
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

        {/* Tool picker bottom-right. */}
        <div className="absolute bottom-6 right-6 z-40">
          <ToolPicker visible />
        </div>

        {/* Toast top-center. */}
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

        {/* Pointer-following tool sprite. */}
        <ToolSprite toolMode={toolMode} />

        {/* Hero animations — render in-table by default; parents that
            drive their own (state-machine-backed) can opt out. */}
        {renderHeroAnimations ? (
          <>
            <AhaAnimation
              active={ahaActive}
              onDone={() => setAhaActive(false)}
              durationMs={1500}
            />
            <WinConfetti
              active={winActive}
              onDone={() => setWinActive(false)}
            />
          </>
        ) : null}

        {/* Slice particle bursts. */}
        {bursts.map((b) => (
          <SliceBurst
            key={b.id}
            x={b.x}
            y={b.y}
            onDone={() =>
              setBursts((prev) => prev.filter((p) => p.id !== b.id))
            }
          />
        ))}

        {/* CV mode overlay — mounts when ?cv=true or appStore.cvMode is true. */}
        {cvMode && <CvModeOverlay />}
      </>
    );
  },
);
