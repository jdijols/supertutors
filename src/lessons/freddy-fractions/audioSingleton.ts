import { AudioEngine } from "@/platform/audio/AudioEngine";
import { getNameAudioUrl } from "@/platform/audio/nameAudioCache";
import { freddyLineLookup } from "./audio-lines";

// Freddy's voice — Italian-American chef ("Super Mario meets Jersey Shore").
// Must match the voiceId in tutor/dialogue.json so the dynamic name generation
// matches the pre-recorded MP3s.
const FREDDY_VOICE_ID = "QzTKubutNn9TjrB7Xb2Q";

export const audioEngine = new AudioEngine({
  audioBasePath: "/lessons/freddy-fractions/audio",
  lineLookup: freddyLineLookup,
  resolveNameUrl: (name) => getNameAudioUrl(name, { voiceId: FREDDY_VOICE_ID }),
});
