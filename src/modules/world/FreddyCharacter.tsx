import { motion } from "framer-motion";

/**
 * Freddy character — renders the Midjourney/ChatGPT-generated PNG variant
 * that matches the requested pose + gesture + mouth state.
 *
 * Asset matrix in `/public/images/characters/freddy/`:
 *   facing-student-{ok|neutral|excited|thinking}-{closed|open}.png  (8 files)
 *   facing-guest-pointing-{closed|open}.png                          (2 files)
 *
 * Pose / gesture mapping per beat (used by LessonView / state machine):
 *   - Greeting + warm reactions       → ok
 *   - Idle, calm explaining           → neutral
 *   - AHA + Win celebrations          → excited
 *   - Setup of reveal beats ("hmm")   → thinking
 *   - When facing a guest             → pointing (only valid gesture)
 *
 * `mouth` toggles between resting (closed) and speaking (open). When
 * `speaking={true}` we layer a subtle vertical bob via Framer Motion to
 * sell "alive while talking" without needing full phoneme lip-sync yet.
 */
export type FreddyPose = "facing_student" | "facing_guest";
export type FreddyGesture =
  | "ok"
  | "neutral"
  | "pointing"
  | "excited"
  | "thinking";
export type FreddyMouth = "closed" | "open";

export interface FreddyCharacterProps {
  pose?: FreddyPose;
  gesture?: FreddyGesture;
  mouth?: FreddyMouth;
  /** True while a speech bubble is playing. Adds a subtle idle bob. */
  speaking?: boolean;
  /** Optional className for sizing override. */
  className?: string;
}

function resolveImageSrc(
  pose: FreddyPose,
  gesture: FreddyGesture,
  mouth: FreddyMouth,
): string {
  const direction = pose === "facing_student" ? "facing-student" : "facing-guest";
  // facing-guest only has the `pointing` gesture; coerce silently rather
  // than 404, in case the state machine asks for an invalid combo.
  const safeGesture: FreddyGesture =
    pose === "facing_guest" ? "pointing" : gesture;
  return `/images/characters/freddy/${direction}-${safeGesture}-${mouth}.png`;
}

export function FreddyCharacter({
  pose = "facing_student",
  gesture = "ok",
  mouth = "closed",
  speaking = false,
  className = "w-40 md:w-56 h-auto",
}: FreddyCharacterProps) {
  const src = resolveImageSrc(pose, gesture, mouth);

  return (
    <motion.div
      data-testid="freddy-character"
      data-pose={pose}
      data-gesture={gesture}
      data-mouth={mouth}
      data-speaking={speaking}
      animate={
        speaking ? { y: [0, -3, 0], rotate: [0, 0.5, -0.5, 0] } : { y: 0, rotate: 0 }
      }
      transition={
        speaking
          ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
      className="select-none pointer-events-none"
    >
      <img
        src={src}
        alt="Freddy Fractions"
        draggable={false}
        className={`${className} drop-shadow-2xl`}
      />
    </motion.div>
  );
}
