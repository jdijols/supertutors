interface LaurelMarkProps {
  className?: string;
  /**
   * "onDark" — mark sits on a dark surface (banner): renders white as-is.
   * "onLight" — mark sits on a light surface: invert the asset.
   */
  variant?: "onDark" | "onLight";
  title?: string;
}

/**
 * SuperBuilders laurel mark, reused verbatim per sister-brand convention.
 * Source asset is white-on-transparent; we composite it on a colored frame
 * so the rounded-square reads as a solid mark in both light and dark contexts.
 */
export function LaurelMark({
  className,
  variant = "onDark",
  title = "SuperTutors",
}: LaurelMarkProps) {
  const onDark = variant === "onDark";

  return (
    <div
      role="img"
      aria-label={title}
      className={`relative ${className ?? ""}`}
    >
      <div
        aria-hidden
        className={`absolute inset-0 rounded-[22%] ${
          onDark ? "bg-sb-ink" : "bg-sb-card"
        }`}
      />
      <img
        src="/superbuilders-logo.png"
        alt=""
        aria-hidden
        className="relative w-full h-full"
        style={onDark ? undefined : { filter: "invert(1)" }}
      />
    </div>
  );
}
