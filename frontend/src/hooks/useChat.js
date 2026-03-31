import { useState, useEffect, useCallback, useRef } from 'react';
import { streamChatMessage, deleteSession } from '../utils/api';

// Generate a unique session ID
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
  // Ref to track the streaming message ID so we can append to it
  const streamingIdRef = useRef(null);

  // Persist sessions to localStorage (debounced via useEffect)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    }, 300);
    return () => clearTimeout(timer);
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateSession = useCallback((sessionId, updater) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  }, []);

  // ── Create a new chat session ──────────────────────────────────────────────
  const createNewChat = useCallback(() => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  // ── Delete a session ───────────────────────────────────────────────────────
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

  // ── Send a message (with streaming) ───────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping) return;

    const sessionId = activeSessionId; // capture at call time

    // 1. Add user message
    const userMsg = { role: 'user', content: text, id: Date.now() };
    updateSession(sessionId, s => ({
      ...s,
      title: s.messages.length === 0
        ? text.slice(0, 35) + (text.length > 35 ? '…' : '')
        : s.title,
      messages: [...s.messages, userMsg],
    }));

    // 2. Add placeholder bot message (streaming target)
    const botMsgId = Date.now() + 1;
    streamingIdRef.current = botMsgId;
    const botPlaceholder = { role: 'bot', content: '', id: botMsgId, streaming: true };
    updateSession(sessionId, s => ({
      ...s,
      messages: [...s.messages, botPlaceholder],
    }));

    setIsTyping(true);

    // 3. Stream tokens in
    await streamChatMessage(
      text,
      sessionId,
      // onToken — append each chunk to the placeholder
      (token) => {
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: s.messages.map(m =>
              m.id === botMsgId
                ? { ...m, content: m.content + token }
                : m
            ),
          };
        }));
      },
      // onDone — mark streaming complete
      () => {
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: s.messages.map(m =>
              m.id === botMsgId ? { ...m, streaming: false } : m
            ),
          };
        }));
        setIsTyping(false);
        streamingIdRef.current = null;
      },
      // onError
      (errMsg) => {
        const errMessage = {
          role: 'error',
          content: `⚠️ ${errMsg}`,
          id: Date.now() + 2,
        };
        // Replace the empty placeholder with an error bubble
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: [
              ...s.messages.filter(m => m.id !== botMsgId),
              errMessage,
            ],
          };
        }));
        setIsTyping(false);
        streamingIdRef.current = null;
      }
    );
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
