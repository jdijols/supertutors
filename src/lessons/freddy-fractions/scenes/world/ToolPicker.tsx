import { motion } from "framer-motion";
import { useTutorStore, type ToolMode } from "../../store/tutorStore";

/**
 * ToolPicker — bottom-RIGHT corner picker between Glove and Cutter.
 *
 * Kid-driven (Figma-style, not context-gated per PRD §3.3). Both tools are
 * always available; tap to switch.
 *
 * Camera / hand-tracking mode is no longer part of the picker — it lives
 * as a standalone `CvToggle` button in the bottom-left corner, paired
 * visually with MuteToggle in the top-right. Different concern, different
 * affordance.
 *
 * Hidden during onboarding (no manipulative interaction expected yet).
 */
export interface ToolPickerProps {
  visible?: boolean;
}

const TOOLS: { mode: ToolMode; src: string; label: string }[] = [
  {
    mode: "glove",
    src: "/lessons/freddy-fractions/images/ui/glove-open.png",
    label: "Glove (move pieces)",
  },
  {
    mode: "cutter",
    src: "/lessons/freddy-fractions/images/ui/cutter-upright.png",
    label: "Pizza cutter (slice)",
  },
];

export function ToolPicker({ visible = true }: ToolPickerProps) {
  const toolMode = useTutorStore((s) => s.toolMode);
  const setToolMode = useTutorStore((s) => s.setToolMode);
  // Spotlight is set by LessonExploration during the opener tour — when
  // Freddy says "slicer and glove are right down there," the picker pulses
  // + scales to draw the kid's eye.
  const spotlit = useTutorStore((s) => s.spotlight === "toolpicker");

  if (!visible) return null;

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
    </div>
  );
}
