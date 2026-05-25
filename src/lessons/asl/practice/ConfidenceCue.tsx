import { useEffect, useState } from "react";
import type { SignRecognizer } from "./SignRecognizer";
import { MockSignRecognizer } from "./SignRecognizer";

/**
 * ConfidenceCue — ambient progress indicator showing recognizer activity.
 *
 * Thin top edge bar that fills as the recognizer accumulates confidence.
 * Subtle — doesn't compete with the camera feed or prompt.
 */
export function ConfidenceCue({ recognizer }: { recognizer: SignRecognizer | null }) {
  const [progress, setProgress] = useState(0);

  // Poll the recognizer's progress at ~20fps. For the real ONNX model,
  // this would read from a different signal. For the mock, it reads from
  // getProgress() on the MockSignRecognizer.
  useEffect(() => {
    if (!(recognizer instanceof MockSignRecognizer)) return;
    let raf = 0;
    const tick = () => {
      setProgress(recognizer.getProgress());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recognizer]);

  return (
    <div className="absolute top-0 left-0 right-0 h-1 z-10 pointer-events-none">
      <div
        className="h-full bg-sb-accent transition-all duration-150 shadow-lg shadow-sb-accent/40"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
