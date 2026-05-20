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

const TOOLS: { mode: ToolMode; emoji: string; label: string }[] = [
  { mode: "glove", emoji: "🧤", label: "Glove (move pieces)" },
  { mode: "cutter", emoji: "🍕", label: "Pizza cutter (slice)" },
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
      className="flex items-center gap-2 p-2 bg-sb-card/95 backdrop-blur rounded-2xl shadow-xl shadow-sb-ink/15 border border-sb-border"
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
              w-14 h-14 md:w-16 md:h-16 rounded-xl grid place-items-center text-3xl
              focus:outline-none focus:ring-2 focus:ring-sb-accent focus:ring-offset-2 focus:ring-offset-sb-card
              ${
                active
                  ? "bg-sb-ink text-white shadow-inner"
                  : "bg-sb-surface hover:bg-sb-border"
              }
            `}
          >
            {tool.emoji}
          </motion.button>
        );
      })}
    </div>
  );
}
