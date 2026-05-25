import { LaurelMark } from "./LaurelMark";

type LockupVariant = "onDark" | "onLight";

interface SuperTutorsLockupProps {
  variant?: LockupVariant;
  className?: string;
  size?: "sm" | "md" | "lg" | "inline";
  /** Render the EDU/ACC subtag below the wordmark. Off by default. */
  showSubtag?: boolean;
}

const SIZE_CLASSES: Record<
  NonNullable<SuperTutorsLockupProps["size"]>,
  { line1: string; line2: string; mark: string; gap: string }
> = {
  // Inline: laurel mark is the same height as a chrome button (w-14 h-14 sm:w-16 sm:h-16).
  // Wordmark sits baseline-aligned on a single horizontal axis with the mark.
  inline: {
    line1: "text-[28px] sm:text-[32px] md:text-[36px]",
    line2: "text-[14px] sm:text-[16px] md:text-[18px]",
    mark: "w-14 h-14 sm:w-16 sm:h-16",
    gap: "gap-3 sm:gap-4",
  },
  sm: {
    line1: "text-[28px] sm:text-[32px]",
    line2: "text-[14px] sm:text-[16px]",
    mark: "w-10 h-10 sm:w-12 sm:h-12",
    gap: "gap-3 sm:gap-4",
  },
  md: {
    line1: "text-[44px] sm:text-[56px] md:text-[68px]",
    line2: "text-[22px] sm:text-[28px] md:text-[34px]",
    mark: "w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24",
    gap: "gap-5 sm:gap-7 md:gap-9",
  },
  lg: {
    // Tuned so the full lockup fits at iPad portrait (820w) without overflow
    // while still scaling up convincingly on iPad Pro landscape. Mobile
    // size is intentionally compact — the landing banner reserves the
    // top-right corner for the info + mute chrome buttons.
    line1: "text-[22px] sm:text-[44px] md:text-[60px] lg:text-[100px]",
    line2: "text-[12px] sm:text-[22px] md:text-[30px] lg:text-[50px]",
    mark: "w-9 h-9 sm:w-14 sm:h-14 md:w-18 md:h-18 lg:w-28 lg:h-28",
    gap: "gap-2 sm:gap-4 md:gap-6 lg:gap-10",
  },
};

export function SuperTutorsLockup({
  variant = "onDark",
  className,
  size = "lg",
  showSubtag = false,
}: SuperTutorsLockupProps) {
  const isOnDark = variant === "onDark";
  const inkHex = isOnDark ? "#FFFFFF" : "#1A1A1A";
  const textClass = isOnDark ? "text-white" : "text-sb-ink";
  const sizes = SIZE_CLASSES[size];

  // Thinner stroke + paint-order keeps the outline crisp without doubling the
  // interior contours as visibly as a heavier stroke would.
  const outlineStyle: React.CSSProperties = {
    WebkitTextStrokeWidth: "1px",
    WebkitTextStrokeColor: inkHex,
    WebkitTextFillColor: "transparent",
    paintOrder: "stroke fill",
  };

  return (
    <div
      className={`flex items-center ${sizes.gap} ${className ?? ""}`}
      aria-label="SuperTutors"
    >
      <LaurelMark className={`shrink-0 ${sizes.mark}`} variant={variant} />
      <div className={`font-mono font-bold leading-[0.92] tracking-[-0.02em] ${textClass}`}>
        <div className={sizes.line1}>
          <span>SUPER</span>
          <span style={outlineStyle}>TUTORS</span>
        </div>
        {showSubtag && (
          <div className={`${sizes.line2} mt-[0.15em]`}>
            <span>EDU/</span>
            <span style={outlineStyle}>ACC</span>
          </div>
        )}
      </div>
    </div>
  );
}
