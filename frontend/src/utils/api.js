import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

console.log('API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received - backend may be down');
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (name, email, password) => {
  try {
    console.log('Registering user:', email);
    const response = await api.post('/api/register', { name, email, password });
    console.log('Register response:', response.data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        email: email,
        name: name
      }));
    }
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('Logging in user:', email);
    const response = await api.post('/api/login', { email, password });
    console.log('Login response:', response.data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user_id,
        email: email,
        name: response.data.name
      }));
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const sendChatMessage = async (message, attachments = {}) => {
  const { image, file } = attachments;
  const payload = { message };
  if (image) payload.has_image = true;
  if (file) payload.has_file = true;
  const response = await api.post('/api/chat', payload);
  return response.data;
};

export const fetchChatHistory = async () => {
  const response = await api.get('/api/history');
  return response.data.messages || [];
};

export const fetchUserStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

// ── File Upload API ──────────────────────────────────────────────────────────
export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// ── Quiz Result Tracking API ────────────────────────────────────────────────
export const saveQuizResult = async (quizData) => {
  const response = await api.post('/api/quiz-result', quizData);
  return response.data;
};

export const getQuizStats = async () => {
  const response = await api.get('/api/quiz-stats');
  return response.data;
};

export const getQuizHistory = async (limit = 20) => {
  const response = await api.get(`/api/quiz-history?limit=${limit}`);
  return response.data;
};

export const generateQuizFromFiles = async (fileIds, difficulty = 'medium', numQuestions = 5) => {
  const response = await api.post('/api/quiz-from-files', {
    file_ids: fileIds,
    difficulty,
    num_questions: numQuestions
  });
  return response.data;
};

// ── Notes History API ───────────────────────────────────────────────────────
export const getNotesHistory = async (limit = 20) => {
  const response = await api.get(`/api/notes-history?limit=${limit}`);
  return response.data;
};

export const generateNotesFromFiles = async (fileIds, detailLevel = 'medium') => {
  const response = await api.post('/api/notes-from-files', {
    file_ids: fileIds,
    detail_level: detailLevel
  });
  return response.data;
};

// Legacy functions
export const fetchSessionHistory = async (sessionId) => {
  return fetchChatHistory();
};

export const fetchAllSessions = async () => {
  return [];
};

export const deleteSession = async (sessionId) => {
  return { success: true };
};

// Export the api instance for direct use
export { api };
