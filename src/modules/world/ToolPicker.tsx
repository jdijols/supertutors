import { motion } from "framer-motion";
import { useAppStore, type ToolMode } from "@/store/appStore";

/**
 * ToolPicker — bottom-RIGHT corner picker between Glove, Cutter, and Hands (CV).
 *
 * Kid-driven (Figma-style, not context-gated per PRD §3.3). All tools always
 * available; tap to switch. "🖐️ Hands" button enables CV physical mode via
 * MediaPipe; the glove/cutter selection persists alongside it.
 *
 * Hidden during onboarding (no manipulative interaction expected yet).
 */
export interface ToolPickerProps {
  visible?: boolean;
}

const TOOLS: { mode: ToolMode; src: string; label: string }[] = [
  {
    mode: "glove",
    src: "/images/ui/glove-open.png",
    label: "Glove (move pieces)",
  },
  {
    mode: "cutter",
    src: "/images/ui/cutter-upright.png",
    label: "Pizza cutter (slice)",
  },
];

/** Sync ?cv=true / remove ?cv from the URL without triggering a navigation. */
function syncCvParam(enabled: boolean) {
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set("cv", "true");
  } else {
    url.searchParams.delete("cv");
  }
  window.history.replaceState(null, "", url.toString());
}

export function ToolPicker({ visible = true }: ToolPickerProps) {
  const toolMode = useAppStore((s) => s.toolMode);
  const setToolMode = useAppStore((s) => s.setToolMode);
  const cvMode = useAppStore((s) => s.cvMode);
  const setCvMode = useAppStore((s) => s.setCvMode);
  // Spotlight is set by LessonExploration during the opener tour — when
  // Freddy says "slicer and glove are right down there," the picker pulses
  // + scales to draw the kid's eye.
  const spotlit = useAppStore((s) => s.spotlight === "toolpicker");

  if (!visible) return null;

  function handleCvToggle() {
    const next = !cvMode;
    setCvMode(next);
    syncCvParam(next);
  }

  return (
    <div
      data-testid="tool-picker"
      data-spotlight={spotlit}
      role="group"
      aria-label="Pick a tool"
      data-cursor-pointing
      className={`flex items-center gap-2 p-2 bg-sb-paper rounded-2xl shadow-xl shadow-sb-accent-deep/25 border-2 border-sb-ink ${
        spotlit ? "spotlight-pulse" : ""
      }`}
    >
      {TOOLS.map((tool) => {
        const active = toolMode === tool.mode;
        return (
          <motion.button
            key={tool.mode}
            type="button"
            onClick={() => setToolMode(tool.mode)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            aria-label={tool.label}
            aria-pressed={active}
            data-active={active}
            className={`
              w-14 h-14 sm:w-16 sm:h-16 rounded-xl grid place-items-center p-2
              border border-sb-ink/10
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-paper
              ${
                active
                  ? "bg-sb-ink shadow-inner [&_img]:brightness-0 [&_img]:invert"
                  : "hover:bg-sb-card"
              }
            `}
          >
            <img
              src={tool.src}
              alt=""
              draggable={false}
              className="w-full h-full object-contain select-none pointer-events-none transition-[filter] duration-200"
            />
          </motion.button>
        );
      })}

      {/* CV hands-mode toggle */}
      <motion.button
        type="button"
        onClick={handleCvToggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 600, damping: 22 }}
        aria-label="Hand tracking (CV mode)"
        aria-pressed={cvMode}
        data-active={cvMode}
        data-testid="cv-mode-button"
        className={`
          w-14 h-14 sm:w-16 sm:h-16 rounded-xl grid place-items-center text-2xl
          border border-sb-ink/10
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-paper
          ${cvMode ? "bg-sb-ink shadow-inner" : "hover:bg-sb-card"}
        `}
      >
        🖐️
      </motion.button>
    </div>
  );
}
