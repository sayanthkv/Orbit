import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const ParallaxBackground = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Layer 1: Deep ambient glow (moves slowest)
  const yGlow1 = useTransform(smoothProgress, [0, 1], ['0px', '220px']);
  const yGlow2 = useTransform(smoothProgress, [0, 1], ['0px', '-180px']);
  const opacityGlow = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1, 0.7]);

  // Layer 2: Orbital Wireframe Ring & Floating Astrolabe (rotates and translates with scroll)
  const ringRotate = useTransform(smoothProgress, [0, 1], [0, 120]);
  const ringScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.1, 0.95]);
  const ringY = useTransform(smoothProgress, [0, 1], ['0px', '140px']);

  // Layer 3: Secondary orbital drift
  const driftY = useTransform(smoothProgress, [0, 1], ['0px', '-100px']);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background Star / Dot Matrix Texture */}
      <div
        className="absolute inset-0 opacity-[0.25] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px, 80px 80px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Atmospheric Luminous Nebulae (Emerald + Slate/Teal) */}
      <motion.div
        style={{ y: yGlow1, opacity: opacityGlow }}
        className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.07] blur-[120px]"
      />
      <motion.div
        style={{ y: yGlow2, opacity: opacityGlow }}
        className="absolute top-1/2 -right-32 w-[550px] h-[550px] rounded-full bg-teal-500/10 dark:bg-teal-500/[0.06] blur-[140px]"
      />
      <motion.div
        style={{ y: driftY }}
        className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/[0.05] blur-[110px]"
      />

      {/* Layer 2: Cosmic Orbital Concentric Rings */}
      <motion.div
        style={{ y: ringY, rotate: ringRotate, scale: ringScale }}
        className="absolute top-12 -right-24 md:right-10 w-[480px] h-[480px] md:w-[620px] md:h-[620px] rounded-full border border-emerald-500/15 dark:border-emerald-500/10"
      >
        <div className="absolute inset-8 rounded-full border border-dashed border-emerald-500/10 dark:border-white/5" />
        <div className="absolute inset-24 rounded-full border border-emerald-500/10 dark:border-white/[0.03]" />
        
        {/* Floating Orbital Node */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500/40 blur-xs shadow-lg shadow-emerald-500/50">
          <div className="w-2 h-2 m-1 rounded-full bg-emerald-400" />
        </div>
        <div className="absolute bottom-1/4 -right-1 w-3 h-3 rounded-full bg-cyan-400/40 blur-xs shadow-md shadow-cyan-400/50">
          <div className="w-1.5 h-1.5 m-[3px] rounded-full bg-cyan-300" />
        </div>
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
