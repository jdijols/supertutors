import { useEffect, useRef, useState } from 'react';
import { HandTracker, useHandLandmarks } from '@/platform/cv/HandTracker';
import { PinchRecognizer } from '@/platform/cv/gestures';
import { usePointerFromHand } from '@/platform/cv/usePointerFromHand';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// MediaPipe hand skeleton connection pairs (landmark index pairs)
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

function LandmarkOverlay({
  landmarks,
  width,
  height,
}: {
  landmarks: NormalizedLandmark[][];
  width: number;
  height: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    >
      {landmarks.map((hand, hi) => (
        <g key={hi}>
          {HAND_CONNECTIONS.map(([a, b], ci) => {
            const la = hand[a];
            const lb = hand[b];
            if (!la || !lb) return null;
            return (
              <line
                key={ci}
                x1={(1 - la.x) * width}
                y1={la.y * height}
                x2={(1 - lb.x) * width}
                y2={lb.y * height}
                stroke="#f5e6c8"
                strokeWidth={2}
                strokeOpacity={0.7}
              />
            );
          })}
          {hand.map((lm, li) => (
            <circle
              key={li}
              cx={(1 - lm.x) * width}
              cy={lm.y * height}
              r={li === 4 || li === 8 ? 7 : 4}
              fill={li === 4 || li === 8 ? '#ff8c42' : '#f5e6c8'}
              fillOpacity={0.9}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** A simple box that can be dragged via mouse or synthetic pointer events. */
function DraggableTestBox() {
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setPos({
      x: dragStart.current.bx + e.clientX - dragStart.current.mx,
      y: dragStart.current.by + e.clientY - dragStart.current.my,
    });
  }

  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <div
      data-testid="cv-drag-box"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 80,
        height: 80,
        background: '#f5e6c8',
        border: '2px solid #ff8c42',
        borderRadius: 12,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      🍕
    </div>
  );
}

function CvPreviewInner() {
  const { videoRef, result, status, error } = useHandLandmarks();
  const recognizersRef = useRef<PinchRecognizer[]>([
    new PinchRecognizer(),
    new PinchRecognizer(),
  ]);
  const { update: updatePointer } = usePointerFromHand();

  // Recognizer state is derived from the latest landmark frame in an
  // effect (not during render) so the ref+side-effect (updatePointer)
  // doesn't trip react-hooks/refs. We keep the latest pinch states in
  // local state so the JSX below can render the indicator badges.
  const [pinchStates, setPinchStates] = useState<
    Array<ReturnType<PinchRecognizer["update"]> | undefined>
  >([]);

  useEffect(() => {
    if (!result?.landmarks) {
      setPinchStates([]);
      return;
    }
    const next = result.landmarks.map((hand, i) => {
      const state = recognizersRef.current[i]?.update(hand);
      if (state) updatePointer(state);
      return state;
    });
    setPinchStates(next);
  }, [result, updatePointer]);

  const anyPinching = pinchStates.some((s) => s?.isPinching);

  return (
    <div className="min-h-screen bg-sb-surface flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-sb-ink text-2xl font-bold">CV Preview — Hand Tracking</h1>

      <div className="relative w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        {result && result.landmarks.length > 0 && (
          <LandmarkOverlay landmarks={result.landmarks} width={640} height={480} />
        )}
        {anyPinching && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: '#f5e6c8', color: '#1a1208' }}
            data-testid="pinching-badge"
          >
            PINCHING
          </div>
        )}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
            Loading hand tracker…
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-400 text-sm text-center px-4">
            {error ?? 'Camera unavailable'}
          </div>
        )}
      </div>

      {/* Pinch strength meters — one per detected hand */}
      {result && result.landmarks.length > 0 && (
        <div className="flex gap-6 items-end">
          {pinchStates.map((state, i) => {
            if (!state) return null;
            const handName = result.handedness[i]?.[0]?.categoryName ?? `Hand ${i + 1}`;
            const pct = Math.round(state.strength * 100);
            const isPinching = state.isPinching;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="text-xs font-mono text-sb-ink">
                  {handName} — {pct}%{isPinching ? ' 🤌' : ''}
                </div>
                <div className="w-32 h-2 bg-sb-card rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: isPinching ? '#ff8c42' : '#f5e6c8',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-sb-muted text-sm text-center max-w-md">
        {status === 'ready' && result
          ? result.landmarks.length > 0
            ? `${result.landmarks.length} hand${result.landmarks.length > 1 ? 's' : ''} detected`
            : 'No hands detected — move your hand into frame'
          : null}
      </div>

      <p className="text-sb-muted text-xs">
        Pinch + drag the 🍕 tile below with your hand — or use your mouse.
      </p>

      <DraggableTestBox />
    </div>
  );
}

export function CvPreview() {
  return (
    <HandTracker>
      <CvPreviewInner />
    </HandTracker>
  );
}
