import { useEffect, useRef, useState } from "react";
import type { LessonModule } from "@/platform/lesson-sdk";

/**
 * AboutModal — full-screen overlay that hosts the SuperTutors "About"
 * content (heading, blurb, Coming Soon chips, SuperBuilders tag).
 *
 * Opens via the global InfoToggle. Closes on ✕ button, backdrop click,
 * or Escape key. Locks body scroll while open.
 */
export function AboutModal({
  open,
  onClose,
  comingSoon,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  comingSoon: LessonModule[];
  onNavigate: (slug: string) => void;
}) {
  // Mount/unmount with a short exit delay so the fade-out animation has
  // time to play. CSS transitions (not framer-motion) keep the modal
  // visible even when the tab is in the background — important for
  // headless preview environments where requestAnimationFrame stalls.
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      // Microtask-after-mount flip flips `visible` so the enter
      // transition runs. setTimeout (vs rAF) keeps working when the
      // tab is hidden, which matters for headless preview environments.
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  // Move focus to close button when modal becomes visible (WCAG 2.4.3)
  useEffect(() => {
    if (visible) closeButtonRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 md:p-10 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-heading"
    >
      <button
        type="button"
        aria-label="Close about"
        onClick={onClose}
        className="absolute inset-0 bg-sb-ink/60 backdrop-blur-sm cursor-pointer"
      />

      <div
        className={`
          relative w-full max-w-[720px] max-h-[90dvh] overflow-auto
          rounded-[22px] bg-sb-card border border-sb-border
          p-7 sm:p-9 md:p-12
          shadow-2xl shadow-sb-ink/30
          transition-all duration-200 ease-out
          ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"}
        `}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close about"
          data-cursor-pointing
          className="
            absolute top-4 right-4 sm:top-5 sm:right-5
            w-14 h-14 rounded-full border border-sb-border
            bg-sb-surface hover:bg-sb-paper
            flex items-center justify-center text-sb-ink
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
          "
        >
          <CloseIcon />
        </button>

        <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-sb-muted mb-5">
          About
        </p>
        <h2
          id="about-modal-heading"
          className="font-mono font-bold text-[28px] sm:text-[34px] md:text-[40px] leading-[1.02] tracking-[-0.02em] text-sb-ink"
        >
          Tutors for the AI generation.
        </h2>
        <p className="mt-5 text-[15px] sm:text-base md:text-[17px] leading-[1.55] text-sb-muted max-w-[52ch]">
          One subject. One expert. One friend at a time. SuperTutors are
          built ground-up for kids who will grow up alongside intelligent
          machines — designed to earn their attention and reward their
          curiosity.
        </p>

        {comingSoon.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-3">
              Coming soon
            </p>
            <ul className="flex flex-wrap gap-2">
              {comingSoon.map((lesson) => (
                <li key={lesson.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(lesson.slug);
                      onClose();
                    }}
                    className="font-mono text-[12px] sm:text-[13px] px-3 py-1.5 rounded-full border border-sb-border text-sb-ink bg-sb-surface hover:bg-sb-card transition-colors"
                  >
                    {lesson.meta.subject}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-10 pt-6 border-t border-sb-border font-mono text-[10px] uppercase tracking-[0.22em] text-sb-ink/70">
          A SuperBuilders project
        </p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
