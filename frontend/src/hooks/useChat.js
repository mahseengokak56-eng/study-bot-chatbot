import { useState, useEffect, useCallback } from 'react';
import { sendChatMessage, deleteSession } from '../utils/api';

const generateId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const createNewSession = () => ({
  id: generateId(),
  title: "New Chat",
  messages: [],
  createdAt: new Date().toISOString(),
});

export function useChat() {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_sessions');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && parsed.length > 0 ? parsed : [createNewSession()];
    } catch {
      return [createNewSession()];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(
    () => sessions[0]?.id || generateId()
  );
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    }, 300);
    return () => clearTimeout(timer);
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const updateSession = useCallback((sessionId, updater) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  }, []);

  const createNewChat = useCallback(() => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  const removeSession = useCallback(async (sessionId) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      if (remaining.length === 0) {
        const fresh = createNewSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (sessionId === activeSessionId) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
    try { await deleteSession(sessionId); } catch { /* silent */ }
  }, [activeSessionId]);

  const sendMessage = useCallback(async (text, attachments = {}) => {
    const { image, file } = attachments;
    if (!text.trim() && !image && !file || isTyping) return;

    const sessionId = activeSessionId;
    const messageContent = text + (image ? '\n[Image attached]' : '') + (file ? `\n[File: ${file.name}]` : '');

    const userMsg = { role: 'user', content: messageContent, id: Date.now(), image: image?.preview, file: file?.name };
    updateSession(sessionId, s => ({
      ...s,
      title: s.messages.length === 0
        ? text.slice(0, 35) + (text.length > 35 ? '…' : '')
        : s.title,
      messages: [...s.messages, userMsg],
    }));

    setIsTyping(true);

    try {
      const response = await sendChatMessage(text, { image, file });
      const fullText = response.response || "Sorry, I couldn't process that.";
      const category = response.predicted_category || "general";

      const botMsgId = Date.now() + 1;
      const botPlaceholder = { role: 'bot', content: '', id: botMsgId, predictedCategory: category, predictedCategoryDisplay: category };
      updateSession(sessionId, s => ({
        ...s,
        messages: [...s.messages, botPlaceholder],
      }));

      // Simulate typing effect
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        currentIndex += 3; // Type faster
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: s.messages.map(m =>
              m.id === botMsgId
                ? { ...m, content: fullText.slice(0, currentIndex) }
                : m
            ),
          };
        }));
        
        if (currentIndex >= fullText.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, 10);
    } catch (err) {
      console.error('Chat error:', err);
      const errMessage = {
        role: 'error',
        content: `⚠️ Error: ${err.response?.data?.detail || err.message || 'Failed to get response'}`,
        id: Date.now() + 2,
      };
      updateSession(sessionId, s => ({
        ...s,
        messages: [...s.messages, errMessage],
      }));
      setIsTyping(false);
    }
  }, [activeSessionId, isTyping, updateSession]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewChat,
    removeSession,
    sendMessage,
    isTyping,
  };
}
