#!/usr/bin/env node
/**
 * generate-voice — build-time MP3 generation for all authored dialogue.
 *
 * Reads src/modules/tutor/dialogue.json, splits each line at the {{NAME}}
 * placeholder (so the name slot can be stitched at runtime), calls ElevenLabs
 * for each static segment, and writes MP3s to public/audio/.
 *
 * See PRD §3.11 Audio Architecture, build-time pipeline.
 *
 * Env var required (in a local .env or shell):
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID
 *
 * Run: npm run generate-voice
 *
 * Stub for scaffold — full implementation lands once we have:
 *   - Voice ID chosen in ElevenLabs (matching the Super Mario × Jersey Shore brief)
 *   - Beat 5 dialogue finalized in Stately + dialogue.json
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dialoguePath = path.resolve(
  __dirname,
  "..",
  "src",
  "modules",
  "tutor",
  "dialogue.json",
);

async function main(): Promise<void> {
  const raw = await readFile(dialoguePath, "utf8");
  const data = JSON.parse(raw) as {
    lines: Record<string, string>;
    voice: { voiceId: string };
  };

  console.log(
    `[generate-voice] (stub) would generate MP3s for ${Object.keys(data.lines).length} dialogue lines.`,
  );
  console.log("[generate-voice] (stub) lines:");
  for (const key of Object.keys(data.lines)) {
    const hasNameSlot = data.lines[key].includes("{{NAME}}");
    console.log(`  - ${key}${hasNameSlot ? " (will split at {{NAME}})" : ""}`);
  }
  console.log(
    "[generate-voice] (stub) Implement ElevenLabs API call once voice ID is chosen.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
