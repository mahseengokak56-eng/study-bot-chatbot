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

  // ========== COMPREHENSIVE KNOWLEDGE BASE ==========
  const knowledgeBase = {
    // Science
    gravity: "Gravity is the force that pulls objects toward each other! 🌍 On Earth, it pulls everything toward the center, which is why things fall down. Sir Isaac Newton discovered gravity when he saw an apple fall from a tree! Cool, right?",
    photosynthesis: "Photosynthesis is how plants make their food! 🌱 They use sunlight, water, and carbon dioxide to create glucose (sugar) and release oxygen. That's why plants are so important - they give us the air we breathe!",
    atom: "Atoms are the tiny building blocks of everything around us! ⚛️ They're so small that millions can fit on the tip of a pin. Every element (like oxygen, carbon, gold) is made of its own type of atom!",
    dna: "DNA is like the instruction manual for life! 🧬 It contains all the information about how living things grow, develop, and function. It's shaped like a twisted ladder called a double helix!",
    evolution: "Evolution is how living things change over many generations! 🐒➡️👨 Nature selects the traits that help organisms survive better. That's why giraffes have long necks - to reach high leaves!",
    
    // Space
    sun: "The Sun is a giant ball of hot gas (mostly hydrogen) that provides light and heat to our solar system! ☀️ It's about 93 million miles away and so big that 1.3 million Earths could fit inside it!",
    moon: "The Moon is Earth's only natural satellite! 🌙 It takes about 27 days to orbit Earth, and its gravity causes our ocean tides. We can see it because it reflects sunlight!",
    stars: "Stars are giant balls of glowing gas, mostly hydrogen and helium! ⭐ They shine because of nuclear fusion - converting hydrogen into helium and releasing huge amounts of energy!",
    blackhole: "A black hole is a region in space where gravity is so strong that nothing, not even light, can escape! 🕳️ They form when massive stars collapse. The boundary is called the 'event horizon'!",
    galaxy: "A galaxy is a massive collection of stars, gas, dust, and dark matter bound together by gravity! 🌌 Our Milky Way has about 100-400 billion stars!",
    
    // Math
    pi: "Pi (π) is approximately 3.14159... and it's the ratio of a circle's circumference to its diameter! 🥧 It's an irrational number, meaning it goes on forever without repeating!",
    pythagorean: "The Pythagorean theorem states that in a right triangle, a² + b² = c²! 📐 This means the square of the hypotenuse equals the sum of squares of the other two sides. Super useful!",
    calculus: "Calculus is the mathematics of change! 📈 It has two main branches: derivatives (rates of change) and integrals (accumulation). Newton and Leibniz invented it independently!",
    algebra: "Algebra uses symbols (usually letters like x and y) to represent unknown numbers! 🧮 It helps us solve equations and understand relationships between quantities!",
    
    // History
    ww2: "World War II was a global conflict from 1939-1945 involving most of the world's nations! 🌍 It ended with the Allied victory and led to the formation of the United Nations and the beginning of the Cold War.",
    industrial: "The Industrial Revolution (1760-1840) was when manufacturing shifted from hand production to machines! 🏭 It started in Britain and changed how people lived and worked forever!",
    ancient: "Ancient civilizations like Egypt, Mesopotamia, India, China, and Greece laid the foundations for modern society! 🏛️ They invented writing, mathematics, laws, and architecture!",
    renaissance: "The Renaissance (14th-17th century) was a 'rebirth' of art, science, and culture in Europe! 🎨 Figures like Leonardo da Vinci and Michelangelo changed how we see the world!",
    
    // Tech
    ai: "Artificial Intelligence (AI) is when computers can perform tasks that normally require human intelligence! 🤖 Like recognizing speech, making decisions, or understanding language - just like me!",
    internet: "The Internet is a global network of connected computers! 🌐 It started as ARPANET in 1969 and now connects billions of devices worldwide, letting us share information instantly!",
    computer: "A computer is an electronic device that processes data using instructions called programs! 💻 Modern computers use binary (0s and 1s) to represent all information!",
    programming: "Programming is writing instructions (code) that computers can understand and execute! 👨‍💻 Different languages (Python, JavaScript, C++) are like different human languages for computers!",
    
    // Nature
    rainbow: "Rainbows form when sunlight passes through water droplets and bends (refracts)! 🌈 The light splits into 7 colors: red, orange, yellow, green, blue, indigo, and violet!",
    earthquake: "Earthquakes happen when tectonic plates suddenly move or release energy! 🌍 The point underground where it starts is called the focus, and we measure strength on the Richter scale!",
    volcano: "Volcanoes are openings in Earth's crust where molten rock (magma), ash, and gases erupt! 🌋 Some are active (erupt often), dormant (sleeping), or extinct (dead forever)!",
    ocean: "Oceans cover about 71% of Earth's surface! 🌊 The Pacific is the largest and deepest. Oceans regulate climate, provide food, and are home to incredible marine life!",
    
    // General
    time: "Time is the ongoing sequence of events! ⏰ We measure it in seconds, minutes, hours, days. Einstein showed that time is relative - it can speed up or slow down depending on gravity and speed!",
    money: "Money is a medium of exchange that lets people trade goods and services! 💰 It started as bartering, then coins, then paper money. Now we also have digital currencies!",
    love: "Love is a complex emotion involving care, affection, and attachment! ❤️ Scientists study it as chemicals in the brain (dopamine, oxytocin), but poets and philosophers have explored it for centuries!",
    happiness: "Happiness is a state of well-being and contentment! 😊 Psychologists say it's about: positive emotions + engagement + relationships + meaning + accomplishment!",
    success: "Success means different things to different people! 🏆 For some it's wealth, for others it's happiness, relationships, or making a difference. The key is defining it for yourself!",
    education: "Education is the process of gaining knowledge, skills, values, and habits! 📚 It happens in schools, but also through experience, reading, and lifelong learning!",
    dream: "Dreams are stories and images our minds create while we sleep! 💭 Scientists think they help process emotions and memories. Some people can control dreams - that's called lucid dreaming!",
    
    // Philosophy/Deep
    meaning: "The meaning of life is a question humans have asked forever! 🤔 Some find it in happiness, others in helping others, creating, or understanding the universe. What gives YOUR life meaning?",
    existence: "Existence is the state of being real and present in the world! 🌟 Philosophers debate why anything exists at all. Science explains how, but 'why' remains one of life's biggest mysteries!",
    consciousness: "Consciousness is being aware of yourself and your surroundings! 🧠 Scientists are still studying exactly how it works. It's what makes you YOU - your thoughts, feelings, and experiences!"
  };

  // Helper function to check if question is asking for knowledge
  const findKnowledgeMatch = (msg) => {
    const lowerMsg = msg.toLowerCase();
    
    // Check for direct matches
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (lowerMsg.includes(key)) return value;
    }
    
    // Check for "what is/are" patterns
    const whatIsMatch = lowerMsg.match(/what is (an? )?(\w+)/);
    if (whatIsMatch) {
      const word = whatIsMatch[2];
      for (const [key, value] of Object.entries(knowledgeBase)) {
        if (key.includes(word) || word.includes(key)) return value;
      }
    }
    
    // Check for "how does" patterns
    if (lowerMsg.includes('how does') || lowerMsg.includes('how do')) {
      for (const [key, value] of Object.entries(knowledgeBase)) {
        if (lowerMsg.includes(key)) return value;
      }
    }
    
    return null;
  };

  // Generate contextual, flowing conversation
  const generateContextualResponse = (userMsg) => {
    const lowerMsg = userMsg.toLowerCase();
    const currentStage = conversationStage;

    // ========== STEP 1: Check for Knowledge Questions ==========
    // Try to find a knowledge match for "what is X" questions
    if (lowerMsg.startsWith('what is') || lowerMsg.startsWith('what are') || 
        lowerMsg.startsWith('how does') || lowerMsg.startsWith('how do') ||
        lowerMsg.startsWith('why is') || lowerMsg.startsWith('who is') ||
        lowerMsg.startsWith('tell me about') || lowerMsg.startsWith('explain')) {
      
      const knowledge = findKnowledgeMatch(userMsg);
      if (knowledge) {
        return {
          text: `${knowledge}\n\nIs there anything else you'd like to know? I love learning and sharing knowledge! 🎋`,
          mood: 'excited',
          nextStage: 'general_chat'
        };
      }
    }

    // ========== STEP 2: Identity & Basic Questions ==========
    if (lowerMsg.includes('who are you') || lowerMsg.includes('what are you') || 
        lowerMsg.includes('your name') || lowerMsg.includes('introduce yourself') ||
        lowerMsg.includes('tell me about yourself')) {
      return {
        text: `Hi there! I'm Panda Buddy! 🐼 I'm your friendly AI study companion here on EduNova. I know about science, math, history, technology, and I can help you with: generating study notes, creating quizzes, checking stress levels, and having fun conversations! What would you like to explore today?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    if (lowerMsg.includes('how are you') || lowerMsg.includes('how do you do')) {
      return {
        text: `I'm doing great, thanks for asking! 🎋 I just had some virtual bamboo and I'm ready to help you learn! How about you? How are you feeling today?`,
        mood: 'happy',
        nextStage: 'ask_user_status'
      };
    }

    if (lowerMsg.includes('what can you do') || lowerMsg.includes('your features') || 
        lowerMsg === 'what do you do' || lowerMsg === 'what can you do for me') {
      return {
        text: `I can do lots of things! 📚✨\n\n• Answer questions about science, math, history, tech\n• Generate study notes on any topic\n• Create personalized quizzes\n• Check your stress levels\n• Chat and motivate you\n• Voice conversations\n\nWhat interests you most?`,
        mood: 'excited',
        nextStage: 'offer_activity'
      };
    }

    // ========== STEP 3: Study Status & Emotional Check-ins ==========
    if (currentStage === 'ask_study_status' || lowerMsg.includes('study') || lowerMsg.includes('going')) {
      if (lowerMsg.includes('not good') || lowerMsg.includes('bad') || 
          lowerMsg.includes('terrible') || lowerMsg.includes('didn\'t study') ||
          lowerMsg.includes('studied nothing') || lowerMsg.includes('nothing')) {
        return {
          text: `Oh no, I'm sorry to hear that! 😟 It's okay to have off days. Even pandas have lazy days where we just eat bamboo and nap! 🎋 Tomorrow is a fresh start. Want to learn something fun to get back into the groove?`,
          mood: 'curious',
          nextStage: 'offer_help'
        };
      }

      if (lowerMsg.includes('good') || lowerMsg.includes('great') || lowerMsg.includes('well') || 
          lowerMsg.includes('awesome') || lowerMsg.includes('excellent')) {
        return {
          text: `Oh that's wonderful! 🎉 I'm so happy for you! Your hard work is paying off! What subject are you enjoying most? Or would you like to explore something completely new?`,
          mood: 'excited',
          nextStage: 'general_chat'
        };
      }

      if (lowerMsg.includes('okay') || lowerMsg.includes('alright') || lowerMsg.includes('fine')) {
        return {
          text: `I see, just an average day! That's totally normal. 🙂 Maybe we can make it more exciting - want to learn something fascinating? Ask me about space, dinosaurs, or anything you're curious about!`,
          mood: 'happy',
          nextStage: 'general_chat'
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

    // Topic-specific knowledge for common study subjects
    if (lowerMsg.includes('physics') || lowerMsg.includes('newton') || lowerMsg.includes('force') || lowerMsg.includes('motion')) {
      return {
        text: `Physics is fascinating! 📐 Newton's three laws explain how objects move: (1) Objects stay at rest or motion unless acted on, (2) Force equals mass times acceleration, (3) Every action has an equal and opposite reaction! What physics topic interests you?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    if (lowerMsg.includes('chemistry') || lowerMsg.includes('element') || lowerMsg.includes('periodic table') || lowerMsg.includes('molecule')) {
      return {
        text: `Chemistry is the study of matter and its changes! 🧪 Everything is made of elements from the periodic table. Water is H₂O (two hydrogen, one oxygen). What chemical mystery would you like to explore?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    if (lowerMsg.includes('biology') || lowerMsg.includes('cell') || lowerMsg.includes('organism') || lowerMsg.includes('living')) {
      return {
        text: `Biology is the study of life! 🧬 From tiny bacteria to giant whales, all living things have cells, need energy, grow, reproduce, and respond to their environment. What aspect of life fascinates you?`,
        mood: 'excited',
        nextStage: 'general_chat'
      };
    }

    if (lowerMsg.includes('history') || lowerMsg.includes('war') || lowerMsg.includes('ancient') || lowerMsg.includes('civilization')) {
      return {
        text: `History teaches us about our past! 📜 Ancient civilizations like Egypt built pyramids, Rome created roads and laws, and the Renaissance sparked art and science. Which era intrigues you most?`,
        mood: 'curious',
        nextStage: 'general_chat'
      };
    }

    if (lowerMsg.includes('geography') || lowerMsg.includes('country') || lowerMsg.includes('continent') || lowerMsg.includes('map')) {
      return {
        text: `Geography explores our world! 🌍 There are 7 continents, 195 countries, and incredible diversity in landscapes, cultures, and climates. Did you know Russia spans 11 time zones? Which place interests you?`,
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
        text: `I understand! 🤔 Everyone's study journey is different. Tell me - what subjects interest you? Or ask me anything you're curious about! I know about space, science, history, math, and more. What sparks your curiosity?`,
        mood: 'curious',
        nextStage: 'general_chat'
      };
    }

    if (currentStage === 'ask_subject') {
      return {
        text: `That sounds interesting! 🎋 Tell me more, or ask me a question! I can explain: photosynthesis, black holes, WWII, calculus basics, how the internet works... What topic catches your attention?`,
        mood: 'curious',
        nextStage: 'general_chat'
      };
    }

    if (currentStage === 'offer_help' || currentStage === 'offer_activity') {
      return {
        text: `I'm here to help! 🐼 You can:\n\n• Ask me "What is gravity?" or "How does photosynthesis work?"\n• Say "Generate notes on [topic]"\n• Request "Quiz me on [subject]"\n• Just chat about your day!\n\nWhat would you like to do?`,
        mood: 'happy',
        nextStage: 'general_chat'
      };
    }

    // SMART FALLBACK: Handle questions intelligently even without exact matches
    if (lowerMsg.endsWith('?') || lowerMsg.includes('why') || lowerMsg.includes('how') || lowerMsg.includes('what')) {
      return {
        text: `That's a great question! 🎋 While I don't have a specific answer for that in my knowledge base, I'd love to help you explore it! Try asking me about:\n\n• Science: gravity, atoms, DNA, evolution\n• Space: sun, moon, stars, black holes\n• Math: pi, algebra, calculus\n• History: WWII, Industrial Revolution, Ancient civilizations\n• Tech: AI, internet, programming\n\nOr type "Generate notes on [your topic]" and I'll create detailed study materials! What would you like to explore?`,
        mood: 'curious',
        nextStage: 'general_chat'
      };
    }

    // General engaging fallback
    return {
      text: `Interesting! 🐼💭 I'm always curious to learn more. Tell me - is there something specific you'd like to know? Ask me about science, space, history, or say "What can you do?" to see all my features!`,
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
