import { useEffect, useRef } from "react";
import type { HandResult } from "@/platform/cv/HandTracker";

/**
 * HandMeshOverlay — draws MediaPipe hand skeleton on a canvas that sits
 * directly over the camera feed.
 *
 * The video uses `object-cover` which crops the feed to fill the
 * viewport. We compute the same crop transform so the dots land on
 * the correct fingers rather than drifting off due to the uncorrected
 * aspect ratio.
 *
 * Both the video and this canvas use `-scale-x-100` so the user sees a
 * mirror image; the transform cancels out and we draw in the same
 * mirrored space without extra coordinate flipping.
 */

interface HandMeshOverlayProps {
  result: HandResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function HandMeshOverlay({ result, videoRef }: HandMeshOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sync canvas resolution to its CSS display size on every draw so
    // it stays sharp on resize / DevTools responsive toggle.
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, displayW, displayH);

    if (!result || result.landmarks.length === 0) return;

    // ── object-cover offset / scale ──────────────────────────────────
    // Figure out how the video is cropped so dots land on real fingers.
    const video = videoRef.current;
    const vw = video?.videoWidth || displayW;
    const vh = video?.videoHeight || displayH;

    const videoAspect = vw / vh;
    const displayAspect = displayW / displayH;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspect > displayAspect) {
      // Video is wider → height fills, left/right cropped
      scale = displayH / vh;
      offsetX = (displayW - vw * scale) / 2;
    } else {
      // Video is taller → width fills, top/bottom cropped
      scale = displayW / vw;
      offsetY = (displayH - vh * scale) / 2;
    }

    const toCanvas = (nx: number, ny: number) => ({
      x: offsetX + nx * vw * scale,
      y: offsetY + ny * vh * scale,
    });

    // ── MediaPipe hand connections (21 landmark skeleton) ────────────
    const CONNECTIONS: [number, number][] = [
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

    for (const landmarks of result.landmarks) {
      // Skeleton lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineCap = "round";
      for (const [a, b] of CONNECTIONS) {
        const pa = toCanvas(landmarks[a].x, landmarks[a].y);
        const pb = toCanvas(landmarks[b].x, landmarks[b].y);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // Landmark dots
      for (let i = 0; i < landmarks.length; i++) {
        const { x, y } = toCanvas(landmarks[i].x, landmarks[i].y);
        const isFingerTip = [4, 8, 12, 16, 20].includes(i);

        ctx.beginPath();
        ctx.arc(x, y, isFingerTip ? 6 : 4, 0, Math.PI * 2);

        // Fill: bright accent for fingertips, white for joints
        ctx.fillStyle = isFingerTip
          ? "rgba(120,220,160,0.95)"   // green — fingertips
          : "rgba(255,255,255,0.90)";  // white — joints
        ctx.fill();

        // Thin dark ring for legibility on light backgrounds
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();
      }
    }
  }, [result, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none z-[5]"
    />
  );
}
