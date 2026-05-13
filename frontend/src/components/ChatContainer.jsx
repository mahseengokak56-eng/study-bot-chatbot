import React, { useRef, useEffect, useMemo } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Lightbulb, Code2, FlaskConical, Calculator, Brain, Zap, Globe } from 'lucide-react';

// ── Dynamic suggestion pool (rotates on every fresh chat) ────────────────────
const ALL_SUGGESTIONS = [
  { icon: <Code2 size={18} />,       text: "Explain how recursion works in Python" },
  { icon: <Calculator size={18} />,   text: "How do I solve quadratic equations?" },
  { icon: <FlaskConical size={18} />, text: "What is Newton's 3rd law of motion?" },
  { icon: <Lightbulb size={18} />,    text: "Explain photosynthesis step by step" },
  { icon: <Brain size={18} />,        text: "What is Big O notation and why does it matter?" },
  { icon: <Zap size={18} />,          text: "Help me understand binary search trees" },
  { icon: <Globe size={18} />,        text: "Explain the water cycle with examples" },
  { icon: <BookOpen size={18} />,     text: "Give me tips for memorising faster" },
  { icon: <Code2 size={18} />,       text: "What is the difference between OOP and functional programming?" },
  { icon: <FlaskConical size={18} />, text: "How does DNA replication work?" },
  { icon: <Calculator size={18} />,   text: "Explain integration by parts with an example" },
  { icon: <Lightbulb size={18} />,    text: "I feel stressed about exams \u2014 can you help?" },
];

// Pick 4 suggestions deterministically based on the current hour
// so they feel fresh each session but don't flicker on re-renders
function pickSuggestions() {
  const hour = new Date().getHours();
  const start = (hour * 3) % ALL_SUGGESTIONS.length;
  const picks = [];
  for (let i = 0; i < 4; i++) {
    picks.push(ALL_SUGGESTIONS[(start + i) % ALL_SUGGESTIONS.length]);
  }
  return picks;
}

// ── Time-based greeting ───────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! Ready to learn? \ud83c\udf1e";
  if (hour < 17) return "Good afternoon! Let\u2019s make progress. \ud83d\udcda";
  if (hour < 21) return "Good evening! Evening sessions stick well. \ud83c\udf19";
  return "Studying late? I\u2019ve got you. \u2b50";
}

export default function ChatContainer({ messages = [], isTyping, onSuggest }) {
  const bottomRef = useRef(null);
  const SUGGESTED = useMemo(() => pickSuggestions(), []);
  const greeting = useMemo(() => getGreeting(), []);

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

          {/* Time-based greeting */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gemini-muted text-sm mb-2"
          >
            {greeting}
          </motion.p>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 text-transparent bg-clip-text">
            Hello, I'm PandaBuddy \ud83d\udc3c
          </h1>
          <p className="text-gemini-muted text-base max-w-md mb-10 leading-relaxed">
            Your AI-powered study companion. Ask me to explain concepts, solve problems, write code, manage stress, or help with any topic.
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
