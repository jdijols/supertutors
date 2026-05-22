import { useEffect, useRef } from "react";
import type { ToolMode } from "@/store/appStore";

/**
 * ToolSprite — pointer-following tool artwork rendered as a DOM element.
 *
 * Replaces the CSS-cursor approach (which Chrome on macOS was silently
 * failing to render in some regions even when the computed cursor URL
 * was correct on every element in the inheritance chain). With OS cursor
 * hidden via `cursor: none` on body, the sprite is the ONLY cursor the
 * kid sees, so we have total visual control with no browser cursor-engine
 * quirks.
 *
 * Variant selection (recomputed on every pointermove via elementFromPoint):
 *   - Hovering an element with `data-cursor-text` (the name input field):
 *     sprite is hidden so the OS text caret (I-beam) shows through
 *   - Hovering an element with `data-cursor-pointing` (chrome buttons,
 *     ToolPicker, name input card): pointing-glove (regardless of toolMode)
 *   - Otherwise: the tool variant
 *     - glove tool: open-glove idle, closed-glove while pressed
 *     - cutter tool: upright idle, cutting while pressed
 *
 * Performance: pointer handlers write to style.transform directly (no
 * React state, no re-renders) so the sprite is glued to the pointer with
 * zero lag — pointermove fires at the screen refresh rate and we update
 * the DOM synchronously inside the event handler.
 *
 * The sprite is `pointer-events: none` so it never intercepts the drag /
 * tap events that the PizzaPiece below relies on.
 */

interface ToolSpriteProps {
  toolMode: ToolMode;
  /** Sprite render size in pixels (square). Default 56 — small enough to
   *  not obscure the piece, big enough to read clearly. */
  size?: number;
}

function srcFor(opts: {
  toolMode: ToolMode;
  active: boolean;
  overPicker: boolean;
}): string {
  if (opts.overPicker) {
    return "/images/ui/glove-pointing.png";
  }
  if (opts.toolMode === "cutter") {
    return opts.active
      ? "/images/ui/cutter-cutting.png"
      : "/images/ui/cutter-upright.png";
  }
  return opts.active
    ? "/images/ui/glove-closed.png"
    : "/images/ui/glove-open.png";
}

export function ToolSprite({ toolMode, size = 56 }: ToolSpriteProps) {
  const spriteRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const sprite = spriteRef.current;
    if (!sprite) return;

    // Closed-over state for this effect run — resets when toolMode or
    // size changes (rare). Avoids React state + re-renders for high-
    // frequency pointer events.
    let active = false;
    let overPicker = false;
    let overText = false;

    function updateSrc() {
      if (!sprite) return;
      sprite.src = srcFor({ toolMode, active, overPicker });
    }

    // Sync immediately so the sprite reflects the current toolMode even
    // before the first pointermove fires.
    updateSrc();

    function onPointerMove(e: PointerEvent) {
      if (!sprite) return;
      // Translate so the sprite center sits on the cursor.
      sprite.style.transform = `translate(${e.clientX - size / 2}px, ${
        e.clientY - size / 2
      }px)`;

      // Re-evaluate hover state on every move. We check via
      // `elementFromPoint` rather than the event target — the sprite
      // itself has pointer-events:none so it's skipped, and we get
      // whatever real element is underneath.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const newOverText = Boolean(el?.closest("[data-cursor-text]"));
      const newOverPicker =
        !newOverText && Boolean(el?.closest("[data-cursor-pointing]"));

      // Over a text input → hide the sprite so the OS I-beam can show.
      sprite.style.opacity = newOverText ? "0" : "1";

      if (newOverText !== overText) {
        overText = newOverText;
      }
      if (newOverPicker !== overPicker) {
        overPicker = newOverPicker;
        updateSrc();
      }
    }
    function onPointerDown() {
      if (active) return;
      active = true;
      updateSrc();
    }
    function onPointerUp() {
      if (!active) return;
      active = false;
      updateSrc();
    }
    function onPointerLeaveWindow() {
      // Hide the sprite when the cursor leaves the document (e.g., into
      // the browser chrome) so it doesn't get stuck at the last position.
      if (!sprite) return;
      sprite.style.opacity = "0";
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("pointerleave", onPointerLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("pointerleave", onPointerLeaveWindow);
    };
  }, [toolMode, size]);

  return (
    <img
      ref={spriteRef}
      data-testid="tool-sprite"
      src={srcFor({ toolMode, active: false, overPicker: false })}
      alt=""
      className="fixed top-0 left-0 pointer-events-none z-[200] select-none drop-shadow-xl"
      style={{
        width: size,
        height: size,
        opacity: 0, // start hidden until first pointermove positions it
        transform: "translate(-9999px, -9999px)",
      }}
      draggable={false}
    />
  );
}
