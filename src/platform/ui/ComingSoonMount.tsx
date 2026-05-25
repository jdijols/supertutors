import type { LessonMountProps } from "@/platform/lesson-sdk";

interface Props extends LessonMountProps {
  tutorName: string;
  subject: string;
  tagline?: string;
}

export function ComingSoonMount({ tutorName, subject, tagline, onComplete }: Props) {
  return (
    <main className="h-[100dvh] w-full bg-sb-surface font-sans text-sb-ink antialiased flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-sb-card border border-sb-border rounded-[22px] p-10 flex flex-col items-center gap-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-muted px-3 py-1.5 border border-sb-border rounded-full">
          Coming Soon
        </span>
        <div>
          <h1 className="font-mono font-bold text-[32px] leading-[1.0] tracking-[-0.02em] text-sb-ink">
            {subject}
          </h1>
          <p className="mt-2 text-[15px] text-sb-muted">
            with <span className="text-sb-ink font-medium">{tutorName}</span>
          </p>
          {tagline && (
            <p className="mt-4 text-[13px] leading-[1.5] text-sb-muted max-w-[30ch] mx-auto">
              {tagline}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onComplete({ outcome: "exit", durationMs: 0 })}
          className="font-mono text-[12px] uppercase tracking-[0.18em] text-sb-ink px-5 py-2.5 rounded-full border border-sb-border hover:bg-sb-surface transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface"
        >
          ← Back
        </button>
      </div>
    </main>
  );
}
