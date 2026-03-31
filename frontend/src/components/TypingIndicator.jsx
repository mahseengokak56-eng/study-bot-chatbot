import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  const dotVariants = {
    start: { y: 0, opacity: 0.4 },
    end: { y: -5, opacity: 1 }
  };
  
  const containerVariants = {
    start: { transition: { staggerChildren: 0.2 } },
    end: { transition: { staggerChildren: 0.2 } }
  };

  const transitionConfig = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse',
    ease: "easeInOut"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full px-4 md:px-0 mx-auto max-w-3xl mb-8 space-x-6 relative"
    >
      <div className="w-8 h-8 rounded-full bg-gemini-primary text-[#131314] flex flex-shrink-0 items-center justify-center mt-1 hidden md:flex">
        <Bot size={18} strokeWidth={2.5} />
      </div>
      
      <div className="rounded-2xl p-4 flex items-center h-12">
        <motion.div 
          className="flex space-x-1.5"
          variants={containerVariants}
          initial="start"
          animate="end"
        >
          <motion.div className="w-2 h-2 bg-gemini-primary rounded-full shadow-[0_0_10px_rgba(168,199,250,0.5)]" variants={dotVariants} transition={transitionConfig} />
          <motion.div className="w-2 h-2 bg-gemini-primary rounded-full shadow-[0_0_10px_rgba(168,199,250,0.5)]" variants={dotVariants} transition={transitionConfig} />
          <motion.div className="w-2 h-2 bg-gemini-primary rounded-full shadow-[0_0_10px_rgba(168,199,250,0.5)]" variants={dotVariants} transition={transitionConfig} />
        </motion.div>
      </div>
    </motion.div>
  );
}
