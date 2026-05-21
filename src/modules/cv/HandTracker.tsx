import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  HandLandmarker as HandLandmarkerType,
  NormalizedLandmark,
  Category,
} from '@mediapipe/tasks-vision';

export type HandResult = {
  landmarks: NormalizedLandmark[][];
  handedness: Category[][];
};

type HandTrackerCtx = {
  result: HandResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
};

const HandTrackerContext = createContext<HandTrackerCtx | null>(null);

export function useHandLandmarks(): HandTrackerCtx {
  const ctx = useContext(HandTrackerContext);
  if (!ctx) throw new Error('useHandLandmarks must be used within <HandTracker>');
  return ctx;
}

export function HandTracker({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarkerType | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);

  const [result, setResult] = useState<HandResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runningRef.current = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const { HandLandmarker, FilesetResolver } = await import(
          '@mediapipe/tasks-vision'
        );

        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );

        const landmarker = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        landmarkerRef.current = landmarker;
        setStatus('ready');

        function detect() {
          if (!runningRef.current) return;
          const v = videoRef.current;
          if (v && v.readyState >= 2 && landmarkerRef.current) {
            const r = landmarkerRef.current.detectForVideo(v, performance.now());
            setResult({
              landmarks: r.landmarks,
              handedness: r.handedness ?? r.handednesses ?? [],
            });
          }
          rafRef.current = requestAnimationFrame(detect);
        }

        detect();
      } catch (e) {
        console.warn('[CV] HandTracker init failed:', e);
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      }
    }

    init();

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <HandTrackerContext.Provider value={{ result, videoRef, status, error }}>
      {children}
    </HandTrackerContext.Provider>
  );
}
