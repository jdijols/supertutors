import { motion } from "framer-motion";
import { usePlatformStore } from "@/platform/stores/platformStore";

export function MuteToggle({
  surface = "light",
  inline = false,
}: {
  surface?: "light" | "dark";
  /** When true, drop the fixed-position chrome and render inline (the
   * parent owns layout). Used by surfaces that compose a header row
   * containing the chrome controls (LandingPage, BrainliftViewer). */
  inline?: boolean;
}) {
  const muted = usePlatformStore((s) => s.muted);
  const toggle = usePlatformStore((s) => s.toggleMute);

  // On dark (ink) surfaces the "active = bg-sb-ink" rule would make the
  // button invisible. Invert: active on dark → bg-sb-paper text-sb-ink.
  const activeClass =
    surface === "dark"
      ? "bg-sb-paper text-sb-ink"
      : "bg-sb-ink text-white";

  const restClass =
    surface === "dark"
      ? "bg-sb-paper text-sb-ink hover:bg-sb-paper-deep"
      : "bg-sb-paper text-sb-ink hover:bg-sb-paper-deep";

  const offsetClass =
    surface === "dark" ? "focus-visible:ring-offset-sb-ink" : "focus-visible:ring-offset-sb-surface";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      aria-pressed={muted}
      data-testid="mute-toggle"
      data-muted={muted}
      data-cursor-pointing
      className={`
        ${inline ? "" : "fixed top-4 right-4 sm:top-6 sm:right-6 z-[60]"}
        w-14 h-14 sm:w-16 sm:h-16
        rounded-2xl border-2 border-sb-ink
        shadow-xl shadow-sb-accent-deep/25
        flex items-center justify-center cursor-pointer
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 ${offsetClass}
        ${muted ? restClass : activeClass}
      `}
    >
      {muted ? <SpeakerMutedIcon /> : <SpeakerOnIcon />}
    </motion.button>
  );
}

function SpeakerOnIcon() {
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
      <path d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function SpeakerMutedIcon() {
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
      <path d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5z" fill="currentColor" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  );
}
