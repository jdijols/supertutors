import { useAppStore } from "@/store/appStore";

export function Table() {
  const name = useAppStore((s) => s.name);
  const currentBeat = useAppStore((s) => s.currentBeat);

  return (
    <section
      aria-label="Lesson workspace"
      className="relative bg-mozzarella-100 min-h-screen p-8 flex flex-col items-center justify-center text-center"
    >
      <div className="max-w-md">
        <div className="text-7xl mb-4">🍕</div>
        <h2 className="font-display text-3xl text-terracotta-600 mb-2">
          Workspace ready, {name}.
        </h2>
        <p className="text-terracotta-500">
          Current beat: <strong>{currentBeat}</strong>
        </p>
        <p className="text-terracotta-600 mt-3 text-sm">
          Manipulative (pizza + slicer + glove + guests) will render here. This
          is a scaffold placeholder — Beat 5 (AHA) is the first to be wired
          end-to-end via Stately → exported XState machine.
        </p>
      </div>
    </section>
  );
}
