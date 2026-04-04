import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

function MagicalCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trail, setTrail] = useState([]);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Add trail point (reduced for less blinking)
      setTrail(prev => [...prev.slice(-8), { x: e.clientX, y: e.clientY, id: Date.now() }]);
      
      // Random sparkles (reduced frequency)
      if (Math.random() > 0.85) {
        setSparkles(prev => [...prev.slice(-5), { 
          x: e.clientX + (Math.random() - 0.5) * 20, 
          y: e.clientY + (Math.random() - 0.5) * 20, 
          id: Date.now() + Math.random(),
          color: ['#60A5FA', '#A78BFA', '#F472B6', '#34D399'][Math.floor(Math.random() * 4)]
        }]);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleElementHover = (e) => {
      if (e.target.closest('button, a, input, textarea, [role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleElementHover);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleElementHover);
    };
  }, []);

  return (
    <>
      {/* Trail Effect - Reduced opacity */}
      {trail.map((point, index) => (
        <motion.div
          key={point.id}
          className="fixed pointer-events-none z-[9990] rounded-full hidden md:block"
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            left: point.x - 3,
            top: point.y - 3,
            width: 6,
            height: 6,
            background: `radial-gradient(circle, rgba(96, 165, 250, ${0.3 - index * 0.03}) 0%, transparent 70%)`,
          }}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="fixed pointer-events-none z-[9995] hidden md:block"
          initial={{ opacity: 1, scale: 0, rotate: 0 }}
          animate={{ opacity: 0, scale: 1.2, rotate: 180 }}
          transition={{ duration: 0.6 }}
          style={{ left: sparkle.x - 3, top: sparkle.y - 3 }}
        >
          <Star size={6} fill={sparkle.color} color={sparkle.color} />
        </motion.div>
      ))}

      {/* Outer Glow Ring - No blinking, smooth glow */}
      <motion.div
        className="fixed pointer-events-none z-[9997] rounded-full hidden md:block"
        animate={{ 
          x: position.x - 25, 
          y: position.y - 25,
          scale: isHovering ? 1.2 : isClicking ? 0.9 : 1,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
        style={{
          width: 50,
          height: 50,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />

      {/* Middle Ring - Smooth rotation */}
      <motion.div
        className="fixed pointer-events-none z-[9998] rounded-full border-2 border-purple-400/40 hidden md:block"
        animate={{ 
          x: position.x - 16, 
          y: position.y - 16,
          scale: isHovering ? 1.3 : isClicking ? 0.95 : 1,
          rotate: isHovering ? 90 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          width: 32,
          height: 32,
        }}
      />

      {/* Inner Ring */}
      <motion.div
        className="fixed pointer-events-none z-[9998] rounded-full border border-blue-400/60 hidden md:block"
        animate={{ 
          x: position.x - 10, 
          y: position.y - 10,
          scale: isHovering ? 0.9 : isClicking ? 1.1 : 1,
          rotate: isHovering ? -45 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 20,
          height: 20,
        }}
      />

      {/* Core Dot with Stable Glow */}
      <motion.div
        className="fixed pointer-events-none z-[9999] rounded-full hidden md:block"
        animate={{ 
          x: position.x - 5, 
          y: position.y - 5,
          scale: isHovering ? 1.8 : isClicking ? 0.7 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          width: 10,
          height: 10,
          background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F472B6 100%)',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.6), 0 0 30px rgba(96, 165, 250, 0.3)',
        }}
      />
    </>
  );
}

export default MagicalCursor;
