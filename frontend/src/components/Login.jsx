import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../utils/api';
import MagicalCursor from './MagicalCursor';

// Soothing Water Ripples - slower, more subtle, calming effect
const SoothingWaterRipples = () => {
  // Fewer sources, slower animation for calming effect
  const rippleSources = [
    { id: 1, startX: '20%', startY: '30%', delay: 0 },
    { id: 2, startX: '80%', startY: '20%', delay: 3 },
    { id: 3, startX: '70%', startY: '70%', delay: 6 },
    { id: 4, startX: '30%', startY: '80%', delay: 9 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {rippleSources.map((source) => (
        <div
          key={source.id}
          className="absolute"
          style={{ left: source.startX, top: source.startY }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="absolute rounded-full border border-blue-300/10"
              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              initial={{ width: 0, height: 0, opacity: 0.3 }}
              animate={{
                width: [0, 60, 120, 180],
                height: [0, 60, 120, 180],
                opacity: [0.3, 0.15, 0.08, 0],
              }}
              transition={{
                duration: 6,
                delay: source.delay + index * 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center p-4 pt-20 md:pt-4 overflow-y-auto touch-auto relative cursor-none" 
         style={{ touchAction: 'pan-y', backgroundColor: '#131314' }}>
      <MagicalCursor />
      
      {/* Soothing Water Ripples */}
      <SoothingWaterRipples />
      
      {/* Background Animations */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full bottom-0 right-0"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-gemini-message-bot p-8 rounded-2xl shadow-2xl z-10 border border-gemini-border"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          >
            <Sparkles className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            EduNova AI
          </h1>
          <p className="text-gemini-muted">Welcome back! Please sign in.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gemini-text">Email</label>
            <input
              type="email"
              required
              className="w-full bg-gemini-bg border border-gemini-border text-gemini-text rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
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
              className="w-full bg-gemini-bg border border-gemini-border text-gemini-text rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-gemini-muted text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
