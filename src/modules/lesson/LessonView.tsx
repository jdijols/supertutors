import { useAppStore } from "@/store/appStore";
import { SplashScreen } from "@/modules/splash/SplashScreen";
import { Table } from "@/modules/table/Table";
import { ChatPanel } from "@/modules/tutor/ChatPanel";

export function LessonView() {
  const name = useAppStore((s) => s.name);

  if (!name) {
    return <SplashScreen />;
  }

  return (
    <main className="min-h-screen w-full bg-mozzarella-50 grid grid-cols-1 md:grid-cols-[1fr_360px]">
      <Table />
      <ChatPanel />
    </main>
  );
}
