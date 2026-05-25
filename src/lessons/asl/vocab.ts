/**
 * ASL Vocabulary Catalog
 *
 * Active trained set: 26 alphabet letters (A–Z) plus 8 word signs. The
 * classifier is trained on the Kaggle ASL Alphabet still-image dataset
 * and reliably recognizes letters. The 8 word signs (HELLO, THANK YOU, …)
 * remain in TRAINED_SIGNS so they appear in the practice loop, but the
 * model does not output those classes — practicing them will currently
 * register "uncertain" until we add face/pose tracking (Holistic).
 *
 * Practice order: letters A–Z first, then word signs. Total 34 items.
 */

export interface Phonology {
  handshape: string;
  location: string;
  movement: string;
  palmOrientation: string;
}

export interface Sign {
  /** Stable ID matching the `items` table, e.g. "asl:A" */
  id: string;
  /** Display glyph — uppercase letter or English gloss */
  glyph: string;
  /** Whether the ONNX classifier is trained on this sign */
  trained: boolean;
  /** Phonological breakdown — required for trained signs */
  phonology?: Phonology;
  /** Path to reference video, e.g. "/lessons/asl/videos/HELLO.webm" */
  referenceVideo?: string;
}

// ─── Alphabet (A–Z) ─────────────────────────────────────────────────────────

/**
 * Per-letter handshape phonology. Sourced from the standard ASL Alphabet
 * (Lifeprint / ASL University). Movement is "Static" for every letter
 * except J (pinky-down hook trace) and Z (index zigzag trace).
 */
const LETTER_PHONOLOGY: Record<string, Phonology> = {
  A: { handshape: "A — closed fist, thumb resting along the side",          location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  B: { handshape: "B — flat hand, fingers together, thumb folded across palm", location: "Neutral space", movement: "Static",                  palmOrientation: "Facing away" },
  C: { handshape: "C — fingers curved into a C-shape",                       location: "Neutral space", movement: "Static",                     palmOrientation: "Facing side" },
  D: { handshape: "D — index up, other fingers touching thumb in an O",      location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  E: { handshape: "E — fingers curled in, thumb tucked under",               location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  F: { handshape: "F — thumb and index touching in a circle, other 3 up",    location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  G: { handshape: "G — index and thumb extended sideways, parallel",         location: "Neutral space", movement: "Static",                     palmOrientation: "Facing in" },
  H: { handshape: "H — index and middle extended sideways, together",        location: "Neutral space", movement: "Static",                     palmOrientation: "Facing in" },
  I: { handshape: "I — pinky up, other fingers closed in a fist",            location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  J: { handshape: "J — pinky up like I, then traces a hook downward",        location: "Neutral space", movement: "Hook trace (pinky down + curve)", palmOrientation: "Facing away → side" },
  K: { handshape: "K — index up, middle out at angle, thumb between them",   location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  L: { handshape: "L — index up, thumb out, forming an L",                   location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  M: { handshape: "M — thumb tucked under three fingers (index, middle, ring)", location: "Neutral space", movement: "Static",                  palmOrientation: "Facing away" },
  N: { handshape: "N — thumb tucked under two fingers (index, middle)",      location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  O: { handshape: "O — all fingertips touching thumb in an O-shape",         location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  P: { handshape: "P — like K but tilted down",                              location: "Neutral space", movement: "Static",                     palmOrientation: "Facing down" },
  Q: { handshape: "Q — like G but tilted down",                              location: "Neutral space", movement: "Static",                     palmOrientation: "Facing down" },
  R: { handshape: "R — index and middle crossed",                            location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  S: { handshape: "S — closed fist, thumb across front of fingers",          location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  T: { handshape: "T — closed fist, thumb between index and middle",         location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  U: { handshape: "U — index and middle up together, others closed",         location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  V: { handshape: "V — index and middle up in a V, others closed",           location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  W: { handshape: "W — index, middle, ring up in a W, others closed",        location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  X: { handshape: "X — index hooked, others closed",                         location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  Y: { handshape: "Y — thumb and pinky out, others closed",                  location: "Neutral space", movement: "Static",                     palmOrientation: "Facing away" },
  Z: { handshape: "Z — index up, then traces a Z-shape",                     location: "Neutral space", movement: "Z trace (3 strokes)",        palmOrientation: "Facing away" },
};

/** Letters A–Z. All trained (classifier recognizes them). */
const LETTER_SIGNS: Sign[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .map((letter) => ({
    id: `asl:${letter}`,
    glyph: letter,
    trained: true,
    phonology: LETTER_PHONOLOGY[letter],
  }));

// ─── Word signs (legacy — kept in TRAINED_SIGNS for UI continuity) ──────────

/**
 * The original 8 word signs. The current classifier does not output these
 * classes — they remain trained-flagged so they appear in the practice
 * sequence, but every attempt will register "uncertain" until we add
 * face/pose tracking. Reference videos are kept so "Show me the sign" works.
 */
const WORD_SIGNS: Sign[] = [
  {
    id: "asl:HELLO",
    glyph: "HELLO",
    trained: true,
    phonology: {
      handshape: "B (flat hand)",
      location: "Forehead",
      movement: "Away from body",
      palmOrientation: "Facing in",
    },
    referenceVideo: "/lessons/asl/videos/HELLO.webm",
  },
  {
    id: "asl:THANK-YOU",
    glyph: "THANK YOU",
    trained: true,
    phonology: {
      handshape: "B (flat hand)",
      location: "Chin",
      movement: "Away from body",
      palmOrientation: "Facing in",
    },
    referenceVideo: "/lessons/asl/videos/THANK-YOU.webm",
  },
  {
    id: "asl:YES",
    glyph: "YES",
    trained: true,
    phonology: {
      handshape: "S (fist)",
      location: "Neutral space",
      movement: "Nodding motion",
      palmOrientation: "Facing away",
    },
    referenceVideo: "/lessons/asl/videos/YES.webm",
  },
  {
    id: "asl:NO",
    glyph: "NO",
    trained: true,
    phonology: {
      handshape: "U + thumb (snap)",
      location: "Neutral space",
      movement: "Close / snap shut",
      palmOrientation: "Facing away",
    },
    referenceVideo: "/lessons/asl/videos/NO.webm",
  },
  {
    id: "asl:PLEASE",
    glyph: "PLEASE",
    trained: true,
    phonology: {
      handshape: "B (flat hand)",
      location: "Chest",
      movement: "Circular",
      palmOrientation: "Facing in",
    },
    referenceVideo: "/lessons/asl/videos/PLEASE.webm",
  },
  {
    id: "asl:SORRY",
    glyph: "SORRY",
    trained: true,
    phonology: {
      handshape: "A (fist, thumb side)",
      location: "Chest",
      movement: "Circular",
      palmOrientation: "Facing in",
    },
    referenceVideo: "/lessons/asl/videos/SORRY.webm",
  },
  {
    id: "asl:HELP",
    glyph: "HELP",
    trained: true,
    phonology: {
      handshape: "A on B (thumbs-up on flat palm)",
      location: "Palm of other hand",
      movement: "Upward lift",
      palmOrientation: "Up",
    },
    referenceVideo: "/lessons/asl/videos/HELP.webm",
  },
  {
    id: "asl:FRIEND",
    glyph: "FRIEND",
    trained: true,
    phonology: {
      handshape: "X (hooked index)",
      location: "Neutral space",
      movement: "Hook-link / toggle",
      palmOrientation: "Varied",
    },
    referenceVideo: "/lessons/asl/videos/FRIEND.webm",
  },
];

// ─── Public exports ─────────────────────────────────────────────────────────

/**
 * 34 trained signs: 26 letters A–Z (recognized by the current model),
 * followed by 8 word signs (kept in the sequence — will register as
 * "uncertain" until face/pose tracking lands).
 */
export const TRAINED_SIGNS: Sign[] = [...LETTER_SIGNS, ...WORD_SIGNS];

/** Catalog signs — not trained, no phonology, no video. */
const CATALOG_WORDS: string[] = [
  "MOTHER", "FATHER", "BABY", "BROTHER", "SISTER", "FAMILY",
  "LOVE", "HAPPY", "SAD", "ANGRY", "SCARED", "HUNGRY", "THIRSTY",
  "TIRED", "SICK", "GOOD", "BAD", "BIG", "SMALL", "MORE",
  "WANT", "NEED", "LIKE", "EAT", "DRINK", "SLEEP", "PLAY",
  "STOP", "GO", "COME", "SIT", "STAND", "WALK", "RUN",
  "SCHOOL", "TEACHER", "BOOK", "WRITE", "READ", "LEARN",
  "HOME", "WATER", "FOOD", "MILK", "COOKIE", "APPLE", "BANANA",
  "CAT", "DOG", "BIRD", "FISH", "BEAR",
  "RED", "BLUE", "GREEN", "YELLOW", "BLACK", "WHITE",
  "ONE", "TWO", "THREE", "FOUR", "FIVE",
  "MORNING", "NIGHT", "TODAY", "TOMORROW",
  "WHAT", "WHERE", "WHO", "WHY", "HOW",
  "ME", "YOU", "NAME", "AGE",
  "BATHROOM", "OUTSIDE", "INSIDE",
];

const CATALOG_SIGNS: Sign[] = CATALOG_WORDS.map((glyph) => ({
  id: `asl:${glyph.replace(/\s+/g, "-")}`,
  glyph,
  trained: false,
}));

/** Full catalog: trained signs first (letters then words), then alphabetized catalog. */
export const ALL_SIGNS: Sign[] = [
  ...TRAINED_SIGNS,
  ...CATALOG_SIGNS.slice().sort((a, b) => a.glyph.localeCompare(b.glyph)),
];

/** Just the trained subset — used by the practice loop */
export function getTrainedSigns(): Sign[] {
  return TRAINED_SIGNS;
}

/** Look up a sign by ID */
export function getSignById(id: string): Sign | undefined {
  return ALL_SIGNS.find((s) => s.id === id);
}
