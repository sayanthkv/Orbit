import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const ParallaxSection = ({
  children,
  offset = 40,
  speed = 0.15,
  className = '',
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [-offset * speed * 2, offset * speed * 2]);
  const y = useSpring(rawY, { stiffness: 120, damping: 25 });

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={`relative z-10 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxSection;
