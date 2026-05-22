import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PizzaVariant } from "@/modules/table";
import { useAppStore } from "@/store/appStore";

/**
 * AddPizzaButton — fixed-position top-left "+" button that opens a small
 * picker for adding a fresh pizza to the table.
 *
 * Heuristic: top-left because that's where the brick oven + paddle live in
 * the restaurant scene — narratively "I'm grabbing a pizza from the oven."
 * Mirrors `MuteToggle`'s visual chrome (top-right) so the two corners feel
 * balanced.
 *
 * Behavior:
 *   - Tap → expands a small panel with two thumbnails: plain (cheese-v1)
 *     and pepperoni (pepperoni-v1). Tapping a thumbnail fires `onAdd(variant)`
 *     and closes the panel.
 *   - When `disabled` is true (parent passes when the pizza cap is reached),
 *     the button is greyed out, doesn't open the panel, and reads
 *     "Send a pizza away first" via aria-disabled.
 *   - Clicking outside the panel closes it (no commit).
 *   - Escape key closes the panel.
 */

export interface AddPizzaButtonProps {
  /** Fired with the selected variant when the kid picks one. */
  onAdd: (variant: PizzaVariant) => void;
  /** True when the table is at the pizza cap — disables the button. */
  disabled?: boolean;
}

export function AddPizzaButton({ onAdd, disabled = false }: AddPizzaButtonProps) {
  // User-driven open state. The actual displayed open state is
  // `userOpen || spotlit` (derived below) — that way the spotlight forces
  // the menu open without touching the user's state, and when the
  // spotlight ends the menu naturally closes (since userOpen stayed false).
  const [userOpen, setUserOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Spotlight is set by LessonExploration during the opener tour — when
  // Freddy says "pizzas come outta the oven," the button pulses + scales
  // AND the variant menu auto-opens to demo what tapping does. The menu
  // closes again when the spotlight moves off (purely a teaching beat,
  // not an action gate). During the spotlight the button toggle is a
  // no-op so the kid can't accidentally latch the menu open.
  const spotlit = useAppStore((s) => s.spotlight === "add");
  const open = userOpen || spotlit;

  // Close on outside click / Escape — but NOT while spotlit (the tour owns it).
  useEffect(() => {
    if (!userOpen || spotlit) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setUserOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [userOpen, spotlit]);

  function handleToggle() {
    if (disabled || spotlit) return;
    setUserOpen((v) => !v);
  }

  function handlePick(variant: PizzaVariant) {
    setUserOpen(false);
    onAdd(variant);
  }

  return (
    <div
      ref={rootRef}
      className="fixed top-4 left-4 sm:top-6 sm:left-6 z-[60] flex items-start gap-3"
      data-cursor-pointing
    >
      <motion.button
        type="button"
        onClick={handleToggle}
        whileHover={disabled ? undefined : { scale: 1.04 }}
        whileTap={disabled ? undefined : { scale: 0.92 }}
        transition={{ type: "spring", stiffness: 600, damping: 22 }}
        aria-label={disabled ? "Send a pizza away first" : "Add a pizza"}
        aria-expanded={open}
        aria-disabled={disabled}
        data-testid="add-pizza-button"
        data-disabled={disabled}
        data-spotlight={spotlit}
        className={`
          w-14 h-14 sm:w-16 sm:h-16
          rounded-2xl border-2 border-sb-ink
          shadow-xl shadow-sb-accent-deep/25
          flex items-center justify-center
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
          ${spotlit ? "spotlight-pulse" : ""}
          ${
            disabled
              ? "bg-sb-paper text-sb-ink opacity-40 cursor-not-allowed"
              : "bg-sb-paper text-sb-ink hover:bg-sb-paper-deep cursor-pointer"
          }
        `}
      >
        <PlusIcon />
      </motion.button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            data-testid="add-pizza-menu"
            role="menu"
            aria-label="Pick a pizza"
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="
              flex gap-3 items-center
              bg-sb-paper border-2 border-sb-ink rounded-2xl shadow-xl shadow-sb-accent-deep/25
              p-2
            "
          >
            <PizzaPickerButton
              label="Cheese"
              variant="cheese-v1"
              src="/images/pizza/cheese-v1/whole.png"
              onPick={handlePick}
            />
            <PizzaPickerButton
              label="Pepperoni"
              variant="pepperoni-v1"
              src="/images/pizza/pepperoni-v1/whole.png"
              onPick={handlePick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PizzaPickerButton({
  label,
  variant,
  src,
  onPick,
}: {
  label: string;
  variant: PizzaVariant;
  src: string;
  onPick: (v: PizzaVariant) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onPick(variant)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      data-testid={`add-pizza-${variant}`}
      role="menuitem"
      aria-label={`Add a ${label.toLowerCase()} pizza`}
      className="
        w-14 h-14 sm:w-16 sm:h-16
        rounded-xl
        bg-sb-card hover:bg-sb-paper-deep
        flex flex-col items-center justify-center
        cursor-pointer
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-paper
      "
    >
      <img
        src={src}
        alt=""
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none"
        draggable={false}
      />
    </motion.button>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
