import { useAppStore } from "@/store/appStore";

export function ChatPanel() {
  const name = useAppStore((s) => s.name);
  return (
    <aside
      aria-label="Freddy chat"
      className="bg-white border-l border-terracotta-100 p-6 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          aria-hidden
          className="w-12 h-12 rounded-full bg-mozzarella-100 grid place-items-center text-2xl"
        >
          👨‍🍳
        </div>
        <div>
          <div className="font-display text-lg text-terracotta-600">
            Freddy Fractions
          </div>
          <div className="text-xs text-terracotta-400">
            SuperSlice Pizza · your tutor
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        <div className="bg-mozzarella-100 rounded-2xl rounded-tl-sm p-4 text-terracotta-600 max-w-[85%]">
          Heyyy {name}! Welcome to the kitchen. Dialogue will render here.
        </div>
      </div>

      <p className="mt-4 text-xs text-terracotta-300">
        Audio + XState dialogue wiring is stubbed; populated when Beat 5 is
        exported from Stately.
      </p>
    </aside>
  );
}
