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
 * `mouth` toggles between resting (closed) and speaking (open). That mouth
 * swap IS the speaking signal — we deliberately don't bob/shake the body
 * because the static cartoon pose looks janky when wiggled. Phoneme
 * lip-sync (Phase 2) layers in additional mouth shapes; the body stays put.
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
    <div
      data-testid="freddy-character"
      data-pose={pose}
      data-gesture={gesture}
      data-mouth={mouth}
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
