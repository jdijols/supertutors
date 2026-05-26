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

  // Routes that compose chrome inline in their own header row. We skip
  // the global fixed-positioned chrome on these to avoid double-render.
  // /og-image is the offline OG-image rasterization route — chrome must
  // never render there or it shows up in the shared social card.
  const onAcutis = location.pathname === "/lessons/acutis";
  const onWorkflow = location.pathname === "/workflow";
  const onOgImage = location.pathname === "/og-image";
  const inlineChrome = onLanding || onAcutis || onWorkflow || onOgImage;

  return (
    <div className="min-h-[100dvh] w-full">
      <AuthMount />
      <Outlet />
      {/* Global chrome — fixed top-right on routes that don't compose
          their own header. LandingPage and BrainliftViewer render their
          own inline copies. */}
      {!inlineChrome && <UserMenu />}
      {!inlineChrome && <ExitButton />}
      {!inlineChrome && <MuteToggle surface={onLanding ? "dark" : "light"} />}
      {demoMode && <DemoBadge />}
    </div>
  );
}
