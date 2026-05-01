import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ChatContainer from './ChatContainer';
import InputArea from './InputArea';
import ThemeToggle from './ThemeToggle';
import MagicalCursor from './MagicalCursor';
import { useChat } from '../hooks/useChat';
import { 
  Menu, LogOut, User, LayoutDashboard, Brain, Target, 
  FileText, HelpCircle, Sparkles, ChevronLeft, Activity,
  BookOpen, CheckCircle, AlertCircle, Zap, MessageSquare,
  Upload, FolderOpen, Image, File, TrendingUp, History,
  Award, BarChart3, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentUser, api, uploadFiles, checkBackendHealth, saveQuizResult, getQuizStats, getQuizHistory, getNotesHistory, generateQuizFromFiles, generateNotesFromFiles, getRecommendations } from '../utils/api';
import AssistantBot from './AssistantBot';
import toast from 'react-hot-toast';

// Dashboard Stats Component
function StatsDashboard({ stats, onBack }) {
  const categoryColors = {
    academic: 'bg-blue-500',
    stress: 'bg-amber-500',
    motivation: 'bg-green-500',
    tips: 'bg-purple-500',
    general: 'bg-gray-500'
  };

  const totalCategories = Object.values(stats.category_distribution || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Your Learning Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-blue-400" />
            <span className="text-gray-400 text-sm">Total Queries</span>
          </div>
          <div className="text-3xl font-bold">{stats.total_queries || 0}</div>
        </motion.div>

        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Brain size={20} className="text-purple-400" />
            <span className="text-gray-400 text-sm">ML Predictions</span>
          </div>
          <div className="text-3xl font-bold">{totalCategories}</div>
        </motion.div>

        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity size={20} className="text-green-400" />
            <span className="text-gray-400 text-sm">Stress Checks</span>
          </div>
          <div className="text-3xl font-bold">{stats.stress_predictions || 0}</div>
        </motion.div>

        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Target size={20} className="text-purple-400" />
            <span className="text-gray-400 text-sm">Performance Checks</span>
          </div>
          <div className="text-3xl font-bold">{stats.performance_predictions || 0}</div>
        </motion.div>

        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle size={20} className="text-pink-400" />
            <span className="text-gray-400 text-sm">Quizzes Taken</span>
          </div>
          <div className="text-3xl font-bold">{stats.total_quizzes || 0}</div>
        </motion.div>
      </div>

      {/* Category Distribution */}
      <motion.div 
        className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-semibold mb-4">Message Categories</h3>
        <div className="space-y-3">
          {Object.entries(stats.category_distribution || {}).map(([category, count]) => {
            const percentage = totalCategories > 0 ? (count / totalCategories) * 100 : 0;
            return (
              <div key={category} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${categoryColors[category] || 'bg-gray-500'}`} />
                <span className="capitalize w-24">{category}</span>
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className={`h-full ${categoryColors[category] || 'bg-gray-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top Topics */}
      <motion.div 
        className="bg-white/5 border border-white/10 rounded-xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-semibold mb-4">Recent Topics</h3>
        <div className="flex flex-wrap gap-2">
          {(stats.top_topics || []).map((topic, i) => (
            <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm">
              {topic}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Stress Predictor Component
function StressPredictor({ onBack }) {
  const [inputs, setInputs] = useState({ study_hours: 6, sleep_hours: 7, screen_time: 5 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/stress-predict', inputs);
      setResult(response.data);
      toast.success('Stress level analyzed!');
    } catch (error) {
      toast.error('Failed to analyze stress level');
    }
    setLoading(false);
  };

  const levelColors = {
    Low: 'text-green-400',
    Medium: 'text-yellow-400',
    High: 'text-red-400'
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Stress Level Predictor</h2>
      </div>

      <div className="max-w-md mx-auto">
        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Daily Study Hours (0-12)</label>
              <input
                type="range"
                min="0"
                max="12"
                value={inputs.study_hours}
                onChange={(e) => setInputs({...inputs, study_hours: Number(e.target.value)})}
                className="w-full accent-purple-500"
              />
              <div className="text-center font-semibold">{inputs.study_hours} hours</div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Daily Sleep Hours (0-12)</label>
              <input
                type="range"
                min="0"
                max="12"
                value={inputs.sleep_hours}
                onChange={(e) => setInputs({...inputs, sleep_hours: Number(e.target.value)})}
                className="w-full accent-blue-500"
              />
              <div className="text-center font-semibold">{inputs.sleep_hours} hours</div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Daily Screen Time (0-12)</label>
              <input
                type="range"
                min="0"
                max="12"
                value={inputs.screen_time}
                onChange={(e) => setInputs({...inputs, screen_time: Number(e.target.value)})}
                className="w-full accent-pink-500"
              />
              <div className="text-center font-semibold">{inputs.screen_time} hours</div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <>
                <Brain size={20} />
                Analyze Stress Level
              </>
            )}
          </button>
        </motion.div>

        {result && (
          <motion.div 
            className="bg-white/5 border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-1">Your Stress Level</div>
              <div className={`text-4xl font-bold ${levelColors[result.level]}`}>
                {result.level}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Confidence: {result.confidence}%
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-sm">{result.recommendation}</p>
            </div>

            {result.tips.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Tips for You:</h4>
                <ul className="space-y-1">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                      <CheckCircle size={14} className="mt-0.5 text-green-400 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Performance Predictor Component
function PerformancePredictor({ onBack }) {
  const [inputs, setInputs] = useState({ attendance: 85, study_hours: 4, assignments_completed: 80 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/performance-predict', inputs);
      setResult(response.data);
      toast.success('Performance analyzed!');
    } catch (error) {
      toast.error('Failed to analyze performance');
    }
    setLoading(false);
  };

  const levelColors = {
    Excellent: 'text-green-400',
    Good: 'text-blue-400',
    Average: 'text-yellow-400',
    Poor: 'text-red-400'
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Performance Predictor</h2>
      </div>

      <div className="max-w-md mx-auto">
        <motion.div 
          className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Attendance % (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={inputs.attendance}
                onChange={(e) => setInputs({...inputs, attendance: Number(e.target.value)})}
                className="w-full accent-green-500"
              />
              <div className="text-center font-semibold">{inputs.attendance}%</div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Daily Study Hours (0-12)</label>
              <input
                type="range"
                min="0"
                max="12"
                value={inputs.study_hours}
                onChange={(e) => setInputs({...inputs, study_hours: Number(e.target.value)})}
                className="w-full accent-blue-500"
              />
              <div className="text-center font-semibold">{inputs.study_hours} hours</div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Assignment Completion % (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={inputs.assignments_completed}
                onChange={(e) => setInputs({...inputs, assignments_completed: Number(e.target.value)})}
                className="w-full accent-purple-500"
              />
              <div className="text-center font-semibold">{inputs.assignments_completed}%</div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <>
                <Target size={20} />
                Predict Performance
              </>
            )}
          </button>
        </motion.div>

        {result && (
          <motion.div 
            className="bg-white/5 border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-1">Predicted Performance</div>
              <div className={`text-3xl font-bold ${levelColors[result.level]}`}>
                {result.level}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Confidence: {result.confidence}% • Overall: {result.scores?.overall}/100
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-sm">{result.recommendation}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-sm">Improvement Tips:</h4>
              <ul className="space-y-1">
                {result.improvement_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <Zap size={14} className="mt-0.5 text-yellow-400 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Quiz Generator Component
function QuizGenerator({ onBack }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'files', 'history', 'stats'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileIds, setFileIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizStats, setQuizStats] = useState(null);

  useEffect(() => {
    loadQuizHistory();
    loadQuizStats();
  }, []);

  const loadQuizHistory = async () => {
    try {
      const data = await getQuizHistory(10);
      setQuizHistory(data.quiz_history || []);
    } catch (error) {
      console.error('Failed to load quiz history');
    }
  };

  const loadQuizStats = async () => {
    try {
      const data = await getQuizStats();
      setQuizStats(data);
    } catch (error) {
      console.error('Failed to load quiz stats');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    console.log('File upload triggered, files:', files.length);
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }

    // Validate file types and sizes
    const allowedTypes = ['.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.doc', '.docx'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(ext)) {
        toast.error(`Invalid file type: ${file.name}. Only PDF, TXT, images, and documents are allowed.`);
        e.target.value = '';
        return;
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        e.target.value = '';
        return;
      }
    }

    // Mobile-friendly: Reset input value to allow re-uploading same file
    e.target.value = '';

    setUploading(true);
    try {
      // Wake up backend first (Render cold start fix)
      toast.loading('Waking up server...', { id: 'wakeup' });
      await checkBackendHealth();
      toast.dismiss('wakeup');
      
      console.log('Uploading files:', files.map(f => f.name));
      const response = await uploadFiles(files);
      console.log('Upload response:', response);
      
      if (!response || !response.file_ids || !Array.isArray(response.file_ids)) {
        throw new Error('Invalid response from server');
      }
      
      setFileIds(response.file_ids);
      setUploadedFiles(response.files || []);
      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.dismiss('wakeup');
      if (error.code === 'ERR_NETWORK') {
        toast.error('Server is waking up. Please try again in 30 seconds.');
      } else if (error.response?.status === 413) {
        toast.error('Files too large. Please upload smaller files.');
      } else {
        toast.error(error.message || 'Something went wrong, please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/quiz', { topic, difficulty, num_questions: numQuestions });
      setQuiz(response.data);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
      toast.success('Quiz generated!');
    } catch (error) {
      toast.error('Failed to generate quiz');
    }
    setLoading(false);
  };

  const handleGenerateFromFiles = async () => {
    if (fileIds.length === 0) {
      toast.error('Please upload files first');
      return;
    }
    
    // Completely reset quiz state before generating
    setQuiz(null);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    
    setLoading(true);
    
    try {
      console.log('Generating quiz from files:', fileIds);
      const data = await generateQuizFromFiles(fileIds, difficulty, numQuestions);
      console.log('Quiz data received:', data);
      
      // Validate quiz data structure thoroughly
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid quiz data: response is not an object');
      }
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid questions data:', data.questions);
        throw new Error('Invalid quiz data: questions is not an array');
      }
      
      if (data.questions.length === 0) {
        throw new Error('Invalid quiz data: no questions found');
      }
      
      // Validate each question has required fields
      const validQuestions = data.questions.filter(q => {
        const isValid = q && 
          typeof q.question === 'string' && 
          Array.isArray(q.options) && 
          q.options.length >= 2 &&
          (q.correct_answer || q.correctAnswer);
        if (!isValid) {
          console.warn('Invalid question filtered out:', q);
        }
        return isValid;
      });
      
      if (validQuestions.length === 0) {
        throw new Error('Invalid quiz data: all questions are malformed');
      }
      
      // Use only valid questions
      const sanitizedData = {
        topic: data.topic || 'Quiz from Files',
        questions: validQuestions,
        total_questions: validQuestions.length
      };
      
      console.log('Setting quiz with', validQuestions.length, 'questions');
      setQuiz(sanitizedData);
      toast.success(`Quiz generated with ${validQuestions.length} questions!`);
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error('Failed to generate quiz: ' + (error.message || 'Something went wrong, please try again.'));
      // Ensure quiz state is completely reset on error
      setQuiz(null);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
      setSelectedAnswer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option) => {
    if (!option || !quiz?.questions?.[currentQuestion]) return;
    setSelectedAnswer(option);
    // Handle both correct_answer (snake_case) and correctAnswer (camelCase)
    const question = quiz.questions[currentQuestion];
    const correctAnswer = question?.correct_answer || question?.correctAnswer || '';
    const normalizedOption = String(option).trim().toLowerCase();
    const normalizedCorrect = String(correctAnswer).trim().toLowerCase();
    const isCorrect = normalizedOption === normalizedCorrect;
    
    console.log('Selected:', option, '| Correct:', correctAnswer, '| IsCorrect:', isCorrect);
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      scoreRef.current = newScore;
      console.log('Score updated to:', newScore);
    }
    
    setTimeout(() => {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
        console.log('Final score being saved:', scoreRef.current);
        saveQuizResultToDB(scoreRef.current);
      }
    }, 1500);
  };

  const saveQuizResultToDB = async (finalScore) => {
    try {
      await saveQuizResult({
        topic: quiz.topic,
        difficulty: difficulty,
        score: finalScore,
        total_questions: quiz.total_questions
      });
      loadQuizStats();
      loadQuizHistory();
    } catch (error) {
      console.error('Failed to save quiz result');
    }
  };

  const levelColors = {
    Low: 'text-green-400',
    Medium: 'text-yellow-400',
    High: 'text-red-400',
    Easy: 'text-green-400',
    Hard: 'text-red-400'
  };

  const improvementColor = quizStats?.improvement?.trend === 'improving' ? 'text-green-400' : 
                          quizStats?.improvement?.trend === 'declining' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Quiz Generator</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'generate', label: 'Topic Quiz', icon: HelpCircle },
          { id: 'files', label: 'From Files', icon: Upload },
          { id: 'history', label: 'History', icon: History },
          { id: 'stats', label: 'Stats', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Quiz Tab */}
      {activeTab === 'generate' && !quiz && (
        <motion.div 
          className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II, Python"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      difficulty === level
                        ? level === 'easy'
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : level === 'medium'
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                          : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Number of Questions: {numQuestions}</label>
              <input
                type="range"
                min="3"
                max="10"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <>
                <HelpCircle size={20} />
                Generate Quiz
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && !quiz && (
        <motion.div 
          className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            {/* File Upload - Mobile Friendly */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Upload Files (Images, Documents, Text files)</label>
              <div className="relative border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ zIndex: 10 }}
                  id="quiz-file-upload"
                  accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
                  capture="environment"
                />
                <Upload size={32} className="text-purple-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tap to upload files</p>
                <p className="text-gray-500 text-xs mt-1">Images, PDFs, Documents, Text files</p>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                      <File size={14} />
                      <span className="truncate">{file.filename}</span>
                      <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      difficulty === level
                        ? level === 'easy'
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : level === 'medium'
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                          : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Number of Questions: {numQuestions}</label>
              <input
                type="range"
                min="3"
                max="10"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateFromFiles}
            disabled={loading || fileIds.length === 0}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <>
                <FolderOpen size={20} />
                Generate Quiz from Files
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History size={20} className="text-purple-400" />
            Recent Quiz Attempts
          </h3>
          {quizHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No quizzes taken yet. Start your first quiz!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizHistory.slice().reverse().map((result, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{result.topic}</h4>
                      <p className="text-sm text-gray-400">
                        {new Date(result.timestamp).toLocaleDateString()} • {result.difficulty}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${result.percentage >= 70 ? 'text-green-400' : result.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {result.score}/{result.total_questions}
                      </div>
                      <div className="text-sm text-gray-400">{result.percentage?.toFixed(1)}%</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {quizStats ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <Award size={24} className="mx-auto mb-2 text-yellow-400" />
                  <div className="text-2xl font-bold">{quizStats.total_quizzes}</div>
                  <div className="text-sm text-gray-400">Total Quizzes</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <TrendingUp size={24} className={`mx-auto mb-2 ${improvementColor}`} />
                  <div className={`text-2xl font-bold ${improvementColor}`}>
                    {quizStats.improvement?.trend === 'improving' ? '↑' : quizStats.improvement?.trend === 'declining' ? '↓' : '→'}
                  </div>
                  <div className="text-sm text-gray-400">{quizStats.improvement?.change > 0 ? '+' : ''}{quizStats.improvement?.change?.toFixed(1)}%</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <BarChart3 size={24} className="mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold">{quizStats.average_percentage?.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Average Score</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold">{quizStats.best_score?.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Best Score</div>
                </div>
              </div>

              {quizStats.improvement?.trend === 'improving' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <p className="text-green-400 text-center">
                    🎉 Great job! Your scores are improving! Keep up the good work!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Take some quizzes to see your stats!</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Quiz Result */}
      {quiz && showResult && (
        <motion.div 
          className="max-w-md mx-auto text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-4">
            <div className="text-5xl mb-4">{score === quiz.total_questions ? '🎉' : score >= quiz.total_questions / 2 ? '👍' : '📚'}</div>
            <div className="text-3xl font-bold mb-2">{score} / {quiz.total_questions}</div>
            <div className="text-lg text-gray-400 mb-2">
              {((score / quiz.total_questions) * 100).toFixed(0)}%
            </div>
            <div className="text-gray-400">
              {score === quiz.total_questions ? 'Perfect score! Excellent work!' : 
               score >= quiz.total_questions / 2 ? 'Good job! Keep learning!' : 
               'Keep practicing! You\'ll improve!'}
            </div>
          </div>
          
          {quizStats?.improvement && (
            <motion.div 
              className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp size={20} className={improvementColor} />
                <span className={improvementColor}>
                  {quizStats.improvement.trend === 'improving' ? 'Your scores are improving!' : 
                   quizStats.improvement.trend === 'declining' ? 'Keep practicing to improve!' : 
                   'Your performance is stable'}
                </span>
              </div>
            </motion.div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => { setQuiz(null); setTopic(''); setUploadedFiles([]); setFileIds([]); }}
              className="flex-1 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              Generate Another Quiz
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-colors"
            >
              <History size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Quiz In Progress */}
      {quiz && !showResult && (
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Debug Info - Remove in production */}
          {(!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-4">
              <p className="text-red-400 font-semibold">Quiz Data Error</p>
              <p className="text-sm text-red-300">Questions: {JSON.stringify(quiz.questions?.length)}</p>
              <p className="text-sm text-red-300">Quiz: {JSON.stringify(Object.keys(quiz))}</p>
              <button 
                onClick={() => { setQuiz(null); setActiveTab('files'); }}
                className="mt-2 px-4 py-2 bg-red-500 rounded-lg text-white text-sm"
              >
                Reset Quiz
              </button>
            </div>
          )}
          
          {(!quiz.questions || !quiz.questions[currentQuestion]) ? (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-6 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-yellow-400" />
              <p className="text-yellow-400 font-semibold mb-2">Unable to load question</p>
              <p className="text-sm text-yellow-300 mb-4">The quiz data appears to be incomplete.</p>
              <button 
                onClick={() => { setQuiz(null); setActiveTab('files'); setFileIds([]); setUploadedFiles([]); }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Question {currentQuestion + 1} of {quiz.total_questions || quiz.questions.length}</span>
            <div className="flex-1 mx-4 bg-white/10 rounded-full h-2">
              <motion.div 
                className="bg-purple-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / (quiz.total_questions || quiz.questions.length)) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">Score: {score}</span>
          </div>

          <motion.div 
            key={currentQuestion}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-lg font-semibold mb-6">{quiz.questions[currentQuestion]?.question || 'Question'}</h3>
            
            <div className="space-y-3">
              {quiz.questions[currentQuestion]?.options?.map((option, i) => {
                if (!option) return null;
                const isSelected = selectedAnswer === option;
                // Handle both correct_answer (snake_case) and correctAnswer (camelCase)
                const question = quiz.questions[currentQuestion];
                const correctAnswer = question?.correct_answer || question?.correctAnswer || '';
                const normalizedOption = String(option).trim().toLowerCase();
                const normalizedCorrect = String(correctAnswer).trim().toLowerCase();
                const isCorrect = normalizedOption === normalizedCorrect;
                // Only show colors after an answer is selected
                const showCorrect = selectedAnswer && isCorrect;
                const showWrong = selectedAnswer && isSelected && !isCorrect;
                
                return (
                  <button
                    key={i}
                    onClick={() => !selectedAnswer && handleAnswer(option)}
                    disabled={selectedAnswer}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      showCorrect ? 'bg-green-500/20 border border-green-500' :
                      showWrong ? 'bg-red-500/20 border border-red-500' :
                      'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showCorrect && <CheckCircle size={20} className="text-green-400" />}
                      {showWrong && <AlertCircle size={20} className="text-red-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAnswer && (
              <motion.div 
                className="mt-4 p-4 bg-white/5 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm">{quiz.questions[currentQuestion]?.explanation || 'No explanation available.'}</p>
              </motion.div>
            )}
          </motion.div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Notes Generator Component
function NotesGenerator({ onBack }) {
  const [topic, setTopic] = useState('');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'files', 'history'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileIds, setFileIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [notesHistory, setNotesHistory] = useState([]);

  useEffect(() => {
    loadNotesHistory();
  }, []);

  const loadNotesHistory = async () => {
    try {
      const data = await getNotesHistory(10);
      setNotesHistory(data.notes_history || []);
    } catch (error) {
      console.error('Failed to load notes history');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    console.log('Notes: Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }

    // Mobile-friendly: Reset input value to allow re-uploading same file
    e.target.value = '';

    setUploading(true);
    try {
      console.log('Notes: Uploading files...');
      const response = await uploadFiles(files);
      console.log('Notes: Upload response:', response);
      console.log('Notes: File IDs received:', response.file_ids);
      if (response.file_ids && response.file_ids.length > 0) {
        setFileIds(response.file_ids);
        setUploadedFiles(response.files);
        toast.success(`${files.length} file(s) uploaded successfully!`);
      } else {
        console.error('Notes: No file_ids in response');
        toast.error('Upload failed - no file IDs returned');
      }
    } catch (error) {
      console.error('Notes: Upload failed:', error);
      console.error('Notes: Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to upload files');
    }
    setUploading(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/notes', { topic, detail_level: detailLevel });
      setNotes(response.data);
      toast.success('Notes generated!');
    } catch (error) {
      toast.error('Failed to generate notes');
    }
    setLoading(false);
  };

  const removeFile = (index) => {
    const newFiles = [...uploadedFiles];
    const newIds = [...fileIds];
    newFiles.splice(index, 1);
    newIds.splice(index, 1);
    setUploadedFiles(newFiles);
    setFileIds(newIds);
  };

  const handleGenerateFromFiles = async () => {
    if (fileIds.length === 0) {
      toast.error('Please upload files first');
      return;
    }
    setLoading(true);
    try {
      const response = await generateNotesFromFiles(fileIds, detailLevel);
      setNotes(response.data);
      toast.success('Notes generated from files!');
    } catch (error) {
      console.error('Notes generation error:', error);
      toast.error('Failed to generate notes from files');
    }
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Notes Generator</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'generate', label: 'By Topic', icon: FileText },
          { id: 'files', label: 'From Files', icon: Upload },
          { id: 'history', label: 'History', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setNotes(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate by Topic Tab */}
      {activeTab === 'generate' && !notes && (
        <motion.div 
          className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Machine Learning, Photosynthesis, Calculus"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Detail Level</label>
              <select
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              >
                <option value="brief">Brief Overview</option>
                <option value="medium">Medium Detail</option>
                <option value="detailed">Detailed Notes</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-500 hover:to-teal-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <>
                <FileText size={20} />
                Generate Notes
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* From Files Tab */}
      {activeTab === 'files' && !notes && (
        <motion.div 
          className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            {/* File Upload - Mobile Friendly */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Upload Files (Images, Documents, Text files)</label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="notes-file-upload"
                  accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
                  style={{ touchAction: 'manipulation' }}
                />
                <div
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 border border-white/10 border-dashed rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Upload size={20} className="text-green-400" />
                  <span className="text-gray-400">Click to upload files or folders</span>
                </div>
              </div>
            </div>

            {/* Uploaded Files List - Enhanced */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Selected Files ({uploadedFiles.length})</h4>
                  <button 
                    onClick={() => { setUploadedFiles([]); setFileIds([]); }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-green-500/20 rounded">
                          <File size={14} className="text-green-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate text-gray-200" title={file.filename}>{file.filename}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Detail Level</label>
              <select
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              >
                <option value="brief">Brief Overview</option>
                <option value="medium">Medium Detail</option>
                <option value="detailed">Detailed Notes</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateFromFiles}
            disabled={loading || fileIds.length === 0}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-green-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <>
                <Image size={20} />
                Generate Notes from Files
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History size={20} className="text-green-400" />
            Previous Notes
          </h3>
          {notesHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No notes generated yet. Create your first notes!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notesHistory.map((note, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    setNotes(note.notes_content);
                    setActiveTab('generate');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{note.notes_content?.heading || note.topic}</h4>
                      <p className="text-sm text-gray-400">
                        {new Date(note.timestamp).toLocaleDateString()} • {note.detail_level}
                      </p>
                      {note.uploaded_files?.length > 0 && (
                        <p className="text-xs text-blue-400 mt-1">
                          <FolderOpen size={12} className="inline mr-1" />
                          From {note.uploaded_files.length} file(s)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {note.notes_content?.key_points?.length || 0} key points
                      </span>
                      <ChevronLeft size={16} className="rotate-180 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Generated Notes Display */}
      {notes && (
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{notes.heading}</h2>
                <p className="text-gray-400 text-sm">Topic: {notes.topic}</p>
              </div>
              <button
                onClick={() => { setNotes(null); setTopic(''); setUploadedFiles([]); setFileIds([]); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              Key Points
            </h3>
            <ul className="space-y-2">
              {notes.key_points?.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-400" />
              Summary
            </h3>
            <p className="text-gray-300">{notes.summary}</p>
          </div>

          {notes.full_content && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText size={18} className="text-green-400" />
                Full Notes
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{notes.full_content}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setNotes(null); setTopic(''); setUploadedFiles([]); setFileIds([]); }}
              className="flex-1 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              Generate More Notes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl hover:from-green-500 hover:to-teal-500 transition-colors"
            >
              <History size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewChat,
    removeSession,
    sendMessage,
    isTyping,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [dashboardStats, setDashboardStats] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(false);
  const [recentTopics, setRecentTopics] = useState([]);
  const [chatCount, setChatCount] = useState(0);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const closeSidebar = () => setIsSidebarOpen(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  useEffect(() => {
    if (activeView === 'stats') {
      api.get('/api/dashboard').then(response => {
        setDashboardStats(response.data);
      }).catch(() => {
        toast.error('Failed to load dashboard stats');
      });
    }
  }, [activeView]);

  // Fetch recommendations and topics
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await getRecommendations();
        setRecommendations(data);
        setRecentTopics(data.extracted_topics || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    
    fetchRecommendations();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track chat count for assistant
  useEffect(() => {
    setChatCount(activeSession?.messages?.length || 0);
  }, [activeSession?.messages]);

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stress', label: 'Stress Check', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gemini-bg text-gemini-text overflow-hidden font-sans cursor-none">
      <MagicalCursor />
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={(id) => { setActiveSessionId(id); closeSidebar(); }}
        createNewChat={() => { createNewChat(); closeSidebar(); }}
        removeSession={removeSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full bg-gemini-bg relative min-w-0">
        <header className="absolute top-0 w-full p-4 flex items-center justify-between lg:justify-end z-20 shadow-sm bg-gemini-bg/90 backdrop-blur-sm border-b border-gemini-border">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gemini-hover rounded-full transition-colors text-gemini-text"
            >
              <Menu size={22} />
            </button>
            <span className="font-semibold tracking-wide text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              EduNova AI
            </span>
          </div>
          
          <div className="hidden lg:flex flex-1 pl-4 items-center">
             <span className="font-bold tracking-wider text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              EduNova AI
            </span>
          </div>

          <div className="flex items-center gap-4 px-4">
            <ThemeToggle />
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 text-sm text-gemini-muted hover:text-gemini-text transition-all hover:scale-105"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all">
                    <User size={18} />
                  </div>
                  {/* Active status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gemini-bg"></div>
                </div>
                <span className="hidden sm:inline-block font-medium">{currentUser?.name || 'User'}</span>
              </button>
              
              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-gemini-message-bot border border-gemini-border rounded-xl shadow-xl py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-gemini-border">
                    <p className="text-sm font-medium text-gemini-text">{currentUser?.name || 'User'}</p>
                    <p className="text-xs text-gemini-muted">{currentUser?.email || ''}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      toast.info('Profile settings coming soon!');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gemini-text hover:bg-gemini-hover transition-colors flex items-center gap-2"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button 
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <div className="mt-[73px] border-b border-gemini-border bg-gemini-bg/95 backdrop-blur-sm">
          <div className="flex overflow-x-auto px-4 py-2 gap-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeView === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'chat' && (
              <motion.div
                key="chat"
                className="h-full flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex-1 overflow-y-auto">
                  <ChatContainer
                    messages={activeSession?.messages || []}
                    isTyping={isTyping}
                    onSuggest={sendMessage}
                  />
                </div>

                <div className="bg-gradient-to-t from-gemini-bg via-gemini-bg to-transparent pt-6 pb-2 border-t border-gemini-border">
                  <InputArea
                    onSend={sendMessage}
                    disabled={isTyping}
                  />
                  <p className="text-center text-xs text-gemini-muted mt-2 mx-auto max-w-lg mb-2 opacity-60">
                    Current Session: {activeSession?.title || 'Unknown'} - EduNova AI can make mistakes.
                  </p>
                </div>
              </motion.div>
            )}

            {activeView === 'stats' && (
              <motion.div key="stats" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <StatsDashboard stats={dashboardStats} onBack={() => setActiveView('chat')} />
              </motion.div>
            )}

            {activeView === 'stress' && (
              <motion.div key="stress" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <StressPredictor onBack={() => setActiveView('chat')} />
              </motion.div>
            )}

            {activeView === 'performance' && (
              <motion.div key="performance" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PerformancePredictor onBack={() => setActiveView('chat')} />
              </motion.div>
            )}

            {activeView === 'quiz' && (
              <motion.div key="quiz" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <QuizGenerator onBack={() => setActiveView('chat')} />
              </motion.div>
            )}

            {activeView === 'notes' && (
              <motion.div key="notes" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <NotesGenerator onBack={() => setActiveView('chat')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Smart AI Assistant */}
      <AssistantBot 
        currentView={activeView}
        quizScore={recommendations?.based_on?.quiz_performance}
        stressLevel={recommendations?.based_on?.stress_level}
        recentTopics={recentTopics}
        chatCount={chatCount}
        isExpanded={isAssistantExpanded}
        setIsExpanded={setIsAssistantExpanded}
      />
    </div>
  );
}

export default Dashboard;
