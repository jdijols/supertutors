import { motion } from "framer-motion";

/**
 * Freddy character — placeholder render until Midjourney assets land.
 *
 * Props drive the rendered asset. When real PNGs are in `/public/images/
 * characters/freddy/`, render `<img src={...}>`; until then, render an
 * emoji + visible labels so layout is testable.
 *
 * Phase 1 mouth states: closed | open.
 * Phase 2 (stretch) phoneme states will expand the union.
 */
export type FreddyPose = "facing_student" | "facing_guest";
export type FreddyMouth = "closed" | "open";
export type FreddyExpression =
  | "neutral"
  | "excited"
  | "encouraging"
  | "thinking";

export interface FreddyCharacterProps {
  pose?: FreddyPose;
  mouth?: FreddyMouth;
  expression?: FreddyExpression;
  /** True while a speech bubble is playing. Toggles mouth + subtle anim. */
  speaking?: boolean;
}

export function FreddyCharacter({
  pose = "facing_student",
  mouth = "closed",
  expression = "neutral",
  speaking = false,
}: FreddyCharacterProps) {
  // Placeholder render: emoji that hints at the pose, with a visible state
  // tag underneath so we can verify the prop wiring without final art.
  const emoji = pose === "facing_student" ? "👨‍🍳" : "🧑‍🍳";

  return (
    <motion.div
      data-testid="freddy-character"
      data-pose={pose}
      data-mouth={mouth}
      data-expression={expression}
      data-speaking={speaking}
      animate={
        speaking
          ? { y: [0, -2, 0], rotate: [0, 1, -1, 0] }
          : { y: 0, rotate: 0 }
      }
      transition={
        speaking
          ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
      className="flex flex-col items-center select-none"
    >
      <div
        aria-hidden
        className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-mozzarella-100 border-4 border-terracotta-200 grid place-items-center text-7xl md:text-8xl shadow-xl shadow-terracotta-300/40"
      >
        <motion.span
          animate={speaking && mouth === "open" ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {emoji}
        </motion.span>
      </div>
      <div className="mt-2 text-xs font-mono text-terracotta-600 bg-mozzarella-50/80 px-2 py-1 rounded">
        Freddy · {pose} · {mouth}
      </div>
    </motion.div>
  );
}
