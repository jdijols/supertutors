import { describe, expect, it } from "vitest";
import {
  buildElevenLabsRequest,
  ELEVENLABS_MODEL_ID,
  MAX_NAME_LENGTH,
  validateEnv,
  validateName,
} from "./voiceProxyValidation";

describe("validateName", () => {
  it("accepts a normal name and trims surrounding whitespace", () => {
    const result = validateName("  Jason  ");
    expect(result).toEqual({ ok: true, name: "Jason" });
  });

  it("accepts unicode letters and accents", () => {
    expect(validateName("Sofía")).toEqual({ ok: true, name: "Sofía" });
    expect(validateName("Renée")).toEqual({ ok: true, name: "Renée" });
  });

  it("rejects non-string inputs as 400", () => {
    for (const bad of [undefined, null, 42, {}, []]) {
      const r = validateName(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(400);
    }
  });

  it("rejects empty or whitespace-only as 400", () => {
    expect(validateName("").ok).toBe(false);
    expect(validateName("   ").ok).toBe(false);
  });

  it("rejects names longer than MAX_NAME_LENGTH as 400", () => {
    const long = "a".repeat(MAX_NAME_LENGTH + 1);
    const r = validateName(long);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it("accepts names at exactly MAX_NAME_LENGTH", () => {
    const exact = "a".repeat(MAX_NAME_LENGTH);
    const r = validateName(exact);
    expect(r.ok).toBe(true);
  });

  it("rejects control characters as 400", () => {
    const withNul = "Jas" + String.fromCharCode(0) + "on";
    const withEsc = "Jas" + String.fromCharCode(27) + "on";
    expect(validateName(withNul).ok).toBe(false);
    expect(validateName(withEsc).ok).toBe(false);
  });
});

describe("validateEnv", () => {
  it("returns ok when both vars are present", () => {
    const r = validateEnv({ apiKey: "k", voiceId: "v" });
    expect(r).toEqual({ ok: true, apiKey: "k", voiceId: "v" });
  });

  it("returns 503 when apiKey missing", () => {
    const r = validateEnv({ voiceId: "v" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });

  it("returns 503 when voiceId missing", () => {
    const r = validateEnv({ apiKey: "k" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });

  it("treats empty string as missing", () => {
    expect(validateEnv({ apiKey: "", voiceId: "v" }).ok).toBe(false);
    expect(validateEnv({ apiKey: "k", voiceId: "" }).ok).toBe(false);
  });
});

describe("buildElevenLabsRequest", () => {
  it("builds the correct URL with the voice ID", () => {
    const r = buildElevenLabsRequest("Jason", "k", "QzTKubutNn9TjrB7Xb2Q");
    expect(r.url).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/QzTKubutNn9TjrB7Xb2Q",
    );
  });

  it("includes the api key in the xi-api-key header", () => {
    const r = buildElevenLabsRequest("Jason", "k-secret", "voice");
    expect(r.headers["xi-api-key"]).toBe("k-secret");
    expect(r.headers["Content-Type"]).toBe("application/json");
  });

  it("encodes name + model + voice_settings in the body", () => {
    const r = buildElevenLabsRequest("Jason", "k", "v");
    const body = JSON.parse(r.body);
    expect(body.text).toBe("Jason");
    expect(body.model_id).toBe(ELEVENLABS_MODEL_ID);
    expect(body.voice_settings).toEqual({
      stability: 0.55,
      similarity_boost: 0.8,
    });
  });
});
