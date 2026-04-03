import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BookOpen, Heart, Lightbulb, MessageCircle, Sparkles } from 'lucide-react';

const categoryConfig = {
  academic: { 
    color: 'bg-blue-500', 
    icon: BookOpen, 
    label: 'Academic',
    desc: 'Study & Learning',
    gradient: 'from-blue-500 to-cyan-400'
  },
  stress: { 
    color: 'bg-amber-500', 
    icon: Heart, 
    label: 'Stress',
    desc: 'Wellness Support',
    gradient: 'from-amber-500 to-orange-400'
  },
  motivation: { 
    color: 'bg-green-500', 
    icon: Lightbulb, 
    label: 'Motivation',
    desc: 'Encouragement',
    gradient: 'from-green-500 to-emerald-400'
  },
  tips: { 
    color: 'bg-purple-500', 
    icon: Brain, 
    label: 'Tips',
    desc: 'Study Techniques',
    gradient: 'from-purple-500 to-pink-400'
  },
  general: { 
    color: 'bg-gray-500', 
    icon: MessageCircle, 
    label: 'General',
    desc: 'General Chat',
    gradient: 'from-gray-500 to-slate-400'
  }
};

function MLPredictionDisplay({ category, confidence = 95 }) {
  const config = categoryConfig[category?.toLowerCase()] || categoryConfig.general;
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="bg-gradient-to-r from-gemini-surface to-gemini-hover border border-gemini-border rounded-xl p-4 mb-4 shadow-lg"
    >
      <div className="flex items-center gap-3">
        {/* Icon with gradient background */}
        <motion.div 
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Icon size={24} className="text-white" />
        </motion.div>
        
        {/* Text content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-xs text-gemini-muted uppercase tracking-wider font-semibold">
              ML Prediction System
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-gemini-text">
              {config.label}
            </span>
            <span className="text-xs text-gemini-muted">
              ({confidence}% confidence)
            </span>
          </div>
          <p className="text-sm text-gemini-muted mt-0.5">
            {config.desc}
          </p>
        </div>

        {/* Animated indicator */}
        <motion.div
          className="w-3 h-3 rounded-full bg-green-400"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
}

export default MLPredictionDisplay;
