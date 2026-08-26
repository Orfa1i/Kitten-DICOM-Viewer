import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const DashboardBackground: React.FC = () => {
  // 1. Mouse-reactive particles
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Transform mouse position to subtle translations for the background dots
  const particlesX = useTransform(springX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-15, 15]);
  const particlesY = useTransform(springY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [-15, 15]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#FDF9F9]">
      
      {/* 2. Ambient Gradient Blobs (Soft orange and cream) */}
      <motion.div 
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#FFF3E0]/40 to-[#FFE0B2]/20 blur-[120px]"
      />
      <motion.div 
        animate={{
          x: [0, -40, 50, 0],
          y: [0, 60, -30, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-[#FFE8D6]/30 to-[#FAD4C0]/20 blur-[140px]"
      />
      <motion.div 
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-b from-[#FFFDF0]/40 to-transparent blur-[100px]"
      />

      {/* 1. Subtle, slow-moving Interactive Particle Background (Soft grey dots) */}
      <motion.div 
        style={{ x: particlesX, y: particlesY }}
        className="absolute inset-[-50px] opacity-[0.25]"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#888888" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </motion.div>

      {/* 3. Telemetry Stream animation */}
      <div className="absolute inset-0 flex flex-col justify-evenly opacity-[0.05]">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`telemetry-${i}`}
            className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#8D321F] to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 8,
            }}
          />
        ))}
      </div>
    </div>
  );
};
