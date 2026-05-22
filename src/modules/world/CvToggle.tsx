import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";

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
 * Mounted from LessonTable so it shares the lesson lifecycle (mode only
 * makes sense inside the lesson). State + URL sync identical to the
 * previous inline implementation.
 */

function syncCvParam(enabled: boolean) {
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set("cv", "true");
  } else {
    url.searchParams.delete("cv");
  }
  window.history.replaceState(null, "", url.toString());
}

export function CvToggle() {
  const cvMode = useAppStore((s) => s.cvMode);
  const setCvMode = useAppStore((s) => s.setCvMode);

  function handleToggle() {
    const next = !cvMode;
    setCvMode(next);
    syncCvParam(next);
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
      <CameraIcon />
    </motion.button>
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* FaceTime-style video camera silhouette: rectangle body with
          play-arrow lens off the right side. Recognizable as "video
          camera / turn camera on" without text. */}
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4V8z" />
    </svg>
  );
}
