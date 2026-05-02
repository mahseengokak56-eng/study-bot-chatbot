import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle, Sparkles, Smile, Frown, Meh } from 'lucide-react';
import { getCurrentUser } from '../utils/api';

const RobotAvatar3D = ({ 
  currentView, 
  quizScore, 
  stressLevel, 
  recentTopics = [],
  chatCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [robotMood, setRobotMood] = useState('happy'); // happy, thinking, excited, concerned
  const [isFloating, setIsFloating] = useState(true);
  const currentUser = getCurrentUser();
  const messageRef = useRef(0);
  const inputRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const hour = new Date().getHours();
      let greeting = 'Hello';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';
      else greeting = 'Good evening';
      
      const initialMsg = `${greeting}, ${currentUser?.name || 'friend'}! 🤖 I'm your study buddy! How is your study going today?`;
      typeMessage(initialMsg, 'happy');
    }
  }, []);

  // Typewriter effect
  const typeMessage = (message, mood = 'happy') => {
    setIsTyping(true);
    setRobotMood('thinking');
    setCurrentMessage('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index <= message.length) {
        setCurrentMessage(message.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setRobotMood(mood);
        setMessages(prev => [...prev, { text: message, sender: 'robot', mood, timestamp: Date.now() }]);
        
        // Ask follow-up question after a delay
        if (messageRef.current === 0) {
          setTimeout(() => {
            messageRef.current = 1;
          }, 1000);
        }
      }
    }, 30);
    
    return () => clearInterval(interval);
  };

  // Handle user sending message
  const handleUserSend = () => {
    if (!userInput.trim()) return;
    
    const userMessage = userInput.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user', timestamp: Date.now() }]);
    setUserInput('');
    
    // Generate robot response based on user input
    setTimeout(() => {
      const response = generateResponse(userMessage);
      typeMessage(response.text, response.mood);
    }, 500);
  };

  // Generate contextual response
  const generateResponse = (userMsg) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Study related responses
    if (lowerMsg.includes('good') || lowerMsg.includes('great') || lowerMsg.includes('well') || lowerMsg.includes('awesome') || lowerMsg.includes('fine')) {
      return {
        text: `Oh wonderful! 🎉 I'm so happy to hear that! Keep up the excellent work! What subject are you enjoying the most right now?`,
        mood: 'excited'
      };
    }
    
    if (lowerMsg.includes('bad') || lowerMsg.includes('poor') || lowerMsg.includes('not good') || lowerMsg.includes('struggling') || lowerMsg.includes('difficult')) {
      return {
        text: `Oh no, I'm sorry to hear that! 😟 Don't worry though - every expert was once a beginner. Would you like me to help you with any specific topic? Or shall we take a small break and try a fun quiz?`,
        mood: 'concerned'
      };
    }
    
    if (lowerMsg.includes('tired') || lowerMsg.includes('exhausted') || lowerMsg.includes('sleepy')) {
      return {
        text: `You sound tired! 💤 Remember, rest is important for learning. How about taking a 10-minute break? Drink some water, stretch a bit, then come back fresh! Your brain will thank you!`,
        mood: 'concerned'
      };
    }
    
    if (lowerMsg.includes('math') || lowerMsg.includes('science') || lowerMsg.includes('english') || lowerMsg.includes('history') || lowerMsg.includes('coding') || lowerMsg.includes('programming')) {
      return {
        text: `${userMessage} is fascinating! 🧠 Would you like me to generate some study notes on this topic, or would you prefer to test your knowledge with a quiz?`,
        mood: 'excited'
      };
    }
    
    if (lowerMsg.includes('quiz') || lowerMsg.includes('test') || lowerMsg.includes('exam')) {
      return {
        text: `Quizzes are a great way to learn! 🎯 I can create a personalized quiz for you. What topic would you like to be quizzed on?`,
        mood: 'excited'
      };
    }
    
    if (lowerMsg.includes('help') || lowerMsg.includes('explain') || lowerMsg.includes('understand')) {
      return {
        text: `Of course! I'm here to help! 💡 What topic would you like me to explain? I can break it down step by step for you!`,
        mood: 'happy'
      };
    }
    
    if (lowerMsg.includes('note') || lowerMsg.includes('study material')) {
      return {
        text: `I can generate comprehensive study notes for you! 📝 Just tell me the topic and I'll create detailed notes with examples. What would you like to learn about?`,
        mood: 'happy'
      };
    }
    
    if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye') || lowerMsg.includes('see you')) {
      return {
        text: `Goodbye! 👋 It was lovely chatting with you! Remember, I'm always here whenever you need help with your studies. Have a great day!`,
        mood: 'happy'
      };
    }
    
    // Default response
    return {
      text: `That's interesting! 🤔 Tell me more about it. Or if you need help with studies, I can generate notes, create quizzes, or just chat to keep you motivated! What would you like to do?`,
      mood: 'happy'
    };
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  };

  // Robot face based on mood
  const RobotFace = () => {
    switch(robotMood) {
      case 'happy':
        return (
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        );
      case 'excited':
        return (
          <div className="flex gap-1">
            <div className="w-4 h-5 bg-yellow-400 rounded-full animate-bounce" />
            <div className="w-4 h-5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          </div>
        );
      case 'thinking':
        return (
          <div className="flex gap-1">
            <div className="w-4 h-1 bg-gray-400 rounded-full" />
            <div className="w-4 h-1 bg-gray-400 rounded-full" />
          </div>
        );
      case 'concerned':
        return (
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-orange-400 rounded-full" />
            <div className="w-4 h-4 bg-orange-400 rounded-full" />
          </div>
        );
      default:
        return (
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-blue-400 rounded-full" />
            <div className="w-4 h-4 bg-blue-400 rounded-full" />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed right-4 bottom-4 z-50 ${isExpanded ? 'w-96' : 'w-auto'}`}
      >
        {isExpanded ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gemini-message-bot border border-gemini-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with 3D Robot */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-4 w-20 h-20 bg-white rounded-full blur-xl" />
                <div className="absolute bottom-2 right-4 w-16 h-16 bg-white rounded-full blur-xl" />
              </div>
              
              {/* 3D Robot Avatar */}
              <div className="flex items-center gap-4 relative z-10">
                <motion.div 
                  className="relative"
                  animate={{ 
                    y: isFloating ? [0, -8, 0] : 0,
                    rotate: isTyping ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ 
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 0.5, repeat: isTyping ? Infinity : 0 }
                  }}
                >
                  {/* Robot Head */}
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-3xl shadow-lg relative overflow-hidden border-4 border-white/30">
                    {/* Robot Face */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RobotFace />
                    </div>
                    {/* Antenna */}
                    <motion.div 
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                      animate={{ rotate: isTyping ? [0, 20, -20, 0] : 0 }}
                      transition={{ duration: 0.3, repeat: isTyping ? Infinity : 0 }}
                    >
                      <div className="w-1 h-4 bg-gray-300 mx-auto" />
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                    </motion.div>
                    {/* Ears */}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-3 h-6 bg-gray-400 rounded-l-lg" />
                    <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-3 h-6 bg-gray-400 rounded-r-lg" />
                  </div>
                  
                  {/* Robot Body (small) */}
                  <motion.div 
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-xl -z-10"
                    animate={{ scaleY: isTyping ? [1, 0.9, 1] : 1 }}
                    transition={{ duration: 0.3, repeat: isTyping ? Infinity : 0 }}
                  />
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">EduBot</h3>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {isTyping ? 'Typing...' : 'Online & Ready to Chat!'}
                  </p>
                </div>
                
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gemini-bg">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.sender === 'robot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'robot' 
                      ? 'bg-white/10 text-gemini-text rounded-tl-none' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {/* Current typing message */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 max-w-[75%]">
                    <p className="text-sm text-gemini-text">{currentMessage}</p>
                    <span className="text-xs text-gemini-muted mt-1 flex items-center gap-1">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Typing...
                      </motion.span>
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-gemini-bg border-t border-gemini-border">
              <div className="flex items-center gap-2 bg-gemini-surface rounded-full px-4 py-2 border border-gemini-border">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent text-gemini-text text-sm outline-none placeholder-gemini-muted"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUserSend}
                  disabled={!userInput.trim()}
                  className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white disabled:opacity-40 transition-all"
                >
                  <Send size={16} />
                </motion.button>
              </div>
              
              {/* Quick suggestions */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {['Going good!', 'Need help', 'Feeling tired', 'Quiz me!', 'Generate notes'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setUserInput(suggestion);
                      setTimeout(() => handleUserSend(), 100);
                    }}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs text-gemini-muted transition-colors border border-white/5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Collapsed State - Floating Robot */
          <motion.button
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            {/* Speech bubble hint */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-white text-gray-800 px-3 py-2 rounded-xl text-xs font-medium shadow-lg whitespace-nowrap hidden group-hover:block"
            >
              Chat with me! 🤖
              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </motion.div>
            
            {/* 3D Robot Avatar Button */}
            <motion.div
              animate={{ 
                y: [0, -6, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
              
              {/* Robot Container */}
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl border-4 border-white/40 flex items-center justify-center overflow-hidden">
                {/* Face */}
                <div className="flex gap-1.5">
                  <motion.div 
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{ scaleY: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{ scaleY: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                  />
                </div>
                
                {/* Antenna */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-0.5 h-2 bg-white/60 mx-auto" />
                  <motion.div 
                    className="w-2 h-2 bg-red-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
                
                {/* Notification badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">!</span>
                </div>
              </div>
            </motion.div>
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default RobotAvatar3D;
