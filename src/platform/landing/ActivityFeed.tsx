import { useEffect, useState } from "react";
import type { Attempt, ProgressHandle } from "@/platform/progress/types";

/**
 * ActivityFeed — compact list of recent practice attempts.
 * Shown only for signed-in users on the dashboard.
 */
export function ActivityFeed({
  progress,
}: {
  progress: ProgressHandle;
}) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progress
      .getRecentActivity(10)
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, [progress]);

  if (loading) {
    return (
      <div className="h-12 flex items-center">
        <span className="font-mono text-xs text-sb-muted animate-pulse">
          Loading activity...
        </span>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <section aria-label="Recent activity">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-3">
          Recent activity
        </h3>
        <p className="font-sans text-sm text-sb-muted/70">
          No practice sessions yet. Pick a lesson to start!
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Recent activity">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-3">
        Recent activity
      </h3>
      <ul className="space-y-1.5">
        {attempts.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-2 text-sm font-sans text-sb-ink"
          >
            <ResultIcon result={a.result} />
            <span className="truncate">
              <span className="font-medium">
                {formatItemName(a.itemId)}
              </span>
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-sb-muted whitespace-nowrap">
              {formatLesson(a.itemId)}
            </span>
            <span className="font-mono text-[10px] text-sb-muted/60 whitespace-nowrap">
              {formatTime(a.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultIcon({ result }: { result: string }) {
  switch (result) {
    case "pass":
      return <span className="text-green-600 text-xs" aria-label="Passed">✓</span>;
    case "fail":
      return <span className="text-red-500 text-xs" aria-label="Failed">✗</span>;
    case "skip":
      return <span className="text-sb-muted text-xs" aria-label="Skipped">–</span>;
    default:
      return <span className="text-yellow-500 text-xs" aria-label="Uncertain">?</span>;
  }
}

function formatItemName(itemId: string): string {
  // "asl:HELLO" → "Hello", "freddy:fractions-equivalence" → "Equivalent Fractions"
  const raw = itemId.split(":")[1] ?? itemId;
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLesson(itemId: string): string {
  const prefix = itemId.split(":")[0];
  if (prefix === "asl") return "ASL";
  if (prefix === "freddy") return "Freddy";
  return prefix;
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
