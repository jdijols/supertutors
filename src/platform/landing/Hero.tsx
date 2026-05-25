import type { AuthStatus } from "@/platform/stores/platformStore";

/**
 * Hero — top section of the landing-as-dashboard.
 *
 * Signed-out: marketing headline + sign-in CTA.
 * Signed-in: personalized greeting + continue CTA.
 */
export function Hero({
  authStatus,
  displayName,
  onSignIn,
  onContinue,
}: {
  authStatus: AuthStatus;
  displayName?: string;
  onSignIn: () => void;
  onContinue?: () => void;
}) {
  if (authStatus === "loading") {
    return (
      <div className="min-h-40 flex items-center justify-center">
        <span className="font-mono text-sm text-sb-muted animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  if (authStatus === "signed-in") {
    return (
      <section aria-label="Dashboard hero">
        <h1 className="font-mono font-bold text-[22px] sm:text-[28px] md:text-[32px] tracking-[-0.02em] text-sb-ink leading-tight">
          Welcome back, {displayName || "learner"}.
        </h1>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="
              mt-3 inline-flex items-center gap-2
              font-mono text-xs uppercase tracking-[0.18em]
              px-4 py-2.5 rounded-xl
              bg-sb-ink text-white
              hover:bg-sb-ink/90
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
            "
          >
            Continue practicing <span aria-hidden>→</span>
          </button>
        )}
      </section>
    );
  }

  // Signed-out
  return (
    <section aria-label="Welcome hero">
      <h1 className="font-mono font-bold text-[24px] sm:text-[32px] md:text-[40px] tracking-[-0.02em] text-sb-ink leading-[0.98]">
        Tutors for the AI generation.
      </h1>
      <p className="mt-3 text-[14px] sm:text-[15px] text-sb-muted max-w-[48ch]">
        One subject. One expert. One friend at a time. Pick a lesson to start.
      </p>
      <button
        type="button"
        onClick={onSignIn}
        className="
          mt-4 inline-flex items-center gap-2
          font-mono text-xs uppercase tracking-[0.18em]
          px-4 py-2.5 rounded-xl
          bg-sb-ink text-white
          hover:bg-sb-ink/90
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
        "
      >
        Sign in <span aria-hidden>→</span>
      </button>
    </section>
  );
}
