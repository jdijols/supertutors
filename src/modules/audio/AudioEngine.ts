// Phase 1 shim — re-exports platform AudioEngine and provides the Freddy
// singleton pre-configured with dialogue.json. Removed in Phase 2 when all
// Freddy lesson code moves to src/lessons/freddy-fractions/.
export * from "@/platform/audio/AudioEngine";
import { AudioEngine } from "@/platform/audio/AudioEngine";
import dialogueData from "@/modules/tutor/dialogue.json";

export const audioEngine = new AudioEngine({
  audioBasePath: "/audio",
  lineLookup: (key) => (dialogueData.lines as Record<string, string>)[key],
});
