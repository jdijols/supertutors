/**
 * ASL Vocabulary Catalog
 *
 * 26 trained letters of the ASL alphabet, with per-letter handshape phonology.
 * The classifier is trained on the Kaggle ASL Alphabet still-image dataset
 * and runs single-frame static handshape recognition (J and Z's motion is
 * approximated from end-pose handshape).
 *
 * The previous 8 word signs (HELLO, THANK YOU, …) live in CATALOG_SIGNS —
 * they're shown but not classifiable until we add face/pose tracking.
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

/**
 * Per-letter handshape phonology. Sourced from the standard ASL Alphabet
 * (Lifeprint / ASL University). Movement is "Static" for every letter
 * except J (small hook trace, pinky finger) and Z (zigzag trace, index finger).
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

/** The 26 trained letters — each entry built from LETTER_PHONOLOGY. */
export const TRAINED_SIGNS: Sign[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .map((letter) => ({
    id: `asl:${letter}`,
    glyph: letter,
    trained: true,
    phonology: LETTER_PHONOLOGY[letter],
  }));

/**
 * Catalog signs — not trained, no phonology, no video. Includes the original
 * 8 word signs (untrained until we add face/pose tracking) plus the existing
 * word catalog.
 */
const CATALOG_WORDS: string[] = [
  // Previously trained word signs — now untrained (model is letter-only)
  "HELLO", "THANK YOU", "YES", "NO", "PLEASE", "SORRY", "HELP", "FRIEND",
  // Existing untrained catalog
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

/** Full catalog: trained letters first (A→Z), then alphabetized words. */
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
