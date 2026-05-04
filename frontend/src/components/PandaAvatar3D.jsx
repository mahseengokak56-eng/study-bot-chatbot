import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Mic, MicOff, Sparkles } from 'lucide-react';
import { getCurrentUser } from '../utils/api';

const PandaAvatar3D = ({ 
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
  const [pandaMood, setPandaMood] = useState('happy'); // happy, curious, sleepy, excited
  const [isListening, setIsListening] = useState(false);
  const [conversationStage, setConversationStage] = useState('greeting');
  const currentUser = getCurrentUser();
  const messageRef = useRef(0);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setPandaMood('curious');
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserSend(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setPandaMood('happy');
        typeMessage("Oops! I didn't catch that. Could you try speaking again or type your message? 🐼", 'happy');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setPandaMood('happy');
      };
    }
  }, []);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && isExpanded) {
      const hour = new Date().getHours();
      let greeting = 'Hello';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';
      else greeting = 'Good evening';
      
      const initialMsg = `${greeting}, ${currentUser?.name || 'friend'}! 🐼 I'm Panda, your study buddy! How is your study going today?`;
      typeMessage(initialMsg, 'happy');
      setConversationStage('ask_study_status');
    }
  }, [isExpanded]);

  // Toggle voice recognition
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      typeMessage("Sorry, voice input is not supported in your browser. Please type instead! 🐾", 'sleepy');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech recognition error:', e);
      }
    }
  };

  // Typewriter effect
  const typeMessage = (message, mood = 'happy') => {
    setIsTyping(true);
    setPandaMood('curious');
    setCurrentMessage('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index <= message.length) {
        setCurrentMessage(message.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setPandaMood(mood);
        setMessages(prev => [...prev, { text: message, sender: 'panda', mood, timestamp: Date.now() }]);
      }
    }, 30);
    
    return () => clearInterval(interval);
  };

  // Handle user sending message
  const handleUserSend = (messageText) => {
    const text = messageText || userInput;
    if (!text.trim()) return;
    
    const userMessage = text.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user', timestamp: Date.now() }]);
    setUserInput('');
    
    // Generate contextual response based on conversation stage
    setTimeout(() => {
      const response = generateContextualResponse(userMessage);
      typeMessage(response.text, response.mood);
      setConversationStage(response.nextStage);
    }, 500);
  };

  // Generate contextual, flowing conversation
  const generateContextualResponse = (userMsg) => {
    const lowerMsg = userMsg.toLowerCase();
    const currentStage = conversationStage;

    // ========== HIGHEST PRIORITY: Identity & Basic Questions (always answer these!) ==========
    
    // Identity/Who are you questions - CRITICAL for human-like conversation!
    if (lowerMsg.includes('who are you') || lowerMsg.includes('what are you') || 
        lowerMsg.includes('your name') || lowerMsg.includes('introduce yourself') ||
        lowerMsg.includes('tell me about yourself')) {
      return {
        text: `Hi there! I'm Panda Buddy! 🐼 I'm your friendly AI study companion here on EduNova. I can help you with: generating study notes, creating quizzes, checking your stress levels, and just being someone to chat with when you need motivation! I love bamboo, naps, and helping students succeed. What brings you here today?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    // How are you (asking Panda)
    if (lowerMsg.includes('how are you') || lowerMsg.includes('how do you do')) {
      return {
        text: `I'm doing great, thanks for asking! 🎋 I just had some virtual bamboo and I'm ready to help you learn! How about you? How are you feeling today?`,
        mood: 'happy',
        nextStage: 'ask_user_status'
      };
    }

    // What can you do / capabilities
    if (lowerMsg.includes('what can you do') || lowerMsg.includes('your features') || 
        lowerMsg === 'what do you do' || lowerMsg === 'what can you do for me') {
      return {
        text: `Great question! Here's what I can do for you: 📚✨\n\n1. **Generate Study Notes** - Just tell me any topic and I'll create comprehensive notes\n2. **Create Quizzes** - Test your knowledge with personalized quizzes\n3. **Stress Check** - Monitor your stress levels and get tips\n4. **Chat & Motivate** - I'm always here to encourage you!\n5. **Voice Chat** - Click the mic button to talk to me!\n\nWhat would you like to try first?`,
        mood: 'excited',
        nextStage: 'offer_activity'
      };
    }

    // ========== STAGE-SPECIFIC RESPONSES ==========
    
    // FIRST: Check for NEGATIVE responses (must check before positive!)
    if (currentStage === 'ask_study_status') {
      // Check for "not good", "didn't study", "nothing" etc FIRST
      if (lowerMsg.includes('not good') || lowerMsg.includes('not well') || lowerMsg.includes('not fine') || 
          lowerMsg.includes('didn\'t study') || lowerMsg.includes('did not study') || 
          lowerMsg.includes('studied nothing') || lowerMsg.includes('nothing') ||
          lowerMsg.includes('no progress') || lowerMsg.includes('wasted time')) {
        return {
          text: `Oh no, I'm sorry to hear that! 😟 It's okay to have off days. Even pandas have lazy days where we just eat bamboo and nap! � Tomorrow is a fresh start. Would you like me to help you get back on track with some study tips or a fun quiz?`,
          mood: 'curious',
          nextStage: 'offer_help'
        };
      }

      if (lowerMsg.includes('bad') || lowerMsg.includes('terrible') || lowerMsg.includes('awful') || 
          lowerMsg.includes('worst') || lowerMsg.includes('hate') || lowerMsg.includes('suck')) {
        return {
          text: `Aww, that sounds really tough! 😔 But remember, every expert was once a beginner. Albert Einstein struggled in school too! What subject is giving you the hardest time? Let's tackle it together! 💪`,
          mood: 'curious',
          nextStage: 'offer_help'
        };
      }

      if (lowerMsg.includes('struggling') || lowerMsg.includes('difficult') || lowerMsg.includes('hard') || 
          lowerMsg.includes('tough') || lowerMsg.includes('challenging')) {
        return {
          text: `I understand, some days learning feels like climbing a mountain! 🏔️ But you know what? Every step counts, even the small ones. What topic are you finding difficult? I can break it down into simple pieces for you!`,
          mood: 'curious',
          nextStage: 'offer_help'
        };
      }

      // THEN check for POSITIVE responses
      if (lowerMsg.includes('good') || lowerMsg.includes('great') || lowerMsg.includes('well') || 
          lowerMsg.includes('fine') || lowerMsg.includes('awesome') || lowerMsg.includes('excellent') ||
          lowerMsg.includes('amazing') || lowerMsg.includes('fantastic') || lowerMsg.includes('perfect')) {
        return {
          text: `Oh that's wonderful to hear! 🎉 I'm so happy for you! Your hard work is paying off! What subject are you finding most interesting right now? Is it math, science, or something else?`,
          mood: 'excited',
          nextStage: 'ask_subject'
        };
      }

      if (lowerMsg.includes('okay') || lowerMsg.includes('alright') || lowerMsg.includes('so-so') || 
          lowerMsg.includes('decent') || lowerMsg.includes('not bad')) {
        return {
          text: `I see, just an average day! That's totally normal. 🙂 Sometimes slow and steady wins the race! Maybe we can make it more exciting - would you like to try a quick quiz or learn something new?`,
          mood: 'happy',
          nextStage: 'offer_activity'
        };
      }
    }

    // Subject interest responses
    if (currentStage === 'ask_subject' || lowerMsg.includes('subject') || lowerMsg.includes('like')) {
      if (lowerMsg.includes('math') || lowerMsg.includes('mathematics')) {
        return {
          text: `Math is amazing! 🧮 Numbers are like puzzles waiting to be solved. Are you working on algebra, calculus, or something else? I can create practice problems for you!`,
          mood: 'excited',
          nextStage: 'ask_specific_topic'
        };
      }
      
      if (lowerMsg.includes('science') || lowerMsg.includes('physics') || lowerMsg.includes('chemistry') || lowerMsg.includes('biology')) {
        return {
          text: `Science is so fascinating! 🔬 Understanding how the world works is incredible. Which area are you studying? I can explain complex concepts in simple terms!`,
          mood: 'excited',
          nextStage: 'ask_specific_topic'
        };
      }

      if (lowerMsg.includes('english') || lowerMsg.includes('language') || lowerMsg.includes('literature')) {
        return {
          text: `Languages are beautiful! 📚 Words have so much power. Are you reading something interesting or working on writing? I'd love to hear about it!`,
          mood: 'happy',
          nextStage: 'ask_specific_topic'
        };
      }

      if (lowerMsg.includes('history') || lowerMsg.includes('geography') || lowerMsg.includes('social')) {
        return {
          text: `History teaches us so much about the past! 🌍 Learning about different cultures and events is like time travel. What period are you studying?`,
          mood: 'curious',
          nextStage: 'ask_specific_topic'
        };
      }

      if (lowerMsg.includes('coding') || lowerMsg.includes('programming') || lowerMsg.includes('computer')) {
        return {
          text: `Coding is like magic! ✨ You can create anything with code. Are you learning Python, JavaScript, or another language? I can help debug your code or explain concepts!`,
          mood: 'excited',
          nextStage: 'ask_specific_topic'
        };
      }
    }

    // Offer help responses
    if (currentStage === 'offer_help' || lowerMsg.includes('help') || lowerMsg.includes('explain')) {
      return {
        text: `I'd be happy to help! 💡 I can generate detailed study notes for any topic, create a quiz to test your knowledge, or just chat to keep you motivated. What would you prefer?`,
        mood: 'happy',
        nextStage: 'ask_activity_preference'
      };
    }

    // Activity preference
    if (currentStage === 'ask_activity_preference' || currentStage === 'offer_activity') {
      if (lowerMsg.includes('quiz') || lowerMsg.includes('test')) {
        return {
          text: `Quizzes are a great way to learn! 🎯 Just tell me what topic you want to be quizzed on, and I'll create a personalized quiz for you. What subject should we focus on?`,
          mood: 'excited',
          nextStage: 'prepare_quiz'
        };
      }

      if (lowerMsg.includes('note') || lowerMsg.includes('study')) {
        return {
          text: `I love making study notes! 📝 Just tell me the topic and I'll create comprehensive notes with examples. What would you like to learn about?`,
          mood: 'happy',
          nextStage: 'prepare_notes'
        };
      }

      if (lowerMsg.includes('chat') || lowerMsg.includes('talk') || lowerMsg.includes('motivat')) {
        return {
          text: `I love chatting! 🐼 Here's a thought: Every expert was once a beginner. Keep going, you're doing great! Is there anything specific on your mind?`,
          mood: 'happy',
          nextStage: 'general_chat'
        };
      }
    }

    // Quiz preparation
    if (currentStage === 'prepare_quiz') {
      return {
        text: `Perfect! I can create a quiz on "${userMsg}". You can find the Quiz Generator in the sidebar - just select "Quiz" and I'll be there to help! 🎮 Want to talk about anything else while you head there?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    // Notes preparation
    if (currentStage === 'prepare_notes') {
      return {
        text: `Great choice! Head to the Notes section in the sidebar and I can generate detailed notes on "${userMsg}". It'll include key points, summaries, and examples! 📚 How does that sound?`,
        mood: 'happy',
        nextStage: 'general_chat'
      };
    }

    // Tired or sleepy responses
    if (lowerMsg.includes('tired') || lowerMsg.includes('sleepy') || lowerMsg.includes('exhausted') || lowerMsg.includes('sleep')) {
      return {
        text: `You sound tired, friend! 💤 Even pandas need their rest - we sleep 10-16 hours a day! Take a short break, drink water, maybe have a snack. Your brain learns better when you're rested. Come back when you're refreshed! 🎋`,
        mood: 'sleepy',
        nextStage: 'general_chat'
      };
    }

    // Stress responses
    if (lowerMsg.includes('stress') || lowerMsg.includes('worried') || lowerMsg.includes('anxious') || lowerMsg.includes('nervous')) {
      return {
        text: `Oh no, stress is tough! 🎋 Take a deep breath with me... In... Out... Remember, you've got this! One step at a time. Want to try the Stress Checker in the sidebar? It might help you feel better!`,
        mood: 'curious',
        nextStage: 'general_chat'
      };
    }

    // Break responses
    if (lowerMsg.includes('break') || lowerMsg.includes('rest') || lowerMsg.includes('pause')) {
      return {
        text: `Taking breaks is super important! ☕ Even I nap between bamboo meals! Try the Pomodoro technique - 25 minutes study, 5 minutes break. It works wonders! Ready to get back to it when you are! 🐼`,
        mood: 'happy',
        nextStage: 'general_chat'
      };
    }

    // Thank you responses
    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks') || lowerMsg.includes('grateful')) {
      return {
        text: `Aww, you're so welcome! 🐼💕 I'm always here to help you! Remember, learning is a journey and I'm happy to be your study buddy. What else can we talk about?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    // Bye/Goodbye responses
    if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye') || lowerMsg.includes('see you') || lowerMsg.includes('later')) {
      return {
        text: `Goodbye, ${currentUser?.name || 'friend'}! 👋 It was lovely chatting with you! Remember to take breaks, stay curious, and keep learning. I'll be right here when you need me. Have a panda-tastic day! 🐼🎋`,
        mood: 'happy',
        nextStage: 'ended'
      };
    }

    // Context-aware fallback responses based on conversation stage
    if (currentStage === 'ask_study_status') {
      return {
        text: `Hmm, I see! 🤔 Everyone's study journey is different. Some days we learn a lot, some days we learn a little, and that's perfectly okay! The important thing is you're here and trying. What would help you right now - some study tips, a fun quiz, or just a friendly chat?`,
        mood: 'curious',
        nextStage: 'offer_help'
      };
    }

    if (currentStage === 'ask_subject') {
      return {
        text: `That sounds interesting! 🎋 I'm curious to know more about what you're learning. Is there a particular topic or subject that's on your mind today? I can help explain things or create study materials for you!`,
        mood: 'curious',
        nextStage: 'general_chat'
      };
    }

    if (currentStage === 'offer_help' || currentStage === 'offer_activity') {
      return {
        text: `I really want to help you! 🐼💕 I can generate detailed study notes on any topic, create a personalized quiz to test your knowledge, or we can just chat about your day. What would make you feel most supported right now?`,
        mood: 'happy',
        nextStage: 'general_chat'
      };
    }

    // General fallback - more personal and encouraging
    return {
      text: `Thanks for sharing that with me! 🎋 I enjoy our conversations. You know, learning is not just about studying - it's also about taking care of yourself. How are you feeling today? And is there anything specific I can help you with?`,
      mood: 'happy',
      nextStage: 'general_chat'
    };
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  };

  // Panda face based on mood
  const PandaFace = () => {
    switch(pandaMood) {
      case 'happy':
        return (
          <div className="relative">
            {/* Eyes */}
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-black rounded-full relative overflow-hidden">
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div className="w-5 h-5 bg-black rounded-full relative overflow-hidden">
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            {/* Smile */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-3 h-1.5 border-b-2 border-black rounded-full" />
            </div>
          </div>
        );
      case 'excited':
        return (
          <div className="relative">
            {/* Star eyes */}
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-[10px]">✨</span>
              </div>
              <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-[10px]">✨</span>
              </div>
            </div>
            {/* Big smile */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-2 bg-black rounded-full" />
            </div>
          </div>
        );
      case 'curious':
        return (
          <div className="relative">
            {/* Curious eyes */}
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-black rounded-full relative overflow-hidden">
                <motion.div 
                  className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full"
                  animate={{ x: [0, 2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="w-5 h-5 bg-black rounded-full relative overflow-hidden">
                <motion.div 
                  className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full"
                  animate={{ x: [0, 2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
            {/* Question mark expression */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="w-2 h-1 bg-black rounded-full" />
            </div>
          </div>
        );
      case 'sleepy':
        return (
          <div className="relative">
            {/* Sleepy eyes */}
            <div className="flex gap-3">
              <div className="w-5 h-2 bg-black rounded-full mt-1.5" />
              <div className="w-5 h-2 bg-black rounded-full mt-1.5" />
            </div>
            {/* Small smile */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="w-2 h-1 border-b border-black rounded-full" />
            </div>
            {/* Zzz */}
            <motion.span 
              className="absolute -top-2 -right-2 text-blue-400 text-xs font-bold"
              animate={{ opacity: [0, 1, 0], y: [0, -10] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              zzz
            </motion.span>
          </div>
        );
      default:
        return (
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-black rounded-full" />
            <div className="w-5 h-5 bg-black rounded-full" />
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
            {/* Header with 3D Panda */}
            <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 p-6 relative overflow-hidden">
              {/* Bamboo decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute bottom-0 left-4 w-2 h-16 bg-green-400 rounded-full" />
                <div className="absolute bottom-4 left-6 w-1.5 h-12 bg-green-400 rounded-full" />
                <div className="absolute bottom-0 right-8 w-2 h-20 bg-green-400 rounded-full" />
              </div>
              
              {/* 3D Panda Avatar */}
              <div className="flex items-center gap-4 relative z-10">
                <motion.div 
                  className="relative"
                  animate={{ 
                    y: isListening ? [0, -3, 0] : [0, -5, 0],
                  }}
                  transition={{ 
                    y: { duration: isListening ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  {/* Panda Head */}
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-lg relative overflow-hidden border-4 border-gray-200">
                    {/* Black ears */}
                    <div className="absolute -top-2 -left-1 w-6 h-6 bg-black rounded-full" />
                    <div className="absolute -top-2 -right-1 w-6 h-6 bg-black rounded-full" />
                    
                    {/* Panda Face */}
                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                      <PandaFace />
                    </div>
                    
                    {/* Nose */}
                    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-black rounded-full" />
                  </div>
                  
                  {/* Panda Body hint */}
                  <motion.div 
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-14 h-6 bg-white rounded-xl -z-10 border-2 border-gray-200"
                    animate={{ scaleY: isTyping ? [1, 0.95, 1] : 1 }}
                    transition={{ duration: 0.3, repeat: isTyping ? Infinity : 0 }}
                  />
                  
                  {/* Listening indicator */}
                  {isListening && (
                    <motion.div 
                      className="absolute -bottom-3 left-1/2 transform -translate-x-1/2"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <Mic size={14} className="text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    Panda Buddy 
                    <span className="text-2xl">🐼</span>
                  </h3>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isListening ? 'bg-red-400' : 'bg-green-400'}`} />
                    {isListening ? 'Listening...' : isTyping ? 'Typing...' : 'Online & Chatting!'}
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
                  {msg.sender === 'panda' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                      <span className="text-white text-sm">🐼</span>
                    </div>
                  )}
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'panda' 
                      ? 'bg-white/10 text-gemini-text rounded-tl-none border-l-4 border-green-500' 
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
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">🐼</span>
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 max-w-[75%] border-l-4 border-green-500">
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
                {/* Voice Input Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-full transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 text-gemini-muted'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </motion.button>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'Listening... Speak now!' : 'Type or speak to Panda...'}
                  className="flex-1 bg-transparent text-gemini-text text-sm outline-none placeholder-gemini-muted"
                  disabled={isListening}
                />
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleUserSend()}
                  disabled={!userInput.trim() || isListening}
                  className="p-2 bg-gradient-to-r from-green-600 to-green-500 rounded-full text-white disabled:opacity-40 transition-all"
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
                      setTimeout(() => handleUserSend(suggestion), 100);
                    }}
                    disabled={isListening}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs text-gemini-muted transition-colors border border-white/5 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Collapsed State - Floating Panda */
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
              Chat with Panda! 🐼
              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </motion.div>
            
            {/* 3D Panda Avatar Button */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ 
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 via-white to-gray-400 rounded-3xl blur-xl opacity-40 animate-pulse" />
              
              {/* Panda Container */}
              <div className="relative w-16 h-16 bg-white rounded-2xl shadow-2xl border-4 border-gray-200 flex items-center justify-center overflow-hidden">
                {/* Black ears */}
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-black rounded-full" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full" />
                
                {/* Face */}
                <div className="flex gap-1.5 mt-1">
                  <motion.div 
                    className="w-3 h-3 bg-black rounded-full"
                    animate={{ scaleY: [1, 0.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-3 h-3 bg-black rounded-full"
                    animate={{ scaleY: [1, 0.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.1 }}
                  />
                </div>
                
                {/* Nose */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-2 h-1.5 bg-black rounded-full" />
                
                {/* Bamboo accent */}
                <div className="absolute -bottom-1 right-0 w-3 h-4 bg-green-400 rounded-t-full opacity-80" />
              </div>
              
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                <span className="text-[10px] text-white font-bold">!</span>
              </div>
            </motion.div>
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PandaAvatar3D;
