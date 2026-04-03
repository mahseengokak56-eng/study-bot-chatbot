import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, Zap, Brain, MessageSquare, BookOpen, Star, Cpu, Globe, ChevronDown, Bot, Code2, Database, Rocket, Lightbulb, Target } from 'lucide-react';

// ==========================================
// MAGICAL CURSOR COMPONENT - FIXED
// ==========================================
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

// ==========================================
// FLOATING ORB COMPONENT
// ==========================================
function FloatingOrb({ color, size, x, y, duration, delay }) {
  return (
    <motion.div
      className={`absolute rounded-full ${color} blur-3xl opacity-25 pointer-events-none`}
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        x: [0, 80, -40, 0],
        y: [0, -60, 30, 0],
        scale: [1, 1.2, 0.95, 1],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ==========================================
// PARTICLE COMPONENT
// ==========================================
function Particle({ delay, duration, startX, startY }) {
  const colors = ['bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-cyan-400'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      className={`absolute w-1.5 h-1.5 ${color} rounded-full pointer-events-none`}
      style={{ left: startX, top: startY }}
      animate={{
        y: [0, -200, -400, -200, 0],
        x: [0, 30, -20, 10, 0],
        opacity: [0, 0.8, 0.8, 0.4, 0],
        scale: [0, 1.2, 1, 0.6, 0],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ==========================================
// ANIMATED TEXT COMPONENT
// ==========================================
function AnimatedText({ text, className, delay = 0 }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay }}
    >
      {text}
    </motion.span>
  );
}

// ==========================================
// GLOWING TEXT COMPONENT
// ==========================================
function GlowingText({ text, className, delay = 0 }) {
  return (
    <motion.span
      className={`${className} relative inline-block font-bold`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {text}
    </motion.span>
  );
}

// ==========================================
// 3D TILT CARD COMPONENT
// ==========================================
function TiltCard({ children, className, delay = 0 }) {
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-mouseY * 10);
    rotateY.set(mouseX * 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      className={`${className} relative group`}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-60 blur-lg transition-all duration-500" />
      
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all h-full">
        {children}
      </div>
    </motion.div>
  );
}

// ==========================================
// FLOATING ICON COMPONENT
// ==========================================
function FloatingIcon({ Icon, x, y, delay, color }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -15, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm ${color}`}>
        <Icon size={20} />
      </div>
    </motion.div>
  );
}

// ==========================================
// MAIN LANDING PAGE
// ==========================================
function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');

  const floatingIcons = [
    { Icon: Bot, x: '5%', y: '20%', delay: 0, color: 'text-blue-400' },
    { Icon: Code2, x: '90%', y: '15%', delay: 0.5, color: 'text-purple-400' },
    { Icon: Database, x: '85%', y: '70%', delay: 1, color: 'text-green-400' },
    { Icon: Cpu, x: '8%', y: '75%', delay: 1.5, color: 'text-yellow-400' },
    { Icon: Globe, x: '15%', y: '45%', delay: 2, color: 'text-cyan-400' },
    { Icon: Rocket, x: '80%', y: '40%', delay: 2.5, color: 'text-pink-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative cursor-none">
      <MagicalCursor />

      {/* ==========================================
          BACKGROUND EFFECTS
      ========================================== */}
      
      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb color="bg-blue-600" size={500} x="-5%" y="-5%" duration={25} delay={0} />
        <FloatingOrb color="bg-purple-600" size={400} x="75%" y="65%" duration={22} delay={2} />
        <FloatingOrb color="bg-pink-500" size={350} x="40%" y="40%" duration={20} delay={4} />
        <FloatingOrb color="bg-cyan-500" size={300} x="80%" y="5%" duration={28} delay={1} />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.6}
            duration={12 + Math.random() * 4}
            startX={`${Math.random() * 100}%`}
            startY={`${Math.random() * 100}%`}
          />
        ))}
      </div>

      {/* Floating Icons */}
      {floatingIcons.map((item, index) => (
        <FloatingIcon key={index} {...item} />
      ))}

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT SIDE - BRANDING */}
            <div className="text-center lg:text-left">
              {/* Logo */}
              <motion.div
                className="flex items-center justify-center lg:justify-start gap-3 mb-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Sparkles size={24} className="text-white" />
                </motion.div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  EduNova AI
                </span>
              </motion.div>

              {/* Main Heading - TIGHT SPACING */}
              <h1 className="text-5xl lg:text-6xl font-bold mb-5" style={{ lineHeight: 1 }}>
                <AnimatedText text="Your AI" delay={0.2} />
                <br />
                <GlowingText 
                  text="Study" 
                  className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                  delay={0.4}
                />
                <br />
                <AnimatedText text="Companion" delay={0.6} />
              </h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg text-gray-300 mb-6 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Experience the future of learning with our{' '}
                <motion.span
                  className="text-blue-400 font-semibold"
                  animate={{ 
                    color: ['#60A5FA', '#A78BFA', '#60A5FA'],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ML-powered
                </motion.span>{' '}
                chatbot
              </motion.p>

              {/* Stats */}
              <motion.div
                className="flex flex-wrap justify-center lg:justify-start gap-5 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {[
                  { value: '95%', label: 'Accuracy', color: 'text-blue-400' },
                  { value: '<1s', label: 'Response', color: 'text-purple-400' },
                  { value: '24/7', label: 'Available', color: 'text-pink-400' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Tech Pills */}
              <motion.div
                className="flex flex-wrap justify-center lg:justify-start gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                {['FastAPI', 'React', 'ML', 'AI', 'MongoDB'].map((tech, i) => (
                  <motion.span
                    key={tech}
                    className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-full text-gray-300 hover:bg-white/10 hover:border-purple-500/30 transition-all"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + i * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {tech}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* RIGHT SIDE - AUTH CARD */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-md mx-auto"
            >
              <TiltCard delay={0.5}>
                {/* Tab Switcher */}
                <div className="flex mb-5 bg-black/20 rounded-xl p-1 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"
                    initial={false}
                    animate={{ 
                      x: activeTab === 'register' ? '4px' : 'calc(100% - 4px)', 
                      width: 'calc(50% - 8px)',
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                  
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2.5 rounded-lg font-medium relative z-10 transition-colors text-sm ${
                      activeTab === 'register' ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                  <button
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-2.5 rounded-lg font-medium relative z-10 transition-colors text-sm ${
                      activeTab === 'login' ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Login
                  </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'register' ? (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        whileHover={{ rotate: 360 }}
                      >
                        <Rocket size={28} className="text-white" />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold mb-1 text-center">Create Account</h3>
                      <p className="text-gray-400 text-sm mb-4 text-center">Start your learning journey</p>
                      
                      <motion.button
                        onClick={() => navigate('/register')}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>Get Started</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        whileHover={{ rotate: -360 }}
                      >
                        <Shield size={28} className="text-white" />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold mb-1 text-center">Welcome Back</h3>
                      <p className="text-gray-400 text-sm mb-4 text-center">Continue your learning session</p>
                      
                      <motion.button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>Sign In</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="mt-5 pt-5 border-t border-white/10 text-center">
                  <p className="text-xs text-gray-500">
                    Powered by FastAPI • React • Machine Learning
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
