import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, ChevronLeft, ChevronRight, Sparkles, 
  MessageCircle, Brain, Target, BookOpen, Zap,
  Coffee, TrendingUp, AlertCircle, Lightbulb
} from 'lucide-react';
import { getCurrentUser } from '../utils/api';

const AssistantBot = ({ 
  currentView, 
  quizScore, 
  stressLevel, 
  recentTopics = [],
  chatCount = 0,
  isExpanded: externalExpanded,
  setIsExpanded: setExternalExpanded
}) => {
  const [isExpanded, setIsExpanded] = useState(externalExpanded || false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const currentUser = getCurrentUser();
  const messageRef = useRef(0);

  // Sync with external state
  useEffect(() => {
    if (externalExpanded !== undefined) {
      setIsExpanded(externalExpanded);
    }
  }, [externalExpanded]);

  // Generate contextual messages based on user activity
  const generateMessage = () => {
    const messages = [];
    
    // Welcome message
    if (messageRef.current === 0) {
      const hour = new Date().getHours();
      let greeting = 'Hello';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';
      else greeting = 'Good evening';
      
      return `${greeting}, ${currentUser?.name || 'learner'}! I'm your study assistant. How can I help you today?`;
    }
    
    // Context-based messages
    if (stressLevel === 'High') {
      messages.push(
        "I notice you might be feeling stressed. Take a deep breath! 💆",
        "Your stress level seems high. Consider taking a short break! ☕",
        "Let's take it easy. A 5-minute break can boost productivity! 🧘"
      );
    }
    
    if (quizScore !== null && quizScore < 50) {
      messages.push(
        "Don't worry about the quiz score! Practice makes perfect! 📚",
        "Keep trying! Every attempt is a learning opportunity! 💪",
        "Review the topics and try again. You've got this! 🎯"
      );
    } else if (quizScore !== null && quizScore >= 80) {
      messages.push(
        "Amazing quiz performance! Keep up the great work! 🌟",
        "You're doing fantastic! Ready for more challenges? 🚀",
        "Excellent scores! You're mastering these topics! 🎉"
      );
    }
    
    if (recentTopics.length > 0) {
      const lastTopic = recentTopics[recentTopics.length - 1];
      messages.push(
        `I see you've been studying "${lastTopic}". Want to test your knowledge? 🧠`,
        `"${lastTopic}" is interesting! Try a quiz on this topic! 📖`,
        `How's your understanding of "${lastTopic}"? Need help? 🤔`
      );
    }
    
    if (chatCount > 5) {
      messages.push(
        "You've been quite active! Ready for a quiz challenge? 🎯",
        "Great engagement today! Take a quiz to test your knowledge! 📊",
        "You're on a roll! How about generating some study notes? 📝"
      );
    }
    
    // General encouraging messages
    messages.push(
      "Need help with any topic? I'm here to assist! 💡",
      "Tip: Regular breaks improve memory retention! 🧠",
      "Try explaining what you learned to someone else! 🗣️",
      "You're making great progress! Keep learning! 🌟",
      "Have you tried the quiz feature yet? It's fun! 🎮"
    );
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Typewriter effect
  const typeMessage = (message) => {
    setIsTyping(true);
    setCurrentMessage('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index <= message.length) {
        setCurrentMessage(message.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setMessageHistory(prev => [...prev, { text: message, timestamp: Date.now() }]);
      }
    }, 30);
    
    return () => clearInterval(interval);
  };

  // Generate new message periodically
  useEffect(() => {
    if (messageRef.current === 0) {
      const msg = generateMessage();
      typeMessage(msg);
      messageRef.current = 1;
    }
    
    const interval = setInterval(() => {
      if (!isTyping) {
        messageRef.current++;
        const msg = generateMessage();
        typeMessage(msg);
      }
    }, 30000); // New message every 30 seconds
    
    return () => clearInterval(interval);
  }, [stressLevel, quizScore, recentTopics, chatCount, isTyping]);

  // Update message when context changes
  useEffect(() => {
    if (messageRef.current > 0 && !isTyping) {
      const msg = generateMessage();
      typeMessage(msg);
    }
  }, [currentView, stressLevel, quizScore]);

  const handleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (setExternalExpanded) {
      setExternalExpanded(newState);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed right-4 bottom-4 z-40 ${isExpanded ? 'w-80' : 'w-auto'}`}
      >
        {isExpanded ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gemini-message-bot border border-gemini-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">EduNova Assistant</h3>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={handleExpand}
                className="text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gemini-bg">
              {/* Assistant Message */}
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white/5 rounded-lg p-3 max-w-[200px]">
                  <p className="text-sm text-gemini-text">{currentMessage}</p>
                  {isTyping && (
                    <span className="text-gemini-muted text-xs">Typing...</span>
                  )}
                </div>
              </div>

              {/* Message History */}
              {messageHistory.slice(-3).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 opacity-50">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 max-w-[200px]">
                    <p className="text-sm text-gemini-muted">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="p-3 bg-gemini-bg border-t border-gemini-border">
              <p className="text-xs text-gemini-muted mb-2">Quick Actions:</p>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => {
                    const msg = "Let me help you with your studies! What topic are you learning?";
                    typeMessage(msg);
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gemini-text transition-colors flex items-center gap-1"
                >
                  <Brain size={12} />
                  Study Help
                </button>
                <button 
                  onClick={() => {
                    const msg = "Taking regular breaks improves focus. Try the 25-5 Pomodoro technique!";
                    typeMessage(msg);
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gemini-text transition-colors flex items-center gap-1"
                >
                  <Coffee size={12} />
                  Break Tip
                </button>
                <button 
                  onClick={() => {
                    const msg = "Quiz yourself regularly! Active recall is the best way to remember.";
                    typeMessage(msg);
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gemini-text transition-colors flex items-center gap-1"
                >
                  <Target size={12} />
                  Quiz Tip
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="p-2 bg-gemini-bg/50 border-t border-gemini-border flex items-center justify-around text-xs text-gemini-muted">
              <div className="flex items-center gap-1">
                <MessageCircle size={12} />
                <span>{chatCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={12} />
                <span>{recentTopics.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={12} />
                <span>{stressLevel || 'Normal'}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            onClick={handleExpand}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            <div className="relative">
              <Bot size={24} className="text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse"></span>
            </div>
            <ChevronLeft size={20} className="text-white" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AssistantBot;
