import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = async (name, email, password) => {
  const response = await api.post('/api/register', { name, email, password });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/api/login', { email, password });
  return response.data;
};

export const sendChatMessage = async (message, sessionId) => {
  const response = await api.post('/api/chat', { message, session_id: sessionId });
  // Expecting returns { response: "...", predicted_category: "..." }
  return response.data;
};

export const fetchSessionHistory = async (sessionId) => {
  const response = await api.get('/api/history', { params: { session_id: sessionId } });
  return response.data.messages || [];
};

// Dummy functions to support existing code until full refactor
export const fetchAllSessions = async () => {
  // Let's assume we store sessions in localstorage and just fetch history when active.
  return [];
};

export const deleteSession = async (sessionId) => {
  // Not explicitly mentioned in new requirements, but keeping for compatibility.
  return { success: true };
};
