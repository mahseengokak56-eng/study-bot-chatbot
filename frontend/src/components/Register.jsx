import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser } from '../utils/api';
import MagicalCursor from './MagicalCursor';
import { Sparkles, Droplets } from 'lucide-react';

// Water Ripple Component - like stone thrown in water
const WaterRipples = () => {
  const ripples = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 0.8,
    duration: 2.5,
  }));

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-visible">
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400/30"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ 
            width: [0, 80, 150, 200],
            height: [0, 80, 150, 200],
            opacity: [0.8, 0.4, 0.2, 0],
          }}
          transition={{
            duration: ripple.duration,
            delay: ripple.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)',
          }}
        />
      ))}
    </div>
  );
};

// Left Side Water Ripples
const LeftWaterRipples = () => {
  return (
    <div className="absolute left-[-100px] top-1/2 -translate-y-1/2 w-48 h-96 pointer-events-none">
      <WaterRipples />
    </div>
  );
};

// Right Side Water Ripples
const RightWaterRipples = () => {
  return (
    <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 w-48 h-96 pointer-events-none">
      <WaterRipples />
    </div>
  );
};

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerUser(name, email, password);
      toast.success('Registration successful! Redirecting to dashboard...');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gemini-bg p-4 overflow-hidden relative cursor-none">
      <MagicalCursor />
      
      {/* Subtle Background Animation */}
      <motion.div
        className="absolute w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full top-0 left-0"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full bottom-20 right-20"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Left Side Water Ripples */}
      <LeftWaterRipples />
      
      {/* Right Side Water Ripples */}
      <RightWaterRipples />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-gemini-message-bot p-8 rounded-2xl shadow-2xl z-10 border border-gemini-border relative"
      >
        {/* Header with Sparkle Icon */}
        <div className="text-center mb-8">
          <motion.div
            className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 mb-2">
            Join EduNova
          </h1>
          <p className="text-gemini-muted">Create your AI study assistant account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-gemini-text">Name</label>
            <input
              type="text"
              required
              className="w-full bg-gemini-bg border border-gemini-border text-gemini-text rounded-lg p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gemini-text">Email</label>
            <input
              type="email"
              required
              className="w-full bg-gemini-bg border border-gemini-border text-gemini-text rounded-lg p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gemini-text">Password</label>
            <input
              type="password"
              required
              className="w-full bg-gemini-bg border border-gemini-border text-gemini-text rounded-lg p-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              'Register'
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-gemini-muted text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
