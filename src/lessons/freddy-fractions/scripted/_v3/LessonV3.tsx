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
 * Scenes 1-4 wired (clean division, remainder + halves, notation for
 * ½, 5÷4 with quarters). Scene 5 (name + write ¼) lands next.
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
  | "beat_21_5_stop_or_continue"
  // Scene 4 — 5÷4 with quarters
  | "scene_4_intro"
  | "beat_22_now_5_and_4"
  | "beat_24_5_distributed"
  | "beat_25_slice_again"
  | "beat_27_distribute_quarters"
  | "beat_28_each_got_extra"
  // Scene 5 — name + write the quarter
  | "beat_29_mc_quarter_name"
  | "beat_30_bingo_quarter"
  | "beat_31_mc_count_quarters"
  | "beat_32_four_quarters_whole"
  | "beat_33_type_one_fourth"
  | "beat_34_nailed_it"
  | "beat_35_quarter_notation"
  | "beat_36_mc_continue_yn"
  // End of currently-built content
  | "complete";

type PerGuestState = ReturnType<typeof derivePerGuestTableState>;

type GuestLayoutKey = "two" | "four";

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
  speech?: (name: string) => string;
  maxFraction: PizzaFraction;
  autoAdvance?: number;
  showContinue?: boolean;
  waitForDrag?: (perGuest: PerGuestState) => boolean;
  waitForSlice?: (perGuest: PerGuestState) => boolean;
  mc?: MCConfig;
  fractionInput?: FractionInputConfig;
  numeralOverlay?: {
    whole?: number;
    numerator?: number;
    denominator?: number;
  };
  /** One-shot side effect when entering this stage. */
  onEnter?: "scene2-reset" | "scene4-reset";
  /** Switch between 2-guest (Scene 1-3) and 4-guest (Scene 4+) layouts. */
  guestLayout?: GuestLayoutKey;
  next: V3Stage;
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
      continue: "scene_4_intro",
      stop: "complete",
    },
    next: "complete",
  },
  // ─── Scene 4 — 5÷4 with quarters ─────────────────────────────────────
  scene_4_intro: {
    speech: () =>
      "Nonna and Nico are joining Maya and Theo — that's four boxes for four hungry friends.",
    maxFraction: "1",
    onEnter: "scene4-reset",
    guestLayout: "four",
    autoAdvance: 3500,
    next: "beat_22_now_5_and_4",
  },
  beat_22_now_5_and_4: {
    speech: () =>
      "Now we've got 5 pizzas and 4 people. Try giving each person the same amount.",
    maxFraction: "1",
    guestLayout: "four",
    waitForDrag: (g) =>
      g.byGuest.maya?.counts.whole === 1 &&
      g.byGuest.theo?.counts.whole === 1 &&
      g.byGuest.nonna?.counts.whole === 1 &&
      g.byGuest.nico?.counts.whole === 1 &&
      g.free.counts.whole === 1,
    next: "beat_24_5_distributed",
  },
  beat_24_5_distributed: {
    speech: () =>
      "Each friend has 1 pizza, with 1 left over. Tap the leftover to slice it in half.",
    maxFraction: "1/2",
    guestLayout: "four",
    waitForSlice: (g) =>
      g.free.counts.halves === 2 && g.free.counts.whole === 0,
    next: "beat_25_slice_again",
  },
  beat_25_slice_again: {
    speech: () => "Now slice each half — that gives us 4 quarters.",
    maxFraction: "1/4",
    guestLayout: "four",
    waitForSlice: (g) =>
      g.free.counts.quarters === 4 &&
      g.free.counts.halves === 0 &&
      g.free.counts.whole === 0,
    next: "beat_27_distribute_quarters",
  },
  beat_27_distribute_quarters: {
    speech: () => "Now give each person one of those quarters.",
    maxFraction: "1/4",
    guestLayout: "four",
    waitForDrag: (g) =>
      g.byGuest.maya?.counts.whole === 1 &&
      g.byGuest.maya?.counts.quarters === 1 &&
      g.byGuest.theo?.counts.whole === 1 &&
      g.byGuest.theo?.counts.quarters === 1 &&
      g.byGuest.nonna?.counts.whole === 1 &&
      g.byGuest.nonna?.counts.quarters === 1 &&
      g.byGuest.nico?.counts.whole === 1 &&
      g.byGuest.nico?.counts.quarters === 1 &&
      g.free.counts.whole === 0 &&
      g.free.counts.halves === 0 &&
      g.free.counts.quarters === 0,
    next: "beat_28_each_got_extra",
  },
  beat_28_each_got_extra: {
    speech: () => "Each person got a whole pizza, plus a little extra.",
    maxFraction: "1/4",
    guestLayout: "four",
    autoAdvance: 2500,
    next: "beat_29_mc_quarter_name",
  },
  // ─── Scene 5 — Name + write the quarter ──────────────────────────────
  beat_29_mc_quarter_name: {
    speech: () =>
      "This time the extra part is half of a half. Do you know what that's called?",
    maxFraction: "1/4",
    guestLayout: "four",
    mc: {
      options: [
        { value: "quarter", label: "Quarter" },
        { value: "third", label: "Third" },
        { value: "fourth", label: "Fourth" },
      ],
      correctValue: "quarter",
      mode: "re-prompt-until-correct",
      hintOnWrong: "Close! Think about it — half OF a half. Try again.",
    },
    next: "beat_30_bingo_quarter",
  },
  beat_30_bingo_quarter: {
    speech: () => "Bingo. It's a quarter pizza.",
    maxFraction: "1/4",
    guestLayout: "four",
    autoAdvance: 2000,
    next: "beat_31_mc_count_quarters",
  },
  beat_31_mc_count_quarters: {
    speech: () => "How many quarter pizzas are there in a full pizza?",
    maxFraction: "1/4",
    guestLayout: "four",
    mc: {
      options: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6" },
      ],
      correctValue: "4",
      mode: "re-prompt-until-correct",
      hintOnWrong: "Try counting — a quarter is one of four equal pieces!",
    },
    next: "beat_32_four_quarters_whole",
  },
  beat_32_four_quarters_whole: {
    speech: () => "Right. 4 quarters make one whole.",
    maxFraction: "1/4",
    guestLayout: "four",
    autoAdvance: 2500,
    next: "beat_33_type_one_fourth",
  },
  beat_33_type_one_fourth: {
    speech: () =>
      "So if a quarter is 1 out of 4 pieces — guess how we write the fraction for a quarter?",
    maxFraction: "1/4",
    guestLayout: "four",
    fractionInput: {
      expected: { numerator: 1, denominator: 4 },
      hintOnWrong:
        "Try again — one slice out of four. Top number, then bottom number.",
    },
    next: "beat_34_nailed_it",
  },
  beat_34_nailed_it: {
    speech: () => "Nailed it.",
    maxFraction: "1/4",
    guestLayout: "four",
    autoAdvance: 1500,
    next: "beat_35_quarter_notation",
  },
  beat_35_quarter_notation: {
    speech: () =>
      "Since a quarter is 1 out of 4 pieces, the fraction for a quarter is ¼.",
    maxFraction: "1/4",
    guestLayout: "four",
    numeralOverlay: { numerator: 1, denominator: 4 },
    showContinue: true,
    next: "beat_36_mc_continue_yn",
  },
  beat_36_mc_continue_yn: {
    speech: () => "Want to continue learning about fractions?",
    maxFraction: "1/4",
    guestLayout: "four",
    numeralOverlay: { numerator: 1, denominator: 4 },
    mc: {
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      mode: "any-advances",
    },
    // Both Yes/No end the lesson for V3 MVP
    next: "complete",
  },
  complete: {
    maxFraction: "1/4",
    next: "beat_1_distribute_4",
  },
};

// ─── Layout ─────────────────────────────────────────────────────────────────

const SCENE_1_PIZZA_SIZE = 170;
const SCENE_4_PIZZA_SIZE = 130;

const BOX_SIZE_BY_LAYOUT: Record<GuestLayoutKey, number> = {
  two: 200,
  four: 150,
};

interface SceneLayout {
  scene1Positions: Array<{ x: number; y: number }>;
  scene2Positions: Array<{ x: number; y: number }>;
  scene4Positions: Array<{ x: number; y: number }>;
  guests2: ReadonlyArray<{ id: string; label: string; x: number; y: number }>;
  guests4: ReadonlyArray<{ id: string; label: string; x: number; y: number }>;
}

/**
 * Viewport-relative layout. The wooden counter occupies the bottom ~half
 * of the viewport, so pizzas + boxes need to live on the counter — not in
 * the upper restaurant scene where Freddy stands. Boxes sit on the
 * right (vertically centered on the counter); pizzas occupy the left
 * half of the counter.
 *
 * Called once at mount via useMemo. Resize is not tracked — out of
 * scope for V3 MVP.
 */
function getLayout(width: number, height: number): SceneLayout {
  // Where the counter visually begins (top edge of the wood).
  const counterTop = height * 0.48;
  // Pizza rows — two rows on the counter (upper + lower).
  const pizzaRow1Y = counterTop + 90;
  const pizzaRow2Y = counterTop + 290;

  // Boxes — right side, right edge aligned to the mute-toggle right
  // edge (~20px from viewport right). Box width = 200, so box left =
  // width - 220. Vertically centered on the counter; shifted up
  // slightly so they don't crowd the bottom.
  const guests2X = Math.max(width - 220, 800);
  const guests2 = [
    { id: "maya", label: "Maya", x: guests2X, y: counterTop + 20 },
    { id: "theo", label: "Theo", x: guests2X, y: counterTop + 250 },
  ] as const;

  // 4-guest layout: 2×2 grid on the right, also right-edge-aligned.
  // Box width = 150; right column right edge at ~width - 30; left
  // column right edge ~170px to the left.
  const guests4Col1X = Math.max(width - 350, 700);
  const guests4Col2X = Math.max(width - 180, 900);
  const guests4 = [
    { id: "maya", label: "Maya", x: guests4Col1X, y: counterTop + 20 },
    { id: "theo", label: "Theo", x: guests4Col2X, y: counterTop + 20 },
    { id: "nonna", label: "Nonna", x: guests4Col1X, y: counterTop + 210 },
    { id: "nico", label: "Nico", x: guests4Col2X, y: counterTop + 210 },
  ] as const;

  const scene1Positions = [
    { x: 120, y: pizzaRow1Y },
    { x: 120, y: pizzaRow2Y },
    { x: 360, y: pizzaRow1Y },
    { x: 360, y: pizzaRow2Y },
  ];

  const scene2Positions = [
    { x: 80, y: pizzaRow1Y },
    { x: 280, y: pizzaRow1Y },
    { x: 480, y: pizzaRow1Y },
    { x: 180, y: pizzaRow2Y },
    { x: 380, y: pizzaRow2Y },
  ];

  // Scene 4 uses smaller pizzas (130px) — pack more efficiently since
  // the right half is full with 4 boxes.
  const scene4Positions = [
    { x: 80, y: pizzaRow1Y },
    { x: 220, y: pizzaRow1Y },
    { x: 360, y: pizzaRow1Y },
    { x: 150, y: pizzaRow2Y - 30 },
    { x: 290, y: pizzaRow2Y - 30 },
  ];

  return {
    scene1Positions,
    scene2Positions,
    scene4Positions,
    guests2,
    guests4,
  };
}

function buildScenePieces(
  positions: Array<{ x: number; y: number }>,
  prefix: string,
  baseSize: number,
): SandboxPiece[] {
  return positions.map((pos, i) =>
    buildWholePiece({
      id: `${prefix}-${i + 1}`,
      x: pos.x,
      y: pos.y,
      baseSize,
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
  const [fractionRetryCount, setFractionRetryCount] = useState(0);

  const config = STAGES[stage];
  const guestLayout: GuestLayoutKey = config.guestLayout ?? "two";
  const boxSize = BOX_SIZE_BY_LAYOUT[guestLayout];

  // Viewport-relative layout. Computed once at mount.
  const layout = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1920;
    const h = typeof window !== "undefined" ? window.innerHeight : 1080;
    return getLayout(w, h);
  }, []);

  const guestsToRender =
    guestLayout === "two" ? layout.guests2 : layout.guests4;

  const initialPieces = useMemo(
    () =>
      buildScenePieces(layout.scene1Positions, "scene1", SCENE_1_PIZZA_SIZE),
    [layout],
  );

  const { pieces, move, slice, setGuestId, resetTo } = useSandboxPieces(
    initialPieces,
    { maxFraction: config.maxFraction },
  );

  // Box refs — one per canonical guest. Inactive ones (not in current
  // layout) are simply unused.
  const mayaRef = useRef<GuestBoxHandle>(null);
  const theoRef = useRef<GuestBoxHandle>(null);
  const nonnaRef = useRef<GuestBoxHandle>(null);
  const nicoRef = useRef<GuestBoxHandle>(null);
  const boxRefMap: Record<string, React.RefObject<GuestBoxHandle | null>> = {
    maya: mayaRef,
    theo: theoRef,
    nonna: nonnaRef,
    nico: nicoRef,
  };

  const perGuest = useMemo(() => derivePerGuestTableState(pieces), [pieces]);

  // One-shot onEnter side effects
  const lastOnEnterStage = useRef<V3Stage | null>(null);
  useEffect(() => {
    if (lastOnEnterStage.current === stage) return;
    lastOnEnterStage.current = stage;
    if (config.onEnter === "scene2-reset") {
      resetTo(
        buildScenePieces(layout.scene2Positions, "scene2", SCENE_1_PIZZA_SIZE),
      );
      setHint(undefined);
    } else if (config.onEnter === "scene4-reset") {
      resetTo(
        buildScenePieces(layout.scene4Positions, "scene4", SCENE_4_PIZZA_SIZE),
      );
      setHint(undefined);
    }
  }, [stage, config.onEnter, resetTo, layout]);

  // Reset hint + fraction retry counter on stage change
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

      for (const guest of guestsToRender) {
        if (boxRefMap[guest.id].current?.overlaps(pieceRect)) {
          setGuestId(id, guest.id);
          return;
        }
      }
      // Free table — clear ownership + update position
      setGuestId(id, undefined);
      move(id, x, y);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pieces, move, setGuestId, guestsToRender],
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
    resetTo(
      buildScenePieces(layout.scene1Positions, "scene1", SCENE_1_PIZZA_SIZE),
    );
  }, [resetTo, layout]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const freePieces = pieces.filter((p) => p.guestId === undefined);
  const isComplete = stage === "complete";
  const speechText = hint ?? config.speech?.(name);
  const showBubble =
    !isComplete &&
    (speechText !== undefined || !!config.mc || !!config.fractionInput);

  return (
    <div
      className="absolute inset-0 z-[25]"
      data-testid="lesson-v3"
      data-stage={stage}
    >
      {/* Guest boxes — rendered FIRST so free pizzas paint above them
          when a kid drags a pizza over a box (DOM order = paint order
          within the wrapper's stacking context). */}
      {guestsToRender.map((guest) => {
        const guestPieces = pieces.filter((p) => p.guestId === guest.id);
        const ref = boxRefMap[guest.id];
        return (
          <GuestBox
            key={guest.id}
            ref={ref}
            guestId={guest.id}
            label={guest.label}
            x={guest.x}
            y={guest.y}
            pieces={guestPieces}
            size={boxSize}
          />
        );
      })}

      {/* Free pizzas — draggable + tappable. Rendered AFTER boxes so a
          dragged pizza always appears on top of any box it's hovering
          over (no flicker on drop). */}
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
              You shared pizzas and learned to write fractions.
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
