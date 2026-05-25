import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = [
  '#f5e6c8', // mozzarella cream
  '#ff8c42', // oven glow
  '#ff8c42',
  '#4caf50', // basil green
  '#e85d4a', // terracotta
  '#d4a853', // golden
  '#ffffff',
  '#f5e6c8',
  '#ff8c42',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface Particle {
  id: number;
  x: number;
  dx: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  isRect: boolean;
}

const PARTICLES: Particle[] = Array.from({ length: 55 }, (_, i) => {
  const rng = seededRandom(i * 7919 + 1234);
  return {
    id: i,
    x: rng() * 100,
    dx: (rng() - 0.5) * 22,
    delay: rng() * 0.7,
    duration: 1.5 + rng() * 1.0,
    color: COLORS[Math.floor(rng() * COLORS.length)],
    size: 4 + Math.floor(rng() * 7),
    rotate: (rng() - 0.5) * 720,
    isRect: rng() > 0.45,
  };
});

export interface WinConfettiProps {
  active: boolean;
  onDone: () => void;
  durationMs?: number;
}

export function WinConfetti({ active, onDone, durationMs = 2800 }: WinConfettiProps) {
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [active, durationMs, onDone]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          data-testid="win-confetti"
          className="fixed inset-0 z-[65] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {/* Big "YOU DID IT!" text burst — scales in then fades */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.1, 1, 1.04], opacity: [0, 1, 1, 0] }}
            transition={{ duration: durationMs / 1000, times: [0, 0.22, 0.55, 1], ease: 'easeOut' }}
            aria-label="You did it!"
          >
            <span
              className="font-bold select-none text-[13vw] md:text-[9vw] drop-shadow-[0_8px_32px_rgba(26,26,26,0.4)]"
              style={{ color: '#ff8c42', textShadow: '0 0 40px rgba(255,140,66,0.6)' }}
            >
              🍕
            </span>
          </motion.div>

          {/* Confetti particles falling from the top */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              aria-hidden
              style={{
                position: 'absolute',
                left: `${p.x}vw`,
                top: 0,
                width: p.isRect ? p.size * 2.2 : p.size,
                height: p.size,
                borderRadius: p.isRect ? 2 : '50%',
                background: p.color,
              }}
              initial={{ y: '-8vh', x: 0, rotate: 0, opacity: 1 }}
              animate={{
                y: '108vh',
                x: `${p.dx}vw`,
                rotate: p.rotate,
                opacity: [1, 1, 0.4, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.15, 0.85, 0.45, 1],
                opacity: { times: [0, 0.6, 0.85, 1] },
              }}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
