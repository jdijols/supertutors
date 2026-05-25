#!/usr/bin/env node
/**
 * generate-voice — build-time MP3 generation for every lesson's authored dialogue.
 *
 * Walks `src/lessons/*` looking for a `dialogue.json` (either at the lesson
 * root or under `tutor/dialogue.json`). For each one found, splits lines at
 * the {{NAME}} placeholder (so the name slot can be stitched at runtime),
 * calls ElevenLabs for each static segment, and writes MP3s to
 * `public/lessons/<slug>/audio/`.
 *
 * Each lesson gets its own manifest at `public/lessons/<slug>/audio/.manifest.json`:
 *   <stem>.mp3 -> sha256(text)
 * Lines whose text hash matches the manifest AND whose MP3 already exists
 * on disk are skipped, so re-running this script is cheap.
 *
 * Voice resolution per lesson:
 *   1. If the lesson's dialogue.json has `voice.voiceId`, use it.
 *   2. Otherwise fall back to env ELEVENLABS_VOICE_ID.
 *   3. If neither, skip with a warning.
 *
 * Adding a new lesson with audio: drop a `dialogue.json` in its folder.
 * No script changes needed.
 *
 * Env (loaded from .env.local via `node --env-file=.env.local`):
 *   ELEVENLABS_API_KEY  (required)
 *   ELEVENLABS_VOICE_ID (optional default; per-lesson voice in dialogue.json wins)
 *
 * Run:
 *   npm run generate-voice                  # all lessons
 *   npm run generate-voice -- --lesson freddy-fractions   # one lesson
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildElevenLabsRequest } from "../src/lib/voiceProxyValidation.ts";
import {
  splitDialogueLine,
  type StaticSegment,
} from "../src/lib/dialogueSplit.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const lessonsDir = path.join(repoRoot, "src", "lessons");

interface DialogueFile {
  lines: Record<string, string>;
  voice?: { voiceId?: string };
}

type Manifest = Record<string, string>;

interface LessonAudioJob {
  slug: string;
  dialoguePath: string;
  outDir: string;
  manifestPath: string;
}

function hash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function readManifest(manifestPath: string): Promise<Manifest> {
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

async function discoverLessons(filter?: string): Promise<LessonAudioJob[]> {
  const entries = await readdir(lessonsDir, { withFileTypes: true });
  const jobs: LessonAudioJob[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    if (filter && slug !== filter) continue;
    const candidates = [
      path.join(lessonsDir, slug, "tutor", "dialogue.json"),
      path.join(lessonsDir, slug, "dialogue.json"),
    ];
    const dialoguePath = candidates.find((p) => existsSync(p));
    if (!dialoguePath) continue;
    const outDir = path.join(repoRoot, "public", "lessons", slug, "audio");
    jobs.push({
      slug,
      dialoguePath,
      outDir,
      manifestPath: path.join(outDir, ".manifest.json"),
    });
  }
  return jobs;
}

async function processLesson(
  job: LessonAudioJob,
  apiKey: string,
  envVoiceId: string | undefined,
): Promise<{ generated: number; skipped: number; pruned: number }> {
  const raw = await readFile(job.dialoguePath, "utf8");
  const data = JSON.parse(raw) as DialogueFile;

  const voiceId = data.voice?.voiceId ?? envVoiceId;
  if (!voiceId) {
    console.warn(
      `[generate-voice] ${job.slug}: no voiceId (dialogue.voice.voiceId absent ` +
        `and ELEVENLABS_VOICE_ID unset) — skipping.`,
    );
    return { generated: 0, skipped: 0, pruned: 0 };
  }

  await mkdir(job.outDir, { recursive: true });
  const manifest = await readManifest(job.manifestPath);

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
      const filePath = path.join(job.outDir, file);
      const expected = hash(segment.text);
      if (manifest[file] === expected && existsSync(filePath)) {
        skipped++;
        continue;
      }
      console.log(`[generate-voice] ${job.slug}/${file}  <-  "${segment.text}"`);
      const mp3 = await generateOne(segment, apiKey, voiceId);
      await writeFile(filePath, mp3);
      manifest[file] = expected;
      generated++;
      // Write incrementally so a mid-loop failure doesn't re-cost on retry.
      await writeFile(job.manifestPath, JSON.stringify(manifest, null, 2) + "\n");
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
    await writeFile(job.manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  return { generated, skipped, pruned };
}

function parseLessonFilter(): string | undefined {
  const idx = process.argv.indexOf("--lesson");
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error(
      "[generate-voice] ELEVENLABS_API_KEY must be set.\n" +
        "  Try: vercel env pull .env.local\n" +
        "  Then: npm run generate-voice",
    );
    process.exit(1);
  }
  const envVoiceId = process.env.ELEVENLABS_VOICE_ID;

  const filter = parseLessonFilter();
  const jobs = await discoverLessons(filter);

  if (jobs.length === 0) {
    if (filter) {
      console.error(
        `[generate-voice] No dialogue.json found for lesson "${filter}". ` +
          `Looked for src/lessons/${filter}/tutor/dialogue.json or src/lessons/${filter}/dialogue.json.`,
      );
      process.exit(1);
    }
    console.log("[generate-voice] No lessons with dialogue.json found. Nothing to do.");
    return;
  }

  console.log(
    `[generate-voice] Processing ${jobs.length} lesson(s): ${jobs.map((j) => j.slug).join(", ")}`,
  );

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalPruned = 0;
  for (const job of jobs) {
    const { generated, skipped, pruned } = await processLesson(job, apiKey, envVoiceId);
    totalGenerated += generated;
    totalSkipped += skipped;
    totalPruned += pruned;
  }

  console.log(
    `[generate-voice] done — generated ${totalGenerated}, skipped ${totalSkipped}, pruned ${totalPruned}.`,
  );
}

main().catch((err) => {
  console.error("[generate-voice] failed:", err);
  process.exit(1);
});
