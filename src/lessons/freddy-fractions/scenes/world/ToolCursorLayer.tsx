import { useEffect } from "react";
import { useTutorStore } from "../../store/tutorStore";
import { ToolSprite } from "./ToolSprite";

/**
 * ToolCursorLayer — the always-on custom cursor for Freddy Fractions.
 *
 * Two responsibilities:
 *
 *   1. Toggle `tool-glove` / `tool-cutter` on `<html>` and `<body>`
 *      whenever the active tool changes. The matching CSS in
 *      `styles/globals.css` applies `cursor: none !important` to the
 *      entire subtree, hiding the OS pointer.
 *
 *   2. Render the `<ToolSprite />` that follows the pointer. The sprite
 *      reads the same toolMode and renders the right variant (glove
 *      open/closed, cutter upright/cutting). When the pointer is over
 *      an element with `data-cursor-pointing` (chrome buttons, tool
 *      picker, add-pizza, in-lesson CTAs, etc.) the sprite swaps to
 *      the pointing glove.
 *
 * Mount this once at the FreddyMount level — it must stay alive across
 * every phase of the lesson (Explore → V2 scripted → V3 structured),
 * including during Freddy's speech and the AHA animation, so the OS
 * cursor never flashes back in.
 *
 * Idempotent body-class management: each toolMode change adds the new
 * class and removes the previous one. Unmount cleanup strips both so
 * the landing page (and other lessons) get their OS cursor back.
 */
export function ToolCursorLayer() {
  const toolMode = useTutorStore((s) => s.toolMode);
  const toolClassName = toolMode === "cutter" ? "tool-cutter" : "tool-glove";

  useEffect(() => {
    document.documentElement.classList.add(toolClassName);
    document.body.classList.add(toolClassName);
    return () => {
      document.documentElement.classList.remove(toolClassName);
      document.body.classList.remove(toolClassName);
    };
  }, [toolClassName]);

  return <ToolSprite toolMode={toolMode} />;
}
