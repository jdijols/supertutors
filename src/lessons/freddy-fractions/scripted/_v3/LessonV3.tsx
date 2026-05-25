import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  buildWholePiece,
  GuestBox,
  PizzaPiece,
  useSandboxPieces,
  type GuestBoxHandle,
  type PizzaFraction,
  type SandboxPiece,
} from "../../scenes/table";
import { derivePerGuestTableState } from "../tableState";
import { SpeechBubble } from "../../scenes/world";
import { MCQ, type MCQOption } from "./MCQ";
import type { CvCameraHandle } from "@/platform/lesson-sdk";

/**
 * LessonV3 — V3 Synthesis-port lesson host.
 *
 * Currently covers Scene 1 (clean division, 4 ÷ 2) and Scene 2
 * (remainder + slicing → halves, 5 ÷ 2 = 2½). Beats 14–36 (notation,
 * 4-friend scenes, quarters) land in subsequent commits.
 *
 * Architecture: data-driven stage machine. Each beat is a stage with
 * a config describing speech text, slice cap, advance predicate, MCQ,
 * etc. The machine itself is a single `currentStage` state + a few
 * effects that fire on stage changes:
 *
 *   - autoAdvance: setTimeout-based for narration beats
 *   - waitForDrag: per-guest composition predicate for distribution beats
 *   - waitForSlice: per-guest composition predicate for slice beats
 *   - onEnter: one-shot side effect (scene reset)
 *   - mc: MCQ component is rendered; onAnswer advances, onWrong sets hint
 *
 * Lesson-mode lockdown is enforced via `maxFraction` per stage — the
 * useSandboxPieces hook refuses slices that would produce children
 * smaller than the cap, so the workspace can't drift into a state the
 * lesson can't recover from. See docs/adr/0001 for the principle.
 *
 * No audio yet — text bubbles only. Audio integration is a follow-up.
 */

// ─── Stage machine ──────────────────────────────────────────────────────────

type V3Stage =
  // Scene 1 — clean division (4 ÷ 2)
  | "beat_1_distribute_4"
  | "beat_2_excellent"
  | "beat_3_math_statement"
  // Scene 1 → 2 transition
  | "scene_2_intro"
  // Scene 2 — remainder + slicing → halves
  | "beat_4_distribute_5"
  | "beat_5_leftover"
  | "beat_6_mc_cut_or_dog"
  | "beat_7_knife"
  | "beat_8_slice_leftover"
  | "beat_9_perfect"
  | "beat_10_distribute_halves"
  | "beat_11_thats_it"
  | "beat_12_mc_count"
  | "beat_13_right"
  // End of currently-built content
  | "complete";

type PerGuestState = ReturnType<typeof derivePerGuestTableState>;

interface MCConfig {
  options: MCQOption[];
  correctValue?: string;
  mode: "any-advances" | "re-prompt-until-correct";
  hintOnWrong?: string;
}

interface V3StageConfig {
  /** Text bubble content (replaces audio for now). */
  speech?: (name: string) => string;
  /** Lesson-mode slice cap during this stage. "1" = no slicing. */
  maxFraction: PizzaFraction;
  /** Auto-advance after N ms. Used for narration beats. */
  autoAdvance?: number;
  /** Show continue button so kid can advance manually. */
  showContinue?: boolean;
  /** Wait for drag distribution to satisfy this predicate, then advance. */
  waitForDrag?: (perGuest: PerGuestState) => boolean;
  /** Wait for a slice to bring the world to this state, then advance. */
  waitForSlice?: (perGuest: PerGuestState) => boolean;
  /** Render an MCQ inside the speech bubble. */
  mc?: MCConfig;
  /** One-shot side effect when entering this stage (e.g., scene reset). */
  onEnter?: "scene2-reset";
  /** What stage to transition to on completion. */
  next: V3Stage;
}

const STAGES: Record<V3Stage, V3StageConfig> = {
  beat_1_distribute_4: {
    speech: (name) =>
      `These two boxes are for Maya and Theo, ${name}. See if you can divide these pizzas evenly between them.`,
    maxFraction: "1",
    waitForDrag: (g) =>
      g.byGuest.maya?.counts.whole === 2 &&
      g.byGuest.theo?.counts.whole === 2 &&
      g.free.counts.whole === 0,
    next: "beat_2_excellent",
  },
  beat_2_excellent: {
    speech: () => "Excellent.",
    maxFraction: "1",
    autoAdvance: 1500,
    next: "beat_3_math_statement",
  },
  beat_3_math_statement: {
    speech: () => "4 pizzas ÷ 2 people = 2 each.",
    maxFraction: "1",
    showContinue: true,
    next: "scene_2_intro",
  },
  scene_2_intro: {
    maxFraction: "1",
    autoAdvance: 400,
    onEnter: "scene2-reset",
    next: "beat_4_distribute_5",
  },
  beat_4_distribute_5: {
    speech: () =>
      "But how about 5 pizzas ÷ 2 people? Try giving each person the same amount.",
    maxFraction: "1",
    waitForDrag: (g) =>
      g.byGuest.maya?.counts.whole === 2 &&
      g.byGuest.theo?.counts.whole === 2 &&
      g.free.counts.whole === 1,
    next: "beat_5_leftover",
  },
  beat_5_leftover: {
    speech: () => "Nice. But there's one left-over.",
    maxFraction: "1",
    autoAdvance: 2200,
    next: "beat_6_mc_cut_or_dog",
  },
  beat_6_mc_cut_or_dog: {
    speech: () => "What should we do with the extra pizza?",
    maxFraction: "1",
    mc: {
      options: [
        { value: "cut", label: "Cut it in half" },
        { value: "dog", label: "Give it to the dog" },
      ],
      mode: "any-advances",
    },
    next: "beat_7_knife",
  },
  beat_7_knife: {
    speech: () => "Great idea, let me get a knife.",
    maxFraction: "1",
    autoAdvance: 1800,
    next: "beat_8_slice_leftover",
  },
  beat_8_slice_leftover: {
    speech: () => "Tap the leftover pizza to slice it in half.",
    maxFraction: "1/2",
    waitForSlice: (g) =>
      g.free.counts.halves === 2 && g.free.counts.whole === 0,
    next: "beat_9_perfect",
  },
  beat_9_perfect: {
    speech: () => "Perfect.",
    maxFraction: "1/2",
    autoAdvance: 1500,
    next: "beat_10_distribute_halves",
  },
  beat_10_distribute_halves: {
    speech: () => "Now give each person one of those halves.",
    maxFraction: "1/2",
    waitForDrag: (g) =>
      g.byGuest.maya?.counts.whole === 2 &&
      g.byGuest.maya?.counts.halves === 1 &&
      g.byGuest.theo?.counts.whole === 2 &&
      g.byGuest.theo?.counts.halves === 1 &&
      g.free.counts.whole === 0 &&
      g.free.counts.halves === 0,
    next: "beat_11_thats_it",
  },
  beat_11_thats_it: {
    speech: () => "That's it.",
    maxFraction: "1/2",
    autoAdvance: 1500,
    next: "beat_12_mc_count",
  },
  beat_12_mc_count: {
    speech: () => "How many pizzas would you say each person got?",
    maxFraction: "1/2",
    mc: {
      options: [
        { value: "two", label: "Two" },
        { value: "two-half", label: "Two and a half" },
        { value: "three", label: "Three" },
      ],
      correctValue: "two-half",
      mode: "re-prompt-until-correct",
      hintOnWrong: "Count again — each person got 2 wholes plus 1 half!",
    },
    next: "beat_13_right",
  },
  beat_13_right: {
    speech: () => "Right. Two and a half pizzas.",
    maxFraction: "1/2",
    autoAdvance: 2500,
    next: "complete",
  },
  complete: {
    maxFraction: "1/2",
    next: "beat_1_distribute_4",
  },
};

// ─── Layout ─────────────────────────────────────────────────────────────────

const PIZZA_SIZE = 170;

const SCENE_1_POSITIONS = [
  { x: 80, y: 200 },
  { x: 80, y: 480 },
  { x: 340, y: 200 },
  { x: 340, y: 480 },
];

const SCENE_2_POSITIONS = [
  { x: 80, y: 160 },
  { x: 80, y: 440 },
  { x: 280, y: 160 },
  { x: 280, y: 440 },
  // The fifth pizza — destined to become the leftover that gets sliced.
  { x: 480, y: 300 },
];

const GUESTS = [
  { id: "maya", label: "Maya", x: 900, y: 160 },
  { id: "theo", label: "Theo", x: 900, y: 460 },
] as const;

function buildPiecesFromPositions(
  positions: Array<{ x: number; y: number }>,
  prefix: string,
): SandboxPiece[] {
  return positions.map((pos, i) =>
    buildWholePiece({
      id: `${prefix}-${i + 1}`,
      x: pos.x,
      y: pos.y,
      baseSize: PIZZA_SIZE,
    }),
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export interface LessonV3Props {
  name: string;
  cv?: CvCameraHandle;
}

export function LessonV3({ name, cv: _cv }: LessonV3Props) {
  void _cv; // CV mode integration follows v2 pattern; deferred.

  const [stage, setStage] = useState<V3Stage>("beat_1_distribute_4");
  const [hint, setHint] = useState<string | undefined>(undefined);

  const config = STAGES[stage];

  const initialPieces = useMemo(
    () => buildPiecesFromPositions(SCENE_1_POSITIONS, "scene1"),
    [],
  );

  const { pieces, move, slice, setGuestId, resetTo } = useSandboxPieces(
    initialPieces,
    { maxFraction: config.maxFraction },
  );

  const mayaRef = useRef<GuestBoxHandle>(null);
  const theoRef = useRef<GuestBoxHandle>(null);

  const perGuest = useMemo(() => derivePerGuestTableState(pieces), [pieces]);

  // ─── One-shot onEnter side effects ────────────────────────────────────
  const lastOnEnterStage = useRef<V3Stage | null>(null);
  useEffect(() => {
    if (lastOnEnterStage.current === stage) return;
    lastOnEnterStage.current = stage;
    if (config.onEnter === "scene2-reset") {
      resetTo(buildPiecesFromPositions(SCENE_2_POSITIONS, "scene2"));
      setHint(undefined);
    }
  }, [stage, config.onEnter, resetTo]);

  // ─── Auto-advance for narration beats ─────────────────────────────────
  useEffect(() => {
    if (config.autoAdvance === undefined) return;
    const id = setTimeout(() => setStage(config.next), config.autoAdvance);
    return () => clearTimeout(id);
  }, [stage, config.autoAdvance, config.next]);

  // ─── Drag-distribution completion ─────────────────────────────────────
  useEffect(() => {
    if (!config.waitForDrag) return;
    if (config.waitForDrag(perGuest)) {
      setStage(config.next);
    }
  }, [perGuest, stage, config.waitForDrag, config.next]);

  // ─── Slice completion ────────────────────────────────────────────────
  useEffect(() => {
    if (!config.waitForSlice) return;
    if (config.waitForSlice(perGuest)) {
      setStage(config.next);
    }
  }, [perGuest, stage, config.waitForSlice, config.next]);

  // ─── Interaction handlers ─────────────────────────────────────────────

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

  // Tap = slice when slicing is allowed by maxFraction.
  // The hook's cap-check refuses if the produced children would be too small.
  const handlePieceTap = useCallback(
    (id: string) => {
      slice(id);
    },
    [slice],
  );

  const handleMCAnswer = useCallback(
    (_value: string) => {
      void _value;
      setHint(undefined);
      setStage(config.next);
    },
    [config.next],
  );

  const handleMCWrong = useCallback(
    (_value: string) => {
      void _value;
      if (config.mc?.hintOnWrong) setHint(config.mc.hintOnWrong);
    },
    [config.mc],
  );

  const handleContinue = useCallback(() => {
    setStage(config.next);
  }, [config.next]);

  const handlePlayAgain = useCallback(() => {
    setStage("beat_1_distribute_4");
    setHint(undefined);
    lastOnEnterStage.current = null;
    resetTo(buildPiecesFromPositions(SCENE_1_POSITIONS, "scene1"));
  }, [resetTo]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const freePieces = pieces.filter((p) => p.guestId === undefined);
  const isComplete = stage === "complete";
  const speechText = hint ?? config.speech?.(name);
  const showBubble = !isComplete && (speechText !== undefined || !!config.mc);

  return (
    <div
      className="absolute inset-0"
      data-testid="lesson-v3"
      data-stage={stage}
    >
      {/* Free pizzas — draggable + tappable (tap = slice if cap allows) */}
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
          onTap={handlePieceTap}
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

      {/* Speech bubble — wraps speech text, MCQ, and/or continue button */}
      {showBubble && (
        <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
          <SpeechBubble open speaker="Freddy" tailSide="bottom-left">
            <div className="flex flex-col gap-3">
              {config.mc ? (
                <MCQ
                  question={speechText ?? ""}
                  options={config.mc.options}
                  correctValue={config.mc.correctValue}
                  mode={config.mc.mode}
                  onAnswer={handleMCAnswer}
                  onWrong={handleMCWrong}
                />
              ) : speechText ? (
                <p className="font-sans text-base text-sb-ink">{speechText}</p>
              ) : null}
              {config.showContinue && (
                <button
                  type="button"
                  data-testid="lesson-v3-continue"
                  onClick={handleContinue}
                  className="self-start px-5 py-2 rounded-full bg-sb-ink text-sb-paper font-mono uppercase tracking-[0.14em] text-sm shadow-xl shadow-sb-accent-deep/25 hover:bg-sb-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface cursor-pointer transition-colors duration-200"
                >
                  Continue →
                </button>
              )}
            </div>
          </SpeechBubble>
        </div>
      )}

      {/* Completion overlay — shown when stage reaches "complete" */}
      {isComplete && (
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
              Nice work!
            </div>
            <div className="text-base text-sb-ink/70 mb-5 font-mono">
              You learned that 2 + ½ = 2½
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
