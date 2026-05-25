import { useEffect } from "react";

/**
 * SkipPill — fades in 10s after the user lands on a letter, giving them
 * an out when the model is being uncooperative. Keyboard shortcut: S.
 *
 * Visual: small pill at the bottom-right of the camera feed, sits above
 * the prompt area, semi-transparent so it doesn't dominate.
 */
export function SkipPill({
  visible,
  onSkip,
}: {
  visible: boolean;
  onSkip: () => void;
}) {
  // S keyboard shortcut (when visible)
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onSkip]);

  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Skip this letter for now"
      data-testid="skip-pill"
      className={`
        absolute bottom-6 right-6 z-20
        px-4 py-2 rounded-full
        bg-sb-ink/85 backdrop-blur-md text-white
        font-mono text-[11px] uppercase tracking-[0.18em]
        border border-white/15 shadow-lg shadow-black/30
        transition-all duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black
        ${visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}
      `}
    >
      Skip for now →
      <span className="ml-2 text-white/50">[S]</span>
    </button>
  );
}
