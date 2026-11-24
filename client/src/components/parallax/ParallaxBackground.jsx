import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const ParallaxBackground = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.001,
  });

  // Layer 1: Deep ambient glow
  const yGlow1 = useTransform(smoothProgress, [0, 1], ['0px', '160px']);
  const yGlow2 = useTransform(smoothProgress, [0, 1], ['0px', '-140px']);

  // Layer 2: Orbital Wireframe Ring
  const ringRotate = useTransform(smoothProgress, [0, 1], [0, 90]);
  const ringY = useTransform(smoothProgress, [0, 1], ['0px', '100px']);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background Star / Dot Matrix Texture */}
      <div
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(16, 185, 129, 0.25) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px, 96px 96px',
          backgroundPosition: '0 0, 24px 24px',
        }}
      />

      {/* Hardware-accelerated Atmospheric Luminous Nebulae (native radial gradients with zero raster blur overhead) */}
      <motion.div
        className="absolute -top-40 left-1/4 w-[650px] h-[650px] rounded-full pointer-events-none"
        style={{
          y: yGlow1,
          willChange: 'transform',
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)',
        }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          y: yGlow2,
          willChange: 'transform',
          background:
            'radial-gradient(circle, rgba(20, 184, 166, 0.10) 0%, rgba(20, 184, 166, 0.03) 45%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-10 left-10 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.02) 45%, transparent 70%)',
        }}
      />

      {/* Layer 2: Cosmic Orbital Concentric Rings */}
      <motion.div
        style={{
          y: ringY,
          rotate: ringRotate,
          willChange: 'transform',
        }}
        className="absolute top-12 -right-24 md:right-10 w-[480px] h-[480px] md:w-[620px] md:h-[620px] rounded-full border border-emerald-500/15 dark:border-emerald-500/10 pointer-events-none"
      >
        <div className="absolute inset-8 rounded-full border border-dashed border-emerald-500/10 dark:border-white/5" />
        <div className="absolute inset-24 rounded-full border border-emerald-500/10 dark:border-white/[0.03]" />

        {/* Floating Orbital Node */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500/40 shadow-lg shadow-emerald-500/40">
          <div className="w-2 h-2 m-1 rounded-full bg-emerald-400" />
        </div>
        <div className="absolute bottom-1/4 -right-1 w-3 h-3 rounded-full bg-cyan-400/40 shadow-md shadow-cyan-400/40">
          <div className="w-1.5 h-1.5 m-[3px] rounded-full bg-cyan-300" />
        </div>
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
