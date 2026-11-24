import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const ParallaxCard = ({
  children,
  className = '',
  depth = 10,
  interactive = true,
  onClick,
}) => {
  const cardRef = useRef(null);

  // Raw motion values operating completely outside the React render loop (0 component re-renders!)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Smooth hardware-accelerated springs
  const smoothX = useSpring(x, { stiffness: 280, damping: 22, mass: 0.4 });
  const smoothY = useSpring(y, { stiffness: 280, damping: 22, mass: 0.4 });

  const rotateX = useTransform(smoothY, [0, 1], [depth, -depth]);
  const rotateY = useTransform(smoothX, [0, 1], [-depth, depth]);
  const glareOpacity = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!interactive || !cardRef.current) return;
    // Don't calculate tilt on touch screens or if reduced motion is preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) / rect.width;
    const clientY = (e.clientY - rect.top) / rect.height;

    x.set(clientX);
    y.set(clientY);
    glareOpacity.set(0.12);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`relative rounded-3xl overflow-hidden transition-shadow duration-300 ${className}`}
    >
      {/* Glare Sheen Reflection Layer (Pure GPU opacity transition) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: glareOpacity,
          background:
            'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
        }}
      />

      {/* Content wrapper with slight 3D elevation */}
      <div style={{ transform: 'translateZ(6px)' }} className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export default ParallaxCard;
