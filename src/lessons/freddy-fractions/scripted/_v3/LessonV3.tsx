import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  buildWholePiece,
  GuestBox,
  PizzaPiece,
  useSandboxPieces,
  type GuestBoxHandle,
  type SandboxPiece,
} from "../../scenes/table";
import { derivePerGuestTableState } from "../tableState";
import { SpeechBubble } from "../../scenes/world";
import type { CvCameraHandle } from "@/platform/lesson-sdk";

/**
 * LessonV3 — minimum Scene 1 demo (V3 Synthesis-port).
 *
 * Beats 1–3 only (a slice of the full 36-beat arc — see LESSON-V3.md):
 *   1. "These two boxes are for Maya and Theo. See if you can divide
 *       these pizzas evenly between them."
 *   2. Kid drags 4 whole pizzas into the two GuestBoxes (2 each).
 *   3. "Excellent! 4 pizzas ÷ 2 people = 2 each." + Play again.
 *
 * Scope deferred (will be added in subsequent commits):
 *   - Audio (ElevenLabs lines) — text-only speech bubbles for now
 *   - Beats 4+ (slicing, halves, quarters, MC, fraction input)
 *   - Scene transitions
 *   - The `maxFraction='1/4'` cap kicks in only when slicing happens;
 *     Scene 1 uses `maxFraction='1'` so the cutter is fully disabled
 *     (kid can't accidentally cut a whole)
 *   - CV mode (camera/hand-tracking) — deferred until basic flow works
 *
 * This file lives in `scripted/_v3/` to keep V3 work clearly separate
 * from v2's `LessonScripted.tsx`. See PRD-V3.md for the full plan.
 */

export interface LessonV3Props {
  name: string;
  cv?: CvCameraHandle;
}

// Four whole pizzas on the left half of the workspace, ready to drag.
const INITIAL_PIZZA_POSITIONS = [
  { x: 80, y: 200 },
  { x: 80, y: 480 },
  { x: 340, y: 200 },
  { x: 340, y: 480 },
];

// Two guests on the right, named per the canonical roster (Maya + Theo).
const GUESTS = [
  { id: "maya", label: "Maya", x: 900, y: 160 },
  { id: "theo", label: "Theo", x: 900, y: 460 },
] as const;

const PIZZA_SIZE = 180;

export function LessonV3({ name, cv: _cv }: LessonV3Props) {
  void _cv; // CV mode integration follows v2 pattern; deferred for Scene-1 MVP.

  const initialPieces = useMemo<SandboxPiece[]>(
    () =>
      INITIAL_PIZZA_POSITIONS.map((pos, i) =>
        buildWholePiece({
          id: `pizza-${i + 1}`,
          x: pos.x,
          y: pos.y,
          baseSize: PIZZA_SIZE,
        }),
      ),
    [],
  );

  const { pieces, move, setGuestId, reset } = useSandboxPieces(initialPieces, {
    // Scene 1 lockdown: no slicing at all. Kid can only drag whole pizzas.
    // Per the lesson-mode lockdown principle from the V3 PRD: heavily
    // constrain student actions so the workspace can't drift into a state
    // the lesson can't recover from.
    maxFraction: "1",
  });

  const mayaRef = useRef<GuestBoxHandle>(null);
  const theoRef = useRef<GuestBoxHandle>(null);

  const perGuest = useMemo(() => derivePerGuestTableState(pieces), [pieces]);

  const beat1Complete =
    perGuest.byGuest.maya?.counts.whole === 2 &&
    perGuest.byGuest.theo?.counts.whole === 2 &&
    perGuest.free.counts.whole === 0;

  const [excellentShown, setExcellentShown] = useState(false);

  useEffect(() => {
    if (beat1Complete) setExcellentShown(true);
  }, [beat1Complete]);

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const piece = pieces.find((p) => p.id === id);
      if (!piece) return;

      const pieceRect = {
        left: x,
        top: y,
        right: x + piece.width,
        bottom: y + piece.height,
      };

      // Drop detection: check each GuestBox, fall back to "free on table".
      if (mayaRef.current?.overlaps(pieceRect)) {
        setGuestId(id, "maya");
      } else if (theoRef.current?.overlaps(pieceRect)) {
        setGuestId(id, "theo");
      } else {
        // Free table — clear ownership + update position
        setGuestId(id, undefined);
        move(id, x, y);
      }
    },
    [pieces, move, setGuestId],
  );

  const handlePlayAgain = useCallback(() => {
    reset();
    setExcellentShown(false);
  }, [reset]);

  // Free pieces render on the table; assigned pieces render inside their
  // GuestBox via the box's own `pieces` prop.
  const freePieces = pieces.filter((p) => p.guestId === undefined);

  return (
    <div className="absolute inset-0" data-testid="lesson-v3">
      {/* Free pizzas — draggable on the table */}
      {freePieces.map((piece) => (
        <PizzaPiece
          key={piece.id}
          id={piece.id}
          src={piece.src}
          fraction={piece.fraction}
          initialX={piece.x}
          initialY={piece.y}
          width={piece.width}
          height={piece.height}
          onDragEnd={handleDragEnd}
        />
      ))}

      {/* Guest boxes — recipients */}
      {GUESTS.map((guest) => {
        const guestPieces = pieces.filter((p) => p.guestId === guest.id);
        const ref = guest.id === "maya" ? mayaRef : theoRef;
        return (
          <GuestBox
            key={guest.id}
            ref={ref}
            guestId={guest.id}
            label={guest.label}
            x={guest.x}
            y={guest.y}
            pieces={guestPieces}
          />
        );
      })}

      {/* Freddy's intro — text bubble for now; audio comes in a later commit */}
      {!excellentShown && (
        <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
          <SpeechBubble open speaker="Freddy" tailSide="bottom-left">
            <p className="font-sans text-base text-sb-ink">
              These two boxes are for <strong>Maya</strong> and{" "}
              <strong>Theo</strong>, {name}. See if you can divide these
              pizzas evenly between them.
            </p>
          </SpeechBubble>
        </div>
      )}

      {/* "Excellent" completion overlay — appears once both boxes have 2 wholes */}
      {excellentShown && (
        <div className="absolute inset-x-0 top-1/3 grid place-items-center z-40 pointer-events-none">
          <motion.div
            data-testid="lesson-v3-complete"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 24,
            }}
            className="pointer-events-auto bg-sb-paper border-2 border-sb-ink rounded-3xl px-8 py-6 shadow-2xl shadow-sb-accent-deep/30 text-center max-w-md"
          >
            <div className="text-2xl sm:text-3xl font-bold text-sb-ink mb-2">
              Excellent!
            </div>
            <div className="text-base text-sb-ink/70 mb-5 font-mono">
              4 pizzas ÷ 2 people = 2 each
            </div>
            <motion.button
              type="button"
              data-testid="lesson-v3-play-again"
              onClick={handlePlayAgain}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 600, damping: 22 }}
              className="px-6 py-3 rounded-full bg-sb-ink text-sb-paper text-lg font-semibold shadow-xl shadow-sb-accent-deep/25 border-2 border-sb-paper hover:bg-sb-ink/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface cursor-pointer"
            >
              Play again →
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
