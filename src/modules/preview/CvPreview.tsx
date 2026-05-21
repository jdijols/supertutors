import { useRef } from 'react';
import { HandTracker, useHandLandmarks } from '@/modules/cv/HandTracker';
import { PinchRecognizer } from '@/modules/cv/gestures';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// MediaPipe hand skeleton connection pairs (landmark index pairs)
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
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
            // Mirror X because video is rendered mirrored
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

function CvPreviewInner() {
  const { videoRef, result, status, error } = useHandLandmarks();
  // One PinchRecognizer per possible hand (max 2)
  const recognizersRef = useRef<PinchRecognizer[]>([
    new PinchRecognizer(),
    new PinchRecognizer(),
  ]);

  const pinchStates = result?.landmarks.map((hand, i) =>
    recognizersRef.current[i]?.update(hand),
  ) ?? [];

  const anyPinching = pinchStates.some((s) => s?.isPinching);

  return (
    <div className="min-h-screen bg-sb-surface flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-sb-ink text-2xl font-bold">CV Preview — Hand Tracking</h1>

      <div className="relative w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
        {/* Mirrored webcam feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />

        {/* Landmark overlay */}
        {result && result.landmarks.length > 0 && (
          <LandmarkOverlay
            landmarks={result.landmarks}
            width={640}
            height={480}
          />
        )}

        {/* PINCHING badge */}
        {anyPinching && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: '#f5e6c8', color: '#1a1208' }}
            data-testid="pinching-badge"
          >
            PINCHING
          </div>
        )}

        {/* Status overlay */}
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

      <div className="text-sb-muted text-sm text-center max-w-md">
        {status === 'ready' && result
          ? result.landmarks.length > 0
            ? `Detecting ${result.landmarks.length} hand${result.landmarks.length > 1 ? 's' : ''} — ${result.handedness.map((h) => h[0]?.categoryName).join(', ')}`
            : 'No hands detected — try moving your hand into frame'
          : null}
      </div>
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
