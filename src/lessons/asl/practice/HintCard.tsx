import type { Sign } from "../vocab";
import {
  HandshapeIcon,
  LocationIcon,
  MovementIcon,
  PalmOrientationIcon,
} from "./PhonologyIcon";

/**
 * HintCard — phonological breakdown of the target sign.
 *
 * Four-quadrant grid: Handshape, Location, Movement, Palm Orientation.
 * When an observed sign is available (classifier returned a different
 * known class), shows comparison framing. Otherwise shows general guidance.
 */
export function HintCard({
  targetSign,
  observedSign,
}: {
  targetSign: Sign;
  observedSign?: Sign | null;
}) {
  const phon = targetSign.phonology;

  // Fallback if the target sign doesn't have phonology (shouldn't happen
  // for trained signs, but defensive)
  if (!phon) {
    return (
      <div
        data-testid="hint-card"
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md"
      >
        <div className="bg-sb-card/95 backdrop-blur-sm rounded-2xl border border-sb-border shadow-xl shadow-sb-ink/10 px-5 py-4">
          <p className="font-sans text-sm text-sb-muted text-center">
            Keep trying! Watch your hand shape carefully.
          </p>
        </div>
      </div>
    );
  }

  const comparison =
    observedSign?.phonology && observedSign.id !== targetSign.id;

  return (
    <div
      data-testid="hint-card"
      className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md"
    >
      <div className="bg-sb-card/95 backdrop-blur-sm rounded-2xl border border-sb-border shadow-xl shadow-sb-ink/10 px-5 py-4">
        {comparison && (
          <p className="font-sans text-xs text-sb-muted mb-3 text-center">
            You signed <span className="font-bold text-sb-ink">{observedSign!.glyph}</span>
            {" — "}here&apos;s how <span className="font-bold text-sb-ink">{targetSign.glyph}</span> differs:
          </p>
        )}

        {!comparison && (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted mb-3 text-center">
            How to sign {targetSign.glyph}
          </p>
        )}

        {/* Four-quadrant grid */}
        <div className="grid grid-cols-2 gap-2">
          <PhonologyCell
            icon={<HandshapeIcon className="text-sb-ink" />}
            label="Handshape"
            value={phon.handshape}
          />
          <PhonologyCell
            icon={<LocationIcon className="text-sb-ink" />}
            label="Location"
            value={phon.location}
          />
          <PhonologyCell
            icon={<MovementIcon className="text-sb-ink" />}
            label="Movement"
            value={phon.movement}
          />
          <PhonologyCell
            icon={<PalmOrientationIcon className="text-sb-ink" />}
            label="Palm"
            value={phon.palmOrientation}
          />
        </div>

      </div>
    </div>
  );
}

function PhonologyCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-sb-surface/60 px-3 py-2">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-sb-muted">
          {label}
        </p>
        <p className="font-sans text-xs text-sb-ink leading-snug">{value}</p>
      </div>
    </div>
  );
}
