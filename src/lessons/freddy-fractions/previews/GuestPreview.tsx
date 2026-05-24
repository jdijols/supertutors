import { Guest } from "../scenes/world";
import type { GuestExpression } from "@/store/appStore";

/**
 * GuestPreview — visual test grid for the three guest characters in their
 * three expression states (9 cells total). Renders at `/preview/guests`.
 *
 * Until real PNGs land at `/public/images/characters/guests/*.png`, every
 * cell shows the styled placeholder via `onError` fallback. When assets
 * ship, the placeholders disappear automatically.
 */
const GUESTS: { id: string; displayName: string }[] = [
  { id: "maya", displayName: "Maya" },
  { id: "theo", displayName: "Theo" },
  { id: "nonna", displayName: "Nonna Lucia" },
];

const EXPRESSIONS: GuestExpression[] = ["neutral", "frown", "smile"];

export function GuestPreview() {
  return (
    <main className="min-h-screen w-full bg-sb-surface p-8 text-sb-ink">
      <h1 className="font-mono text-2xl mb-1">Guest preview</h1>
      <p className="font-mono text-sm text-sb-muted mb-8">
        3 guests × 3 expressions. Placeholder renders until real PNGs land at
        <span className="font-mono"> /public/images/characters/guests/</span>.
      </p>
      <div className="grid grid-cols-3 gap-6 max-w-5xl">
        {GUESTS.map(({ id, displayName }) =>
          EXPRESSIONS.map((expression) => (
            <div
              key={`${id}-${expression}`}
              className="bg-sb-card rounded-2xl p-6 flex flex-col items-center"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-3">
                {displayName} · {expression}
              </span>
              <Guest
                id={id}
                expression={expression}
                displayName={displayName}
                className="h-48 w-auto"
              />
            </div>
          )),
        )}
      </div>
    </main>
  );
}
