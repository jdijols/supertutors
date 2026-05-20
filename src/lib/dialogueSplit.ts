/**
 * Splits an authored dialogue line at the {{NAME}} placeholder so the build
 * pipeline can pre-generate static MP3s for the surrounding text and stitch in
 * the runtime-generated name MP3 between them.
 *
 * See PRD §3.11.
 */

export const NAME_PLACEHOLDER = "{{NAME}}";

export interface StaticSegment {
  /** "<key>" or "<key>_a" or "<key>_b" — used as the MP3 filename stem. */
  filenameStem: string;
  /** The exact text to send to ElevenLabs for this segment. */
  text: string;
}

export interface DialogueSplitResult {
  /** Static MP3s to pre-generate. */
  segments: StaticSegment[];
  /** True if the line has a {{NAME}} slot stitched at runtime. */
  hasNameSlot: boolean;
}

export function splitDialogueLine(
  key: string,
  text: string,
): DialogueSplitResult {
  const trimmed = text.trim();
  const idx = trimmed.indexOf(NAME_PLACEHOLDER);

  if (idx === -1) {
    return {
      segments: [{ filenameStem: key, text: trimmed }],
      hasNameSlot: false,
    };
  }

  if (trimmed.indexOf(NAME_PLACEHOLDER, idx + NAME_PLACEHOLDER.length) !== -1) {
    throw new Error(
      `dialogue "${key}" contains more than one ${NAME_PLACEHOLDER} — split into multiple lines`,
    );
  }

  const before = trimmed.slice(0, idx).trim();
  const after = trimmed.slice(idx + NAME_PLACEHOLDER.length).trim();
  const segments: StaticSegment[] = [];

  if (before.length > 0) {
    segments.push({ filenameStem: `${key}_a`, text: before });
  }
  if (after.length > 0) {
    segments.push({ filenameStem: `${key}_b`, text: after });
  }

  return { segments, hasNameSlot: true };
}
