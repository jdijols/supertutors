/**
 * Splits an authored dialogue line into the audio segments needed to play
 * it back. Two axes of splitting:
 *
 *   1. The {{NAME}} placeholder, so the runtime can stitch in the kid's
 *      name MP3 between flanking static MP3s.
 *   2. Sentence boundaries within each static chunk (`.`, `!`, `?`
 *      followed by whitespace or end-of-string). One MP3 per sentence
 *      gives the AudioEngine an organic mouth-close beat at every period
 *      without any per-sentence dialogue.json bookkeeping. Authors keep
 *      writing single lines; the audio pipeline handles the rest.
 *
 * Naming convention for the static segments:
 *   - Single static segment, no name → `<key>.mp3`
 *   - Multiple static segments (with or without a name slot) → numbered
 *     `<key>_s0.mp3`, `<key>_s1.mp3`, … in the order they appear in the
 *     line. Name segments aren't given a stem (resolved at runtime).
 *
 * See PRD §3.11.
 */

export const NAME_PLACEHOLDER = "{{NAME}}";

/** A pre-generated MP3 chunk of static text from the line. */
export interface StaticSegment {
  kind: "static";
  /** "<key>" or "<key>_s<n>" — used as the MP3 filename stem. */
  filenameStem: string;
  /** The exact text to send to ElevenLabs for this segment. */
  text: string;
}

/** A runtime placeholder for the kid's name MP3 (resolved at play time). */
export interface NameSegment {
  kind: "name";
}

export type Segment = StaticSegment | NameSegment;

export interface DialogueSplitResult {
  /** All segments in playback order — static MP3s interleaved with the
   *  name slot (if any). */
  segments: Segment[];
  /** True if the line has a {{NAME}} slot stitched at runtime. */
  hasNameSlot: boolean;
}

/**
 * Sentence splitter — chunks text on `.`, `!`, `?` followed by whitespace
 * or end-of-string. Preserves the terminator with each sentence so the
 * generated MP3 includes the natural prosody (a period sounds like a
 * period). Trims surrounding whitespace per chunk.
 *
 * Edge cases:
 *   - Ellipses ("…" or "...") count as a single sentence terminator.
 *   - Decimal points like "1.5" are NOT split (no whitespace follows).
 *   - Em-dash mid-sentence is NOT a boundary (the regex requires
 *     `.!?` not `—`).
 */
function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];
  // Match a run of non-terminator characters followed by 1+ terminators.
  const matches = trimmed.match(/[^.!?]+[.!?]+/g);
  if (!matches) return [trimmed];
  const out = matches.map((s) => s.trim()).filter((s) => s.length > 0);
  // Catch trailing fragment without terminator (rare — defensive).
  const consumed = out.join(" ").length;
  if (consumed < trimmed.length) {
    const tail = trimmed.slice(matches.join("").length).trim();
    if (tail.length > 0) out.push(tail);
  }
  return out;
}

export function splitDialogueLine(
  key: string,
  text: string,
): DialogueSplitResult {
  const trimmed = text.trim();
  const idx = trimmed.indexOf(NAME_PLACEHOLDER);

  if (
    idx !== -1 &&
    trimmed.indexOf(NAME_PLACEHOLDER, idx + NAME_PLACEHOLDER.length) !== -1
  ) {
    throw new Error(
      `dialogue "${key}" contains more than one ${NAME_PLACEHOLDER} — split into multiple lines`,
    );
  }

  // Build an ordered list of (text chunk | name marker) pieces, then
  // expand each text chunk into sentence-level static segments.
  const pieces: ({ kind: "text"; text: string } | { kind: "name" })[] = [];
  if (idx === -1) {
    pieces.push({ kind: "text", text: trimmed });
  } else {
    const before = trimmed.slice(0, idx).trim();
    const after = trimmed.slice(idx + NAME_PLACEHOLDER.length).trim();
    if (before.length > 0) pieces.push({ kind: "text", text: before });
    pieces.push({ kind: "name" });
    if (after.length > 0) pieces.push({ kind: "text", text: after });
  }

  // Total static-segment count tells us whether to use the single-file
  // `<key>.mp3` naming or numbered `<key>_s0.mp3` etc.
  const totalStaticSegments = pieces.reduce((n, p) => {
    if (p.kind !== "text") return n;
    return n + splitSentences(p.text).length;
  }, 0);
  const useUnnumberedName = totalStaticSegments === 1;

  const segments: Segment[] = [];
  let staticIdx = 0;
  for (const piece of pieces) {
    if (piece.kind === "name") {
      segments.push({ kind: "name" });
      continue;
    }
    const sentences = splitSentences(piece.text);
    for (const sentence of sentences) {
      const filenameStem = useUnnumberedName ? key : `${key}_s${staticIdx}`;
      segments.push({ kind: "static", filenameStem, text: sentence });
      staticIdx++;
    }
  }

  return {
    segments,
    hasNameSlot: idx !== -1,
  };
}
