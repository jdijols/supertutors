import { motion } from 'framer-motion';

type Props = {
  x: number;
  y: number;
  onDone: () => void;
};

// 12 particles spread across 360°
const ANGLES = Array.from({ length: 12 }, (_, i) => (i * Math.PI * 2) / 12);
const COLORS = ['#f5e6c8', '#ff8c42', '#e8d5b7', '#d4a853', '#ffffff'];

/**
 * SliceBurst — a burst of 12 particles flying outward from a cut point.
 * Each particle is a small colored dot animated with Framer Motion.
 * Calls onDone after the animation so the parent can unmount it.
 */
export function SliceBurst({ x, y, onDone }: Props) {
  return (
    <>
      {ANGLES.map((angle, i) => {
        const speed = 30 + (i % 3) * 20; // 30, 50, or 70px
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const color = COLORS[i % COLORS.length];
        const size = 4 + (i % 3) * 2; // 4, 6, or 8px

        return (
          <motion.div
            key={i}
            initial={{ x, y, scale: 1, opacity: 0.95 }}
            animate={{ x: x + dx, y: y + dy, scale: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            // Only the last particle calls onDone
            onAnimationComplete={i === ANGLES.length - 1 ? onDone : undefined}
            style={{
              position: 'fixed',
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              pointerEvents: 'none',
              zIndex: 60,
              translateX: '-50%',
              translateY: '-50%',
            }}
          />
        );
      })}
    </>
  );
}
