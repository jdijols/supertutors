/**
 * Small "DEMO" badge that surfaces in the corner whenever demo mode is on
 * (CC.1). Lets us see at a glance whether keyboard shortcuts are armed.
 * Pointer-events off — never steals input from the underlying UI.
 */
export function DemoBadge() {
  return (
    <div
      data-testid="demo-mode-badge"
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-none select-none rounded-full bg-sb-ink/85 text-sb-paper-soft px-3 py-1 text-[10px] font-mono uppercase tracking-widest shadow-lg"
      aria-hidden="true"
    >
      Demo · 1–8 jump · Shift+R reset
    </div>
  );
}
