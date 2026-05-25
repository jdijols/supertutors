/**
 * Freddy character — renders the Midjourney/ChatGPT-generated PNG variant
 * that matches the requested pose + gesture + mouth state.
 *
 * Asset matrix in `/public/lessons/freddy-fractions/images/characters/freddy/`:
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
 * ### Mouth behavior
 *
 * Closed is the resting default. While `speaking=true` (a line is
 * playing), the mouth holds open — one frame for the entire utterance,
 * no intra-line flapping (the rapid swap was distracting on review).
 * The brief mouth-close beat between lines comes from `speaking`
 * flipping false → true naturally as one dialogue key ends and the next
 * begins.
 *
 * The `mouth` prop acts as the static fallback for non-speaking poses
 * (e.g., a frozen "agape" reaction); it's overridden to "open" while
 * speaking.
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
  /**
   * Pose modifier when facing the student. Ignored when facing a guest
   * (coerced to `pointing`, the only valid combo for that direction).
   */
  gesture?: FreddyGesture;
  /**
   * Static fallback mouth state. Used when `speaking=false`. Overridden
   * to "open" while speaking.
   */
  mouth?: FreddyMouth;
  /**
   * True while audio for a line is playing. Forces mouth to "open".
   * Flip true on `audioEngine.play`, flip false on `onDone` — that
   * boundary produces the natural close-between-lines beat.
   */
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
  return `/lessons/freddy-fractions/images/characters/freddy/${direction}-${safeGesture}-${mouth}.png`;
}

export function FreddyCharacter({
  pose = "facing_student",
  gesture = "ok",
  mouth = "closed",
  speaking = false,
  className = "w-40 md:w-56 h-auto",
}: FreddyCharacterProps) {
  // Open while a line plays, otherwise the `mouth` prop fallback (which
  // defaults to "closed"). One frame per utterance — no intra-line flap.
  const effectiveMouth: FreddyMouth = speaking ? "open" : mouth;
  const src = resolveImageSrc(pose, gesture, effectiveMouth);

  return (
    <div
      data-testid="freddy-character"
      data-pose={pose}
      data-gesture={gesture}
      data-mouth={effectiveMouth}
      data-speaking={speaking}
      className="select-none pointer-events-none"
    >
      <img
        src={src}
        alt="Freddy Fractions"
        draggable={false}
        className={`${className} drop-shadow-2xl`}
      />
    </div>
  );
}
