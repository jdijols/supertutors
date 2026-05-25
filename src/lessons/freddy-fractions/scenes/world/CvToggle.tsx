import { motion } from "framer-motion";
import type { CvCameraHandle } from "@/platform/lesson-sdk";

/**
 * CvToggle — fixed-position computer-vision (hand-tracking) mode toggle.
 *
 * Pinned bottom-left so it mirrors MuteToggle's top-right placement. The
 * visual pattern is identical to MuteToggle — warm paper card at rest,
 * solid ink when active — so the two read as a matching pair of chrome
 * controls (one for audio, one for camera).
 *
 * Pulled out of the ToolPicker (where it lived as a third icon) because
 * "enable camera tracking" is a fundamentally different concern from
 * "pick glove or cutter": it changes the input modality for the whole
 * lesson, not the tool being held. The FaceTime-evocative camera icon
 * tells the kid "this turns the camera on" without needing to read.
 *
 * Controlled by the platform: the `cv` handle is the single source of
 * truth for enabled state. The platform (LessonHost) is responsible for
 * URL sync (`?cv=true`) so this component stays pure.
 */

export interface CvToggleProps {
  cv: CvCameraHandle;
}

export function CvToggle({ cv }: CvToggleProps) {
  const cvMode = cv.enabled;

  function handleToggle() {
    cv.setEnabled(!cvMode);
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-label={
        cvMode ? "Turn off hand tracking" : "Turn on hand tracking"
      }
      aria-pressed={cvMode}
      data-testid="cv-toggle"
      data-active={cvMode}
      data-cursor-pointing
      className={`
        fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[60]
        w-14 h-14 sm:w-16 sm:h-16
        rounded-2xl border-2 border-sb-ink
        shadow-xl shadow-sb-accent-deep/25
        flex items-center justify-center cursor-pointer
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
        ${
          cvMode
            ? "bg-sb-ink text-white"
            : "bg-sb-paper text-sb-ink hover:bg-sb-paper-deep"
        }
      `}
    >
      {cvMode ? <CameraOnIcon /> : <CameraOffIcon />}
    </motion.button>
  );
}

function CameraOnIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinejoin="round"
    >
      {/* Solid FaceTime-style video camera silhouette — filled body matches
          the visual weight of MuteToggle's filled speaker. Camera is ON. */}
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4V8z" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinejoin="round"
    >
      {/* Same filled camera silhouette with a diagonal "crossed-out" slash.
          The slash is drawn twice: a wider sb-paper outer stroke that
          punches visible cream margins through the dark body, then a
          narrower currentColor inner stroke on top — so the slash reads
          cleanly against both the cream button background AND the filled
          camera body. Mirrors MuteToggle's "speaker + X" off convention. */}
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4V8z" />
      <line
        x1="3"
        y1="21"
        x2="21"
        y2="3"
        stroke="#EFE7DA"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="21"
        x2="21"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
