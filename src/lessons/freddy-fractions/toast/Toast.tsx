import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Toast — auto-dismissing notification used for fraction labels in Beat 2
 * (Sandbox) and counter ticks in Beat 3 (Vocab).
 *
 * Controlled component: caller manages `open` state and provides `onDismiss`
 * to clear it after the auto-dismiss duration elapses. Multiple consumers
 * compose via independent <Toast/> instances OR via the `useToastQueue`
 * hook (TODO if we need stacking; for v1 single-toast-at-a-time is fine).
 *
 * Animation: spring entrance from above with scale + opacity, fade out on
 * close. Auto-dismiss timer starts when `open` flips true.
 */

export type ToastVariant = "success" | "info";

export interface ToastProps {
  /** Whether the toast is visible. Caller controls. */
  open: boolean;
  /** Toast content. Usually a fraction label, e.g., "You made halves! 1/2". */
  message: ReactNode;
  /** Visual treatment. Default "success". */
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms. Default 2200. Set 0 to disable auto-dismiss. */
  durationMs?: number;
  /** Fired when the toast auto-dismisses OR is dismissed by the caller. */
  onDismiss?: () => void;
  /** Optional className for positioning overrides. */
  className?: string;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-sb-paper border-2 border-sb-ink text-sb-ink",
  info: "bg-sb-card border-2 border-sb-border text-sb-muted",
};

export function Toast({
  open,
  message,
  variant = "success",
  durationMs = 2200,
  onDismiss,
  className = "",
}: ToastProps) {
  useEffect(() => {
    if (!open || durationMs <= 0) return;
    const timer = window.setTimeout(() => {
      onDismiss?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
    // Including `message` here so that consecutive new messages reset the
    // auto-dismiss timer instead of inheriting an in-flight one from the
    // previous message (which would close the new toast prematurely).
  }, [open, durationMs, onDismiss, message]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="toast"
          data-variant={variant}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.92 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 24,
            mass: 0.7,
          }}
          className={`pointer-events-none select-none rounded-2xl px-6 py-3 font-mono font-bold text-2xl tracking-tight shadow-xl shadow-sb-accent-deep/25 ${VARIANT_STYLES[variant]} ${className}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
