import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, ChevronLeft, ChevronRight, Sparkles,
  MessageCircle, Brain, Target, BookOpen, Zap,
  Coffee, TrendingUp, AlertCircle, Lightbulb,
  ThumbsUp, ThumbsDown, HelpCircle
} from 'lucide-react';
import { getCurrentUser, api } from '../utils/api';

// ── Smart fallback messages (used when LLM is unavailable) ───────────────────
const MOOD_FALLBACKS = {
  stressed: [
    "Things feel heavy right now \u2014 that's valid. Take one slow breath with me. \ud83d\udc99",
    "Stress is your brain saying it cares. Let's channel that into small, doable steps. \ud83c\udf31",
    "Even overwhelmed students make progress. What's one tiny thing we can cross off? \u2714\ufe0f",
  ],
  frustrated: [
    "Confusion is the exact feeling of learning. You\u2019re actually doing it right. \ud83d\udca1",
    "Stuck? That means you're pushing past your comfort zone \u2014 exactly where growth happens. \ud83d\udcaa",
    "Let\u2019s slow down and break this apart together. What\u2019s the part that feels unclear? \ud83e\udd14",
  ],
  excited: [
    "Love this energy! \ud83d\ude80 You\u2019re in a perfect state to learn fast. Let\u2019s lock this knowledge in!",
    "Momentum like this is rare \u2014 let\u2019s use it! Want to tackle a quiz while you're in the zone? \ud83c\udfaf",
    "Amazing! You\u2019re thriving today. This is exactly when deep learning happens. \u2b50",
  ],
  learning: [
    "Great question! The trick is connecting new concepts to things you already know. \ud83c\udfaf",
    "Breaking it into smaller chunks is the secret weapon of every top student. \ud83d\udcda",
    "Understanding \u2018why\u2019 before \u2018how\u2019 makes everything stick better. Want me to explain further? \ud83e\udde0",
  ],
  unmotivated: [
    "Even showing up today is progress \u2014 seriously. \ud83d\udcaa What\u2019s one tiny thing we can tackle together?",
    "Motivation follows action, not the other way around. Start with just 2 minutes. \u23f0",
    "You've overcome harder things before. This feeling is temporary. Let\u2019s take one small step. \ud83c\udf1f",
  ],
  neutral: [
    "I\u2019m here and ready to help! \ud83d\udc3c What would you like to work on today?",
    "Need help with a topic? Want a quiz? Or just need some motivation? I\u2019ve got you. \ud83d\udca1",
    "Tip: Regular breaks every 25 minutes (Pomodoro!) can double your retention. \u23f1\ufe0f",
    "Have you tried the quiz feature yet? Active recall is the #1 study technique. \ud83c\udfae",
    "You\u2019re doing great by being here. Consistency beats intensity every time. \ud83c\udf1f",
  ],
};

const getFallback = (mood) => {
  const pool = MOOD_FALLBACKS[mood] || MOOD_FALLBACKS.neutral;
  return pool[Math.floor(Math.random() * pool.length)];
};

const AssistantBot = ({
  currentView,
  quizScore,
  stressLevel,
  recentTopics = [],
  chatCount = 0,
  isExpanded: externalExpanded,
  setIsExpanded: setExternalExpanded,
  onSuggestionAccept,
  onSuggestionReject
}) => {
  const [isExpanded, setIsExpanded] = useState(externalExpanded || false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const [showResponseOptions, setShowResponseOptions] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const currentUser = getCurrentUser();
  const messageRef = useRef(0);
  const typingRef = useRef(null);

  // Sync with external expanded state
  useEffect(() => {
    if (externalExpanded !== undefined) setIsExpanded(externalExpanded);
  }, [externalExpanded]);

  // ── Core: Call PandaBuddy LLM endpoint ─────────────────────────────────────
  const callPandaBuddy = useCallback(async (promptText) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const context = {
        current_view: currentView,
        quiz_score: quizScore,
        stress_level: stressLevel,
        recent_topics: recentTopics,
        chat_count: chatCount,
      };
      // Build widget conversation history for continuity
      const widgetHistory = messageHistory.slice(-4).map(m => ({
        role: 'bot',
        content: m.text,
      }));
      const result = await api.post('/api/panda-chat', {
        message: promptText,
        context,
        conversation_history: widgetHistory,
      });
      return result.data;
    } catch (err) {
      console.error('PandaBuddy API error:', err);
      return null;
    }
  }, [currentView, quizScore, stressLevel, recentTopics, chatCount, messageHistory]);

  // ── Typewriter animation ────────────────────────────────────────────────────
  const typeMessage = useCallback((message) => {
    if (typingRef.current) clearInterval(typingRef.current);
    setIsTyping(true);
    setShowResponseOptions(false);
    setCurrentMessage('');
    let index = 0;

    typingRef.current = setInterval(() => {
      if (index <= message.length) {
        setCurrentMessage(message.slice(0, index));
        index++;
      } else {
        clearInterval(typingRef.current);
        setIsTyping(false);
        setMessageHistory(prev => [...prev, { text: message, timestamp: Date.now() }]);
        if (isSuggestionMessage(message)) {
          setCurrentSuggestion(message);
          setTimeout(() => setShowResponseOptions(true), 500);
        }
      }
    }, 28);

    return () => clearInterval(typingRef.current);
  }, []);

  // ── Generate contextual proactive message via LLM ──────────────────────────
  const generateMessage = useCallback(async () => {
    const hour = new Date().getHours();

    // First-ever message: personalised greeting
    if (messageRef.current === 0) {
      let timeOfDay = 'Hello';
      if (hour < 12) timeOfDay = 'Good morning';
      else if (hour < 17) timeOfDay = 'Good afternoon';
      else timeOfDay = 'Good evening';

      const name = currentUser?.name || 'there';
      const greetPrompt = `Generate a very short, warm ${timeOfDay.toLowerCase()} greeting for a student named ${name}. Be friendly, mention you're PandaBuddy their study companion, and ask how you can help. 2 sentences max.`;

      const result = await callPandaBuddy(greetPrompt);
      if (result?.response) return result.response;
      return `${timeOfDay}, ${name}! \ud83d\udc3c I'm PandaBuddy, your study companion. What would you like to work on today?`;
    }

    // Contextual prompts based on student data
    const candidates = [];

    if (stressLevel === 'High') {
      candidates.push("The student's stress level is HIGH. Generate a brief, calming proactive message. Be empathetic and suggest a short break or stress check. 2-3 sentences max.");
    }
    if (quizScore !== null && quizScore < 50) {
      candidates.push(`The student recently scored ${quizScore}% on a quiz. Generate a brief encouraging message acknowledging the low score and motivating them to practice more. 2-3 sentences.`);
    } else if (quizScore !== null && quizScore >= 80) {
      candidates.push(`The student scored ${quizScore}% on a quiz \u2014 great result! Generate a brief celebratory message and suggest challenging themselves further. 2-3 sentences.`);
    }
    if (recentTopics.length > 0) {
      const topic = recentTopics[recentTopics.length - 1];
      candidates.push(`The student recently studied "${topic}". Generate a brief proactive message offering to test their knowledge or generate notes on this topic. 2-3 sentences.`);
    }
    if (chatCount > 5) {
      candidates.push("The student has been very active today! Generate a brief message acknowledging their engagement and suggesting a quiz or break. 2-3 sentences.");
    }
    // Always have a general fallback prompt
    candidates.push(
      "Generate a brief, helpful and fresh study tip for a student. Make it actionable and specific. 2 sentences max.",
      "Generate a brief motivational message for a student who is studying hard. Be original and uplifting. 2 sentences.",
    );

    const prompt = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
    const result = await callPandaBuddy(prompt);
    return result?.response || getFallback(stressLevel === 'High' ? 'stressed' : 'neutral');
  }, [stressLevel, quizScore, recentTopics, chatCount, currentUser, callPandaBuddy]);

  // ── Proactive message cycle ─────────────────────────────────────────────────
  useEffect(() => {
    // Initial greeting
    if (messageRef.current === 0) {
      generateMessage().then(msg => {
        typeMessage(msg);
        messageRef.current = 1;
      });
    }

    // Send new proactive message every 60s (only when widget is open)
    const interval = setInterval(async () => {
      if (!isTyping && isExpanded) {
        messageRef.current++;
        const msg = await generateMessage();
        typeMessage(msg);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isExpanded, stressLevel, quizScore, recentTopics, chatCount, isTyping]);

  // Refresh message when context changes significantly
  useEffect(() => {
    if (messageRef.current > 0 && !isTyping && isExpanded) {
      generateMessage().then(msg => typeMessage(msg));
    }
  }, [currentView, stressLevel, quizScore]);

  // ── Suggestion detection (for Yes/No buttons) ──────────────────────────────
  const isSuggestionMessage = (msg) => {
    const patterns = [
      'want to test', 'try a quiz', 'need help', 'ready for',
      'how about', 'would you like', 'shall we', 'should we',
      'generate notes', 'stress check', 'take a break',
    ];
    return patterns.some(p => msg.toLowerCase().includes(p));
  };

  const handleYesResponse = async () => {
    setShowResponseOptions(false);
    const result = await callPandaBuddy("The student said YES to the suggestion. Respond enthusiastically and give them a concrete next step. 1-2 sentences.");
    const response = result?.response || "Great! Let's do it! \ud83d\ude80";
    typeMessage(response);
    if (onSuggestionAccept && currentSuggestion) onSuggestionAccept(currentSuggestion);
  };

  const handleNoResponse = async () => {
    setShowResponseOptions(false);
    const result = await callPandaBuddy("The student said NO to the suggestion. Respond warmly and offer an alternative or just be supportive. 1-2 sentences.");
    const response = result?.response || "No problem! I'm here whenever you're ready. \ud83e\udd1d";
    typeMessage(response);
    if (onSuggestionReject && currentSuggestion) onSuggestionReject(currentSuggestion);
  };

  // ── Quick action buttons ────────────────────────────────────────────────────
  const handleStudyHelp = async () => {
    const prompt = recentTopics.length > 0
      ? `The student wants study help. Their recent topics are: ${recentTopics.join(', ')}. Offer specific help and ask what they need. 2-3 sentences.`
      : "The student wants study help but hasn't studied any specific topic yet. Ask them what subject they're working on and how you can assist. 2 sentences.";
    const result = await callPandaBuddy(prompt);
    typeMessage(result?.response || "What topic would you like help with? I'm here to explain concepts, solve problems, or generate notes! \ud83d\udcda");
  };

  const handleBreakTip = async () => {
    const result = await callPandaBuddy(
      "Give the student a specific, fresh tip about taking productive study breaks. Include one actionable technique. 2-3 sentences."
    );
    typeMessage(result?.response || "The Pomodoro technique: 25 minutes focused study, then a 5-minute break. It dramatically improves retention and prevents burnout! \u23f1\ufe0f");
  };

  const handleQuizTip = async () => {
    const prompt = recentTopics.length > 0
      ? `Encourage the student to take a quiz on one of their recent topics: ${recentTopics.slice(-2).join(' or ')}. Make it enthusiastic and specific. 2 sentences.`
      : "Encourage the student to try the quiz feature with a specific tip about active recall as a study technique. 2-3 sentences.";
    const result = await callPandaBuddy(prompt);
    typeMessage(result?.response || "Quiz yourself regularly! Active recall is scientifically proven to be the most effective study technique. \ud83c\udfae");
  };

  const handleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (setExternalExpanded) setExternalExpanded(newState);
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
              {/* Current Assistant Message */}
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-white/5 rounded-lg p-3 max-w-[220px]">
                    <p className="text-sm text-gemini-text">{currentMessage}</p>
                    {isTyping && (
                      <span className="text-gemini-muted text-xs">Typing...</span>
                    )}
                  </div>

                  {/* Yes/No Response Buttons */}
                  <AnimatePresence>
                    {showResponseOptions && !isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        className="flex gap-2 mt-2 ml-1"
                      >
                        <button
                          onClick={handleYesResponse}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-full text-xs font-medium transition-all border border-green-500/30"
                        >
                          <ThumbsUp size={12} />
                          Yes
                        </button>
                        <button
                          onClick={handleNoResponse}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full text-xs font-medium transition-all border border-red-500/30"
                        >
                          <ThumbsDown size={12} />
                          No
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Message History (last 3) */}
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
                  onClick={handleStudyHelp}
                  disabled={isTyping}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gemini-text transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Brain size={12} />
                  Study Help
                </button>
                <button
                  onClick={handleBreakTip}
                  disabled={isTyping}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gemini-text transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Coffee size={12} />
                  Break Tip
                </button>
                <button
                  onClick={handleQuizTip}
                  disabled={isTyping}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gemini-text transition-colors flex items-center gap-1 disabled:opacity-50"
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
