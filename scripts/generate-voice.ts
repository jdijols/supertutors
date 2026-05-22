#!/usr/bin/env node
/**
 * generate-voice — build-time MP3 generation for all authored dialogue.
 *
 * Reads src/modules/tutor/dialogue.json, splits each line at the {{NAME}}
 * placeholder (so the name slot can be stitched at runtime), calls ElevenLabs
 * for each static segment, and writes MP3s to public/audio/.
 *
 * Idempotent: maintains public/audio/.manifest.json mapping
 *   <stem>.mp3 -> sha256(text)
 * Lines whose text hash matches the manifest AND whose MP3 already exists
 * on disk are skipped, so re-running this script is cheap.
 *
 * Env (loaded from .env.local via `node --env-file=.env.local`):
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID
 *
 * Run: npm run generate-voice
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildElevenLabsRequest } from "../src/lib/voiceProxyValidation.ts";
import {
  splitDialogueLine,
  type StaticSegment,
} from "../src/lib/dialogueSplit.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const dialoguePath = path.join(
  repoRoot,
  "src",
  "modules",
  "tutor",
  "dialogue.json",
);
const outDir = path.join(repoRoot, "public", "audio");
const manifestPath = path.join(outDir, ".manifest.json");

interface DialogueFile {
  lines: Record<string, string>;
  voice: { voiceId: string };
}

type Manifest = Record<string, string>;

function hash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function readManifest(): Promise<Manifest> {
  if (!existsSync(manifestPath)) return {};
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as Manifest;
}

async function generateOne(
  segment: StaticSegment,
  apiKey: string,
  voiceId: string,
): Promise<Buffer> {
  const req = buildElevenLabsRequest(segment.text, apiKey, voiceId);
  const res = await fetch(req.url, {
    method: "POST",
    headers: req.headers,
    body: req.body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "<no body>");
    throw new Error(
      `ElevenLabs returned ${res.status} for "${segment.filenameStem}": ${detail}`,
    );
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    console.error(
      "[generate-voice] ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set.\n" +
        "  Try: vercel env pull .env.local\n" +
        "  Then: npm run generate-voice",
    );
    process.exit(1);
  }

  const raw = await readFile(dialoguePath, "utf8");
  const data = JSON.parse(raw) as DialogueFile;
  if (data.voice.voiceId !== voiceId) {
    console.warn(
      `[generate-voice] dialogue.json voice (${data.voice.voiceId}) ` +
        `differs from env (${voiceId}). Env wins.`,
    );
  }

  await mkdir(outDir, { recursive: true });
  const manifest = await readManifest();

  let generated = 0;
  let skipped = 0;
  const liveFiles = new Set<string>();
  for (const [key, text] of Object.entries(data.lines)) {
    const split = splitDialogueLine(key, text);
    for (const segment of split.segments) {
      // Skip the name slot — that MP3 is generated at runtime via /api/voice
      // keyed off the kid's actual name.
      if (segment.kind !== "static") continue;
      const file = `${segment.filenameStem}.mp3`;
      liveFiles.add(file);
      const filePath = path.join(outDir, file);
      const expected = hash(segment.text);
      if (manifest[file] === expected && existsSync(filePath)) {
        skipped++;
        continue;
      }
      console.log(`[generate-voice] ${file}  <-  "${segment.text}"`);
      const mp3 = await generateOne(segment, apiKey, voiceId);
      await writeFile(filePath, mp3);
      manifest[file] = expected;
      generated++;
      // Write incrementally so a mid-loop failure doesn't re-cost on retry.
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    }
  }
  // Prune manifest entries for lines that no longer exist in dialogue.json.
  let pruned = 0;
  for (const file of Object.keys(manifest)) {
    if (!liveFiles.has(file)) {
      delete manifest[file];
      pruned++;
    }
  }
  if (pruned > 0) {
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  console.log(
    `[generate-voice] done — generated ${generated}, skipped ${skipped}, pruned ${pruned}.`,
  );
}

main().catch((err) => {
  console.error("[generate-voice] failed:", err);
  process.exit(1);
});
