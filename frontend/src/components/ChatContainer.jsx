import React, { useRef, useEffect } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Lightbulb, Code2, FlaskConical, Calculator } from 'lucide-react';

const SUGGESTED = [
  { icon: <Code2 size={18} />, text: "Explain how recursion works in Python" },
  { icon: <Calculator size={18} />, text: "How do I solve quadratic equations?" },
  { icon: <FlaskConical size={18} />, text: "What is Newton's 3rd law of motion?" },
  { icon: <Lightbulb size={18} />, text: "Explain photosynthesis step by step" },
];

export default function ChatContainer({ messages = [], isTyping, onSuggest }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-12 pb-2">
      {messages.length === 0 ? (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full flex flex-col items-center justify-center px-4 text-center"
        >
          {/* Animated logo */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-lg border border-blue-500/20"
          >
            <BookOpen size={36} className="text-gemini-primary" strokeWidth={1.5} />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 text-transparent bg-clip-text">
            Hello, I'm Study Bot 📚
          </h1>
          <p className="text-gemini-muted text-base max-w-md mb-10 leading-relaxed">
            Your AI-powered study companion. Ask me to explain concepts, solve problems, write code, or help you understand any topic.
          </p>

          {/* Suggestion chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
            {SUGGESTED.map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                onClick={() => onSuggest?.(item.text)}
                className="flex items-center space-x-3 p-4 rounded-2xl bg-gemini-surface border border-gemini-border hover:border-gemini-primary/50 hover:bg-gemini-hover text-left transition-all group"
              >
                <span className="text-gemini-primary group-hover:scale-110 transition-transform shrink-0">
                  {item.icon}
                </span>
                <span className="text-gemini-text text-sm leading-snug">{item.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : (
        /* ── Message Feed ── */
        <div className="flex-1 w-full pt-8 pb-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} className="h-8" />
        </div>
      )}
    </div>
  );
}
