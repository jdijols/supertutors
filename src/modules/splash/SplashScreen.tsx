import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";

export function SplashScreen() {
  const setName = useAppStore((s) => s.setName);
  const setCurrentBeat = useAppStore((s) => s.setCurrentBeat);
  const [input, setInput] = useState("");

  const canSubmit = input.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setName(input.trim());
    // Vertical-slice target: jump to AHA beat to wire end-to-end first
    setCurrentBeat("aha");
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-terracotta-100 to-mozzarella-50 grid place-items-center px-6">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div
          aria-hidden
          className="mx-auto w-32 h-32 rounded-full bg-mozzarella-100 grid place-items-center text-7xl mb-6 shadow-lg shadow-terracotta-300/40"
        >
          👨‍🍳
        </div>

        <h1 className="font-display text-4xl text-terracotta-600 mb-2">
          Heyyy, welcome to SuperSlice!
        </h1>
        <p className="text-terracotta-500 text-lg mb-8">
          I'm Freddy. What's your name, kid?
        </p>

        <label htmlFor="name" className="sr-only">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoFocus
          autoComplete="given-name"
          inputMode="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your name"
          className="w-full text-2xl text-center font-display py-4 px-5 rounded-2xl bg-white border-4 border-terracotta-200 focus:border-terracotta-400 focus:outline-none text-terracotta-600 placeholder:text-terracotta-200"
        />

        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.96 } : undefined}
          className="mt-6 w-full py-5 rounded-2xl bg-tomato-500 text-white font-display text-2xl shadow-lg shadow-tomato-500/30 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-tomato-400/40"
        >
          {canSubmit
            ? `Ready to slice some pizza, ${input.trim()}?`
            : "Ready to slice some pizza?"}
        </motion.button>
      </motion.form>
    </main>
  );
}
