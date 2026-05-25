/**
 * Builds the warm fraction-label message used by Beat 2 (Sandbox) when the
 * kid slices a piece. Lives in its own file so it doesn't break Vite's
 * react-refresh boundary on Toast.tsx (component files should only export
 * components).
 *
 * - First-time-this-fraction-this-session → warmer copy ("You made halves! 1/2")
 * - Repeat → tighter copy ("Halves! 1/2")
 */
export function fractionToastMessage(
  fraction: "1/2" | "1/4" | "1/8",
  isFirstTime = false,
): string {
  switch (fraction) {
    case "1/2":
      return isFirstTime ? "You made halves! 1/2" : "Halves! 1/2";
    case "1/4":
      return isFirstTime ? "Now quarters! 1/4" : "Quarters! 1/4";
    case "1/8":
      return "Eighths! 1/8";
  }
}
