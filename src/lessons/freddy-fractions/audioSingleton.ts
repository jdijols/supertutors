import { AudioEngine } from "@/platform/audio/AudioEngine";
import { getNameAudioUrl } from "@/platform/audio/nameAudioCache";
import { freddyLineLookup } from "./audio-lines";

const FREDDY_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export const audioEngine = new AudioEngine({
  audioBasePath: "/lessons/freddy-fractions/audio",
  lineLookup: freddyLineLookup,
  resolveNameUrl: (name) => getNameAudioUrl(name, { voiceId: FREDDY_VOICE_ID }),
});
