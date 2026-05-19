/**
 * Voice Proxy — Vercel Edge Function.
 *
 * Accepts a kid's name, proxies to ElevenLabs to generate the name MP3,
 * returns the audio blob. Keeps the ElevenLabs API key server-side.
 *
 * See PRD §3.11 Audio Architecture, runtime pipeline.
 *
 * Env var required (set in Vercel project settings):
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID
 */

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name || name.length > 32) {
    return new Response("Invalid name", { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    // Scaffold mode: env vars not set yet. Return 503 so the client falls back
    // to text-only (see PRD §3.11 failure mode + §4.4 global audio fallback).
    return new Response("Voice service not configured", { status: 503 });
  }

  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: name,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.55, similarity_boost: 0.8 },
      }),
    },
  );

  if (!elevenRes.ok) {
    return new Response("Upstream voice error", { status: 502 });
  }

  return new Response(elevenRes.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
