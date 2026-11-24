import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const ParallaxSection = ({
  children,
  offset = 24,
  speed = 0.08,
  className = '',
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Direct transform calculation without running heavy spring simulation loops per section
  const y = useTransform(scrollYProgress, [0, 1], [-offset * speed * 2, offset * speed * 2]);

  return (
    <motion.div
      ref={ref}
      style={{ y, willChange: 'transform' }}
      className={`relative z-10 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxSection;
