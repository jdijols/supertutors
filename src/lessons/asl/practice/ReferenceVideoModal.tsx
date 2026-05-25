import { useEffect, useRef, useState } from "react";

/**
 * ReferenceVideoModal — CSS-transition modal with autoplay-loop video.
 *
 * Triggered by "Show me the sign" on HintCard. Closable via Escape
 * or backdrop click. CSS transitions (not framer-motion) for
 * hidden-tab compatibility.
 */
export function ReferenceVideoModal({
  open,
  videoSrc,
  signName,
  onClose,
}: {
  open: boolean;
  videoSrc: string;
  signName: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
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
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`Reference video for ${signName}`}
    >
      <button
        type="button"
        aria-label="Close video"
        onClick={onClose}
        className="absolute inset-0 bg-sb-ink/70 backdrop-blur-sm cursor-pointer"
      />

      <div
        className={`
          relative w-full max-w-md
          rounded-[22px] bg-sb-card border border-sb-border
          shadow-2xl shadow-sb-ink/30 overflow-hidden
          transition-all duration-200 ease-out
          ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-sb-border">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-sb-muted">
            {signName}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="
              w-14 h-14 rounded-full border border-sb-border
              bg-sb-surface hover:bg-sb-paper
              flex items-center justify-center text-sb-ink
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
            "
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
