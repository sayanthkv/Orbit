import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export const ScrollProgressIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 origin-left z-50 pointer-events-none"
    />
  );
};

export default ScrollProgressIndicator;
