/**
 * Voice Proxy — Vercel Edge Function.
 *
 * Accepts a kid's name, proxies to ElevenLabs to generate the name MP3,
 * returns the audio blob. Keeps the ElevenLabs API key server-side.
 *
 * See PRD §3.11 Audio Architecture, runtime pipeline.
 *
 * Env vars (set in Vercel project settings):
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID
 *
 * Status codes:
 *   200 audio/mpeg — generated MP3 stream
 *   400            — invalid name (empty, too long, control chars, wrong type)
 *   405            — non-POST method
 *   415            — body is not JSON
 *   502            — ElevenLabs returned non-2xx
 *   503            — env vars not configured
 */

import {
  buildElevenLabsRequest,
  validateEnv,
  validateName,
} from "../src/lib/voiceProxyValidation";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Body must be JSON", { status: 415 });
  }

  const bodyObj =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const nameResult = validateName(bodyObj.name);
  if (!nameResult.ok) {
    return new Response(nameResult.reason, { status: nameResult.status });
  }

  const envResult = validateEnv({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    bodyVoiceId: typeof bodyObj.voiceId === "string" ? bodyObj.voiceId : undefined,
  });
  if (!envResult.ok) {
    return new Response(envResult.reason, { status: envResult.status });
  }

  const elevenReq = buildElevenLabsRequest(
    nameResult.name,
    envResult.apiKey,
    envResult.voiceId,
  );

  const elevenRes = await fetch(elevenReq.url, {
    method: "POST",
    headers: elevenReq.headers,
    body: elevenReq.body,
  });

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
