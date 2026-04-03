import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BookOpen, Heart, Lightbulb, MessageCircle } from 'lucide-react';

const categoryConfig = {
  academic: { 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    icon: <BookOpen size={14} />, 
    label: 'Academic',
    desc: 'Study & Learning'
  },
  stress: { 
    bg: 'bg-amber-500/20', 
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    icon: <Heart size={14} />, 
    label: 'Stress',
    desc: 'Wellness Support'
  },
  motivation: { 
    bg: 'bg-green-500/20', 
    border: 'border-green-500/30',
    text: 'text-green-500',
    icon: <Lightbulb size={14} />, 
    label: 'Motivation',
    desc: 'Encouragement'
  },
  tips: { 
    bg: 'bg-purple-500/20', 
    border: 'border-purple-500/30',
    text: 'text-purple-500',
    icon: <Brain size={14} />, 
    label: 'Tips',
    desc: 'Study Techniques'
  },
  general: { 
    bg: 'bg-gray-500/20', 
    border: 'border-gray-500/30',
    text: 'text-gray-500 dark:text-gray-400',
    icon: <MessageCircle size={14} />, 
    label: 'General',
    desc: 'Chat'
  }
};

function MLPredictionBadge({ category, showDetails = false }) {
  const config = categoryConfig[category?.toLowerCase()] || categoryConfig.general;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
      className="inline-flex items-center gap-2"
    >
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} border ${config.border}`}>
        <span className={config.text}>
          {config.icon}
        </span>
        <span className={`text-xs font-semibold ${config.text}`}>
          {config.label}
        </span>
      </div>
      
      {showDetails && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          ML Detected: {config.desc}
        </motion.span>
      )}
    </motion.div>
  );
}

export default MLPredictionBadge;
