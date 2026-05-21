import { motion } from "framer-motion";
import { useAppStore, type ToolMode } from "@/store/appStore";

/**
 * ToolPicker — bottom-RIGHT corner picker between Glove and Cutter tools.
 *
 * Kid-driven (Figma-style, not context-gated per PRD §3.3). Both tools
 * always available; tap to switch.
 *
 * Hidden during onboarding (no manipulative interaction expected yet).
 */
export interface ToolPickerProps {
  visible?: boolean;
}

/**
 * Tool icon sources. We use the same artwork as the active cursor / touch
 * sprite (open-glove and upright-cutter) so the picker visually mirrors
 * what the kid sees when the tool is in use. Closed/cutting variants are
 * NOT used here — those are only for the active interaction state.
 */
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

export function ToolPicker({ visible = true }: ToolPickerProps) {
  const toolMode = useAppStore((s) => s.toolMode);
  const setToolMode = useAppStore((s) => s.setToolMode);

  if (!visible) return null;

  return (
    <div
      data-testid="tool-picker"
      role="group"
      aria-label="Pick a tool"
      // `data-cursor-pointing` triggers the pointing-glove cursor override
      // in globals.css whenever the cursor is over the picker (or its
      // children), regardless of which tool is the currently-active one.
      // The kid sees the pointing-finger glove on the picker, signalling
      // "this UI is clickable" — then the active-tool cursor returns as
      // soon as they leave the picker.
      data-cursor-pointing
      className="flex items-center gap-2 p-2 bg-sb-paper/95 backdrop-blur rounded-2xl shadow-xl shadow-sb-accent-deep/25 border-2 border-sb-ink"
    >
      {TOOLS.map((tool) => {
        const active = toolMode === tool.mode;
        return (
          <motion.button
            key={tool.mode}
            type="button"
            onClick={() => setToolMode(tool.mode)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
            aria-label={tool.label}
            aria-pressed={active}
            data-active={active}
            className={`
              w-14 h-14 md:w-16 md:h-16 rounded-xl grid place-items-center p-2
              focus:outline-none focus:ring-2 focus:ring-sb-accent focus:ring-offset-2 focus:ring-offset-sb-paper
              ${
                active
                  ? "bg-sb-ink shadow-inner"
                  : "bg-sb-card hover:bg-sb-paper-deep"
              }
            `}
          >
            <img
              src={tool.src}
              alt=""
              draggable={false}
              className="w-full h-full object-contain select-none pointer-events-none"
            />
          </motion.button>
        );
      })}
    </div>
  );
}
