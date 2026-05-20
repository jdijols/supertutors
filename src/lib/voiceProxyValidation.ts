/**
 * Validation for the /api/voice ElevenLabs proxy.
 *
 * Lives under src/lib/ instead of api/ so vitest (which only scans src/) can
 * cover the rules. The api/voice.ts handler imports from here.
 */

export const MAX_NAME_LENGTH = 32;

export type NameValidationResult =
  | { ok: true; name: string }
  | { ok: false; status: 400; reason: string };

const CONTROL_CHAR_RE = new RegExp(
  "[" + String.fromCharCode(0) + "-" + String.fromCharCode(31) +
  String.fromCharCode(127) + "]",
);

export function validateName(raw: unknown): NameValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, status: 400, reason: "name must be a string" };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, status: 400, reason: "name is required" };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      status: 400,
      reason: `name must be <= ${MAX_NAME_LENGTH} characters`,
    };
  }
  if (CONTROL_CHAR_RE.test(trimmed)) {
    return {
      ok: false,
      status: 400,
      reason: "name contains control characters",
    };
  }
  return { ok: true, name: trimmed };
}

export interface VoiceProxyEnv {
  apiKey?: string;
  voiceId?: string;
}

export type EnvValidationResult =
  | { ok: true; apiKey: string; voiceId: string }
  | { ok: false; status: 503; reason: string };

export function validateEnv(env: VoiceProxyEnv): EnvValidationResult {
  if (!env.apiKey || !env.voiceId) {
    return {
      ok: false,
      status: 503,
      reason: "ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not set",
    };
  }
  return { ok: true, apiKey: env.apiKey, voiceId: env.voiceId };
}

export const ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";

export interface ElevenLabsRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function buildElevenLabsRequest(
  name: string,
  apiKey: string,
  voiceId: string,
): ElevenLabsRequest {
  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: name,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: { stability: 0.55, similarity_boost: 0.8 },
    }),
  };
}
