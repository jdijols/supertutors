/**
 * ASL Vocabulary Catalog
 *
 * 8 trained hero signs (with phonology + reference video) curated for
 * phonological diversity: varied handshapes, locations, movement types.
 * Cross-referenced with ASL-LEX 2.0 (high frequency, low AoA, InCDI=Yes)
 * and WLASL clip availability for training data.
 *
 * Remaining catalog signs are untrained — they appear in the grid but
 * the classifier cannot recognize them. Practice on untrained signs
 * returns "uncertain" deterministically.
 */

export interface Phonology {
  handshape: string;
  location: string;
  movement: string;
  palmOrientation: string;
}

export interface Sign {
  /** Stable ID matching the `items` table, e.g. "asl:HELLO" */
  id: string;
  /** Display glyph — uppercase English gloss */
  glyph: string;
  /** Whether the ONNX classifier is trained on this sign */
  trained: boolean;
  /** Phonological breakdown — required for trained signs */
  phonology?: Phonology;
  /** Path to reference video, e.g. "/lessons/asl/videos/HELLO.webm" */
  referenceVideo?: string;
}

/** The 8 hero signs — trained, with full phonology + video */
export const TRAINED_SIGNS: Sign[] = [
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

/** Catalog signs — not trained, no phonology, no video */
const CATALOG_SIGNS: Sign[] = [
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
].map((glyph) => ({
  id: `asl:${glyph}`,
  glyph,
  trained: false,
}));

/** Full catalog: trained signs first, then alphabetical catalog */
export const ALL_SIGNS: Sign[] = [
  ...TRAINED_SIGNS,
  ...CATALOG_SIGNS.sort((a, b) => a.glyph.localeCompare(b.glyph)),
];

/** Just the trained subset — used by the practice loop */
export function getTrainedSigns(): Sign[] {
  return TRAINED_SIGNS;
}

/** Look up a sign by ID */
export function getSignById(id: string): Sign | undefined {
  return ALL_SIGNS.find((s) => s.id === id);
}
