import { useLocation, Outlet } from "react-router-dom";
import { DemoBadge } from "@/components/DemoBadge";
import { useDemoMode } from "@/lib/demoMode";
import { useMutedSync } from "@/platform/audio/useMutedSync";
import { AuthMount } from "@/platform/auth/AuthMount";
import { ExitButton } from "@/platform/ui/ExitButton";
import { MuteToggle } from "@/platform/ui/MuteToggle";
import { UserMenu } from "@/platform/ui/UserMenu";

export default function App() {
  const { enabled: demoMode } = useDemoMode();
  const location = useLocation();
  // Keep Howler's global mute aligned with the persisted store value.
  useMutedSync();

  // Landing page is ink-dark — chrome buttons need surface-aware active state.
  const onLanding = location.pathname === "/";

  return (
    <div className="min-h-[100dvh] w-full">
      <AuthMount />
      <Outlet />
      {/* Global chrome — fixed top-right on every route. Rendered
          outside the Outlet so they persist across transitions and sit
          above overlays. */}
      <UserMenu />
      <ExitButton />
      <MuteToggle surface={onLanding ? "dark" : "light"} />
      {demoMode && <DemoBadge />}
    </div>
  );
}
