import React, { useState } from 'react';
import { Plus, MessageSquare, PanelLeftClose, Trash2, BookOpen, Brain, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  createNewChat,
  removeSession,
  isOpen,
  toggleSidebar
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [predictionEnabled, setPredictionEnabled] = useState(true);

  return (
    <motion.div
      className={clsx(
        "fixed inset-y-0 left-0 bg-gemini-surface w-64 md:static md:w-64 flex flex-col pt-4 px-3 pb-4 border-r border-gemini-border z-40 transform duration-300 transition-transform",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Mobile close button */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <div className="flex items-center space-x-2 px-2">
          <BookOpen size={18} className="text-gemini-primary" />
          <h2 className="text-sm text-gemini-text font-semibold">Study Bot</h2>
        </div>
        <button onClick={toggleSidebar} className="p-2 hover:bg-gemini-hover rounded-full text-gemini-muted">
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* Logo — desktop */}
      <div className="hidden md:flex items-center space-x-2 px-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <BookOpen size={16} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-gemini-text font-semibold text-sm tracking-wide">EduNova AI</span>
      </div>

      {/* ML Prediction Feature Box */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gemini-text">ML Prediction</span>
          <Sparkles size={14} className="text-yellow-400" />
        </div>
        <p className="text-xs text-gemini-muted mb-3">
          AI-powered message categorization for better responses
        </p>
        <button
          onClick={() => setPredictionEnabled(!predictionEnabled)}
          className={clsx(
            "w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors",
            predictionEnabled 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-gemini-hover text-gemini-muted border border-gemini-border"
          )}
        >
          {predictionEnabled ? '✓ Enabled' : 'Disabled'}
        </button>
      </motion.div>

      {/* New Chat button */}
      <button
        onClick={createNewChat}
        className="flex items-center space-x-3 w-full p-3 bg-gemini-bg hover:bg-gemini-hover transition-colors rounded-2xl border border-transparent hover:border-gemini-border group mb-5"
      >
        <span className="bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full p-1.5 flex items-center justify-center shadow-sm">
          <Plus size={16} strokeWidth={3} />
        </span>
        <span className="font-medium text-sm text-gemini-text group-hover:text-white transition-colors">
          New Chat
        </span>
      </button>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <h2 className="text-xs text-gemini-muted font-semibold tracking-wider uppercase px-2 mb-3">
          Recent
        </h2>

        <AnimatePresence>
          {sessions.length === 0 && (
            <p className="text-xs text-gemini-muted px-2 italic">No chats yet.</p>
          )}

          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="relative group mb-0.5"
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => setActiveSessionId(session.id)}
                className={clsx(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors text-left pr-9",
                  activeSessionId === session.id
                    ? "bg-gemini-hover text-gemini-primary font-medium"
                    : "text-gemini-text hover:bg-gemini-hover"
                )}
              >
                <MessageSquare
                  size={15}
                  className={clsx(
                    "shrink-0",
                    activeSessionId === session.id ? "text-gemini-primary" : "text-gemini-muted"
                  )}
                />
                <span className="truncate text-sm">{session.title}</span>
              </button>

              {/* Delete button — shown on hover */}
              {hoveredId === session.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeSession(session.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-red-900/50 text-gemini-muted hover:text-red-400 transition-colors"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gemini-border mt-2">
        <p className="text-xs text-gemini-muted text-center opacity-60">
          📚 Study Bot v1.0
        </p>
      </div>
    </motion.div>
  );
}
