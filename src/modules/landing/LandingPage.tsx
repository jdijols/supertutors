import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TutorCard } from "./TutorCard";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen w-full bg-portal-50 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="w-10 h-10 rounded-xl bg-portal-500 grid place-items-center text-white font-display text-xl"
          >
            S
          </div>
          <div>
            <h1 className="font-display text-2xl text-portal-900 leading-none">
              SuperTutors
            </h1>
            <p className="text-portal-500 text-sm">
              AI tutors for kids who love to learn
            </p>
          </div>
        </div>
      </header>

      <section className="flex-1 grid place-items-center px-6">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-4xl md:text-5xl text-portal-900 mb-3">
              Pick a tutor. Learn something.
            </h2>
            <p className="text-portal-500 text-lg">
              Each tutor is an expert in one subject — and a friend.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TutorCard
              title="Learn Fractions with Freddy"
              subtitle="Freddy Fractions · SuperSlice Pizza"
              available
              onActivate={() => navigate("/lesson")}
            />
            <TutorCard
              title="Coming soon"
              subtitle="Reading with ?"
              available={false}
            />
            <TutorCard
              title="Coming soon"
              subtitle="Science with ?"
              available={false}
            />
          </div>
        </div>
      </section>

      <footer className="px-8 py-4 text-portal-500 text-xs">
        SuperTutors · Week 4 Gauntlet challenger project
      </footer>
    </main>
  );
}
