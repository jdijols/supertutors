/**
 * CameraGate — permission prompt when camera access is denied.
 *
 * Reuses the visual language from Freddy's CV permission flow.
 * Shows when HandTracker reports 'error' status.
 */
export function CameraGate({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-sb-surface">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sb-ink/5 flex items-center justify-center">
          <CameraIcon />
        </div>
        <h2 className="font-mono font-bold text-xl text-sb-ink mb-2">
          Camera access needed
        </h2>
        <p className="font-sans text-sm text-sb-muted mb-6">
          Sage needs to see your hands to recognize your signs. Please allow
          camera access in your browser settings.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="
            font-mono text-xs uppercase tracking-[0.18em]
            px-5 py-2.5 rounded-xl
            bg-sb-ink text-white
            hover:bg-sb-ink/90
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent
          "
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
