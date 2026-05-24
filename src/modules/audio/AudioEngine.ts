// Phase 2 shim — re-exports platform AudioEngine and provides the Freddy
// singleton pre-configured with the lesson's audio path + dialogue.json.
// Removed in Phase 3 when LessonHost takes over.
export * from "@/platform/audio/AudioEngine";
import { AudioEngine } from "@/platform/audio/AudioEngine";
import { getNameAudioUrl } from "@/platform/audio/nameAudioCache";
import { freddyLineLookup } from "@/lessons/freddy-fractions/audio-lines";

const FREDDY_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export const audioEngine = new AudioEngine({
  audioBasePath: "/lessons/freddy-fractions/audio",
  lineLookup: freddyLineLookup,
  resolveNameUrl: (name) => getNameAudioUrl(name, { voiceId: FREDDY_VOICE_ID }),
});
