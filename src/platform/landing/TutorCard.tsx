import { motion } from "framer-motion";

interface TutorCardProps {
  title: string;
  subtitle: string;
  available?: boolean;
  onActivate?: () => void;
}

export function TutorCard({
  title,
  subtitle,
  available = false,
  onActivate,
}: TutorCardProps) {
  if (!available) {
    return (
      <div
        aria-disabled
        className="rounded-3xl bg-portal-100 border-2 border-dashed border-portal-200 p-6 min-h-[260px] flex flex-col justify-end text-portal-900"
      >
        <div
          aria-hidden="true"
          role="presentation"
          className="aspect-[4/3] w-full rounded-2xl bg-portal-50 mb-4"
        />
        <div className="font-display text-xl">{title}</div>
        <div className="text-sm">{subtitle}</div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onActivate}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="text-left rounded-3xl bg-mozzarella-50 border-2 border-terracotta-200 p-6 min-h-[260px] flex flex-col justify-end shadow-lg shadow-terracotta-200/30 focus:outline-none focus:ring-4 focus:ring-terracotta-300"
    >
      <div
        aria-hidden
        className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-tomato-400 to-oven-glow mb-4 grid place-items-center text-6xl"
      >
        🍕
      </div>
      <div className="font-display text-2xl text-terracotta-600">{title}</div>
      <div className="text-terracotta-500 text-sm mt-1">{subtitle}</div>
    </motion.button>
  );
}
