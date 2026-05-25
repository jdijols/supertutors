import { useEffect, useRef, useState } from "react";
import type { Sign } from "../vocab";
import type { SignRecognizer } from "./SignRecognizer";
import { OnnxSignRecognizer } from "./OnnxSignRecognizer";

/**
 * RecognitionHUD — live diagnostic readout of the ONNX classifier.
 *
 * Reads `getDebugInfo()` from the recognizer at the browser's animation
 * frame rate and renders the top-N predicted classes with confidence
 * bars. Also surfaces model status, smoothing-buffer fill, and the
 * pass-hold counter so we can see exactly why a pass isn't firing.
 *
 * Toggle visibility with the `D` key.
 */

const TOP_N = 5;

interface RecognitionHUDProps {
  recognizer: SignRecognizer | null;
  target: Sign;
}

interface Snapshot {
  status: "loading" | "ready" | "error";
  ranked: Array<{ label: string; prob: number }>;
  framesBuffered: number;
  passHoldCount: number;
  passHoldFramesNeeded: number;
  passThreshold: number;
  failThreshold: number;
}

export function RecognitionHUD({ recognizer, target }: RecognitionHUDProps) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef<number>(0);

  // Toggle with the `D` key (after Demo overrides P/F/U)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "d") setVisible((v) => !v);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Poll the recognizer at animation-frame cadence
  useEffect(() => {
    if (!visible) return;
    const onnx = recognizer as OnnxSignRecognizer | null;
    if (!onnx || typeof onnx.getDebugInfo !== "function") {
      setSnapshot(null);
      return;
    }

    function tick() {
      const info = onnx!.getDebugInfo();
      if (info) {
        const ranked = info.labels
          .map((label, i) => ({ label, prob: info.probs[i] ?? 0 }))
          .sort((a, b) => b.prob - a.prob)
          .slice(0, TOP_N);
        setSnapshot({
          status: info.status,
          ranked,
          framesBuffered: info.framesBuffered,
          passHoldCount: info.passHoldCount,
          passHoldFramesNeeded: info.passHoldFramesNeeded,
          passThreshold: info.thresholds.pass,
          failThreshold: info.thresholds.fail,
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [recognizer, visible]);

  if (!visible) {
    return (
      <div className="absolute top-4 left-4 z-20 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
        D = show recognition HUD
      </div>
    );
  }

  return (
    <div
      data-testid="recognition-hud"
      className="absolute top-4 left-4 z-20 w-[280px] rounded-xl border border-white/15 bg-black/55 backdrop-blur-md p-3 font-mono text-[10px] text-white shadow-xl shadow-black/40"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="uppercase tracking-[0.18em] text-white/60">
          Recognition HUD
        </span>
        <span className="text-white/40">[ D ]</span>
      </div>

      {!snapshot && (
        <div className="text-white/60 py-2">Waiting for recognizer…</div>
      )}

      {snapshot && snapshot.status === "loading" && (
        <div className="text-yellow-300 py-2 animate-pulse">
          Loading ONNX model…
        </div>
      )}

      {snapshot && snapshot.status === "error" && (
        <div className="text-red-400 py-2">
          Model failed to load. Check console.
        </div>
      )}

      {snapshot && snapshot.status === "ready" && (
        <>
          {snapshot.framesBuffered === 0 ? (
            <div className="text-white/60 py-2">
              No hand frames yet — raise your hand.
            </div>
          ) : (
            <div className="space-y-1">
              {snapshot.ranked.map(({ label, prob }) => {
                const isTarget = label === target.glyph;
                const aboveFail = prob >= snapshot.failThreshold;
                const abovePass = prob >= snapshot.passThreshold;
                return (
                  <div key={label} className="relative">
                    {/* bar */}
                    <div className="absolute inset-0 rounded">
                      <div
                        className={`h-full rounded transition-all duration-100 ${
                          abovePass
                            ? "bg-green-500/55"
                            : aboveFail
                              ? "bg-yellow-500/35"
                              : "bg-white/10"
                        }`}
                        style={{ width: `${Math.round(prob * 100)}%` }}
                      />
                    </div>
                    {/* label + value */}
                    <div className="relative flex items-center justify-between px-2 py-1">
                      <span
                        className={`uppercase tracking-[0.12em] ${
                          isTarget ? "text-white font-bold" : "text-white/85"
                        }`}
                      >
                        {isTarget ? `▸ ${label}` : label}
                      </span>
                      <span className="tabular-nums text-white/95">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-white/10 space-y-0.5 text-white/55">
            <Row label="target" value={target.glyph} />
            <Row
              label="smoothing"
              value={`${snapshot.framesBuffered} frames`}
            />
            <Row
              label="pass hold"
              value={`${snapshot.passHoldCount}/${snapshot.passHoldFramesNeeded}`}
            />
            <Row
              label="thresholds"
              value={`pass ${Math.round(snapshot.passThreshold * 100)}% · fail ${Math.round(snapshot.failThreshold * 100)}%`}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-[0.12em]">{label}</span>
      <span className="tabular-nums text-white/80">{value}</span>
    </div>
  );
}
