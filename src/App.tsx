import { Outlet } from "react-router-dom";
import { DemoBadge } from "@/components/DemoBadge";
import { useDemoMode } from "@/lib/demoMode";
import { useMutedSync } from "@/modules/audio/useMutedSync";
import { MuteToggle } from "@/modules/ui/MuteToggle";

export default function App() {
  const { enabled: demoMode } = useDemoMode();
  // Keep Howler's global mute aligned with the persisted store value.
  useMutedSync();
  return (
    <div className="min-h-screen w-full">
      <Outlet />
      {/* Global mute toggle — fixed top-right on every route. Rendered
          outside the Outlet so it persists across transitions and sits
          above overlays. */}
      <MuteToggle />
      {demoMode && <DemoBadge />}
    </div>
  );
}
