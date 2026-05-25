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
import { FractionInput } from "./FractionInput";
import { MixedNumberDisplay } from "./MixedNumberDisplay";
import type { CvCameraHandle } from "@/platform/lesson-sdk";

/**
 * LessonV3 — V3 Synthesis-port lesson host.
 *
 * Currently covers Scene 1 (clean division), Scene 2 (remainder +
 * slicing → halves), and Scene 3 (notation overlay + kid types ½),
 * with the beat-21.5 stop-here Y/N break before Scene 4. Scene 4 and 5
 * (quarters) land in subsequent commits.
 *
 * Architecture: data-driven stage machine. See V3StageConfig for the
 * shape; STAGES is the per-beat config. Effects drive auto-advance,
 * drag-completion, slice-completion, MCQ, and FractionInput.
 *
 * Lesson-mode lockdown via per-stage `maxFraction` enforces what the
 * student can do at each beat. The v2 over-slicing dead-end can't
 * happen here.
 *
 * No audio yet — text bubbles only.
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
  // Scene 3 — notation (kid types ½)
  | "beat_14_intro_notation"
  | "beat_15_two_numeral"
  | "beat_16_but_for_half"
  | "beat_17_need_fraction"
  | "beat_18_yn_know_one_half"
  | "beat_19_type_one_half"
  | "beat_20_thats_it_half"
  | "beat_21_so_each_person"
  // Stop-here Y/N (our addition per ADR §4)
  | "beat_21_5_stop_or_continue"
  // End of currently-built content (Scene 4 + 5 land in later commits)
  | "complete";

type PerGuestState = ReturnType<typeof derivePerGuestTableState>;

interface MCConfig {
  options: MCQOption[];
  correctValue?: string;
  mode: "any-advances" | "re-prompt-until-correct";
  hintOnWrong?: string;
}

interface FractionInputConfig {
  expected: { numerator: number; denominator: number };
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
  /** Render a FractionInput inside the speech bubble (notation beats). */
  fractionInput?: FractionInputConfig;
  /** Big numeral overlay rendered above the workspace (notation beats). */
  numeralOverlay?: {
    whole?: number;
    numerator?: number;
    denominator?: number;
  };
  /** One-shot side effect when entering this stage (scene reset, etc.). */
  onEnter?: "scene2-reset";
  /** What stage to transition to on completion. */
  next: V3Stage;
  /** Optional branch routing for MCQ stages: maps option value → next stage.
   *  Falls back to `next` if the picked value isn't in the map. */
  nextByValue?: Record<string, V3Stage>;
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
    next: "beat_14_intro_notation",
  },
  // ─── Scene 3 — Notation (kid types ½) ────────────────────────────────
  beat_14_intro_notation: {
    speech: () => "Now let's write down what each person got.",
    maxFraction: "1/2",
    autoAdvance: 2000,
    next: "beat_15_two_numeral",
  },
  beat_15_two_numeral: {
    speech: () =>
      "We can just write the number 2 for the whole pizzas. No problem.",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2 },
    showContinue: true,
    next: "beat_16_but_for_half",
  },
  beat_16_but_for_half: {
    speech: () => "But for the half pizza…",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2 },
    autoAdvance: 2000,
    next: "beat_17_need_fraction",
  },
  beat_17_need_fraction: {
    speech: () => "We need a fraction.",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2 },
    autoAdvance: 1800,
    next: "beat_18_yn_know_one_half",
  },
  beat_18_yn_know_one_half: {
    speech: () => "Do you know how to write the fraction for one half?",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2 },
    mc: {
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      mode: "any-advances",
    },
    next: "beat_19_type_one_half",
  },
  beat_19_type_one_half: {
    speech: () => "Go for it. What's one half written as a fraction?",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2 },
    fractionInput: {
      expected: { numerator: 1, denominator: 2 },
      hintOnWrong: "Hmm, not quite. One out of two parts — try again!",
    },
    next: "beat_20_thats_it_half",
  },
  beat_20_thats_it_half: {
    speech: () => "That's it. One half.",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2, numerator: 1, denominator: 2 },
    autoAdvance: 2000,
    next: "beat_21_so_each_person",
  },
  beat_21_so_each_person: {
    speech: () => "So each person has 2½ pizzas.",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2, numerator: 1, denominator: 2 },
    showContinue: true,
    next: "beat_21_5_stop_or_continue",
  },
  // ─── Beat 21.5 — Stop-here Y/N (our addition per ADR §4) ─────────────
  beat_21_5_stop_or_continue: {
    speech: () =>
      "You just wrote your first fraction! Want to keep going to harder ones like quarters, or stop here for today?",
    maxFraction: "1/2",
    numeralOverlay: { whole: 2, numerator: 1, denominator: 2 },
    mc: {
      options: [
        { value: "continue", label: "Keep going" },
        { value: "stop", label: "Stop here" },
      ],
      mode: "any-advances",
    },
    nextByValue: {
      // "continue" will route to scene_4_intro once Scene 4 lands.
      // For now both branches end the lesson; Scene 4 commit updates this.
      continue: "complete",
      stop: "complete",
    },
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
  void _cv;

  const [stage, setStage] = useState<V3Stage>("beat_1_distribute_4");
  const [hint, setHint] = useState<string | undefined>(undefined);
  // Bump this to remount FractionInput on a wrong attempt (clears state).
  const [fractionRetryCount, setFractionRetryCount] = useState(0);

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

  // One-shot onEnter side effects
  const lastOnEnterStage = useRef<V3Stage | null>(null);
  useEffect(() => {
    if (lastOnEnterStage.current === stage) return;
    lastOnEnterStage.current = stage;
    if (config.onEnter === "scene2-reset") {
      resetTo(buildPiecesFromPositions(SCENE_2_POSITIONS, "scene2"));
      setHint(undefined);
    }
  }, [stage, config.onEnter, resetTo]);

  // Reset hint + fraction retry counter on stage change (avoids stale hint)
  useEffect(() => {
    setHint(undefined);
    setFractionRetryCount(0);
  }, [stage]);

  // Auto-advance for narration beats
  useEffect(() => {
    if (config.autoAdvance === undefined) return;
    const id = setTimeout(() => setStage(config.next), config.autoAdvance);
    return () => clearTimeout(id);
  }, [stage, config.autoAdvance, config.next]);

  // Drag-distribution completion
  useEffect(() => {
    if (!config.waitForDrag) return;
    if (config.waitForDrag(perGuest)) {
      setStage(config.next);
    }
  }, [perGuest, stage, config.waitForDrag, config.next]);

  // Slice completion
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
        setGuestId(id, undefined);
        move(id, x, y);
      }
    },
    [pieces, move, setGuestId],
  );

  const handlePieceTap = useCallback(
    (id: string) => {
      slice(id);
    },
    [slice],
  );

  const handleMCAnswer = useCallback(
    (value: string) => {
      setHint(undefined);
      const nextStage = config.nextByValue?.[value] ?? config.next;
      setStage(nextStage);
    },
    [config.next, config.nextByValue],
  );

  const handleMCWrong = useCallback(
    (_value: string) => {
      void _value;
      if (config.mc?.hintOnWrong) setHint(config.mc.hintOnWrong);
    },
    [config.mc],
  );

  const handleFractionAnswer = useCallback(
    (_num: number, _den: number) => {
      void _num;
      void _den;
      setHint(undefined);
      setStage(config.next);
    },
    [config.next],
  );

  const handleFractionWrong = useCallback(
    (_num: number, _den: number) => {
      void _num;
      void _den;
      if (config.fractionInput?.hintOnWrong) {
        setHint(config.fractionInput.hintOnWrong);
      }
      setFractionRetryCount((c) => c + 1);
    },
    [config.fractionInput],
  );

  const handleContinue = useCallback(() => {
    setStage(config.next);
  }, [config.next]);

  const handlePlayAgain = useCallback(() => {
    setStage("beat_1_distribute_4");
    setHint(undefined);
    setFractionRetryCount(0);
    lastOnEnterStage.current = null;
    resetTo(buildPiecesFromPositions(SCENE_1_POSITIONS, "scene1"));
  }, [resetTo]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const freePieces = pieces.filter((p) => p.guestId === undefined);
  const isComplete = stage === "complete";
  const speechText = hint ?? config.speech?.(name);
  const showBubble =
    !isComplete &&
    (speechText !== undefined || !!config.mc || !!config.fractionInput);

  return (
    <div
      className="absolute inset-0"
      data-testid="lesson-v3"
      data-stage={stage}
    >
      {/* Free pizzas — draggable + tappable */}
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

      {/* Guest boxes */}
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

      {/* Numeral overlay — appears during notation beats (Scene 3+) */}
      {config.numeralOverlay && (
        <motion.div
          data-testid="lesson-v3-numeral"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <MixedNumberDisplay {...config.numeralOverlay} />
        </motion.div>
      )}

      {/* Speech bubble + optional MCQ / FractionInput / continue */}
      {showBubble && (
        <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
          <SpeechBubble open speaker="Freddy" tailSide="bottom-left">
            <div className="flex flex-col gap-3">
              {config.fractionInput ? (
                <>
                  {speechText && (
                    <p className="font-sans text-base text-sb-ink">
                      {speechText}
                    </p>
                  )}
                  <FractionInput
                    key={`${stage}-${fractionRetryCount}`}
                    expected={config.fractionInput.expected}
                    onAnswer={handleFractionAnswer}
                    onWrong={handleFractionWrong}
                  />
                </>
              ) : config.mc ? (
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

      {/* Completion overlay */}
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
