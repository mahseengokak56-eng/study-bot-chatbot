import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ChatContainer from './ChatContainer';
import InputArea from './InputArea';
import ThemeToggle from './ThemeToggle';
import { useChat } from '../hooks/useChat';
import { 
  Menu, LogOut, User, LayoutDashboard, Brain, Target, 
  FileText, HelpCircle, Sparkles, ChevronLeft, Activity,
  BookOpen, CheckCircle, AlertCircle, Zap, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentUser, api } from '../utils/api';
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
      const response = await api.post('/stress-predict', inputs);
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
      const response = await api.post('/performance-predict', inputs);
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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/quiz', { topic, difficulty, num_questions: numQuestions });
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

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    const isCorrect = option === quiz.questions[currentQuestion].correct_answer;
    if (isCorrect) setScore(score + 1);
    
    setTimeout(() => {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Quiz Generator</h2>
      </div>

      {!quiz ? (
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
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
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
      ) : showResult ? (
        <motion.div 
          className="max-w-md mx-auto text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-4">
            <div className="text-5xl mb-4">{score === quiz.total_questions ? '🎉' : score >= quiz.total_questions / 2 ? '👍' : '📚'}</div>
            <div className="text-3xl font-bold mb-2">{score} / {quiz.total_questions}</div>
            <div className="text-gray-400">
              {score === quiz.total_questions ? 'Perfect score! Excellent work!' : 
               score >= quiz.total_questions / 2 ? 'Good job! Keep learning!' : 
               'Keep practicing! You\'ll improve!'}
            </div>
          </div>
          <button
            onClick={() => { setQuiz(null); setTopic(''); }}
            className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            Generate Another Quiz
          </button>
        </motion.div>
      ) : (
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Question {currentQuestion + 1} of {quiz.total_questions}</span>
            <div className="flex-1 mx-4 bg-white/10 rounded-full h-2">
              <motion.div 
                className="bg-purple-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / quiz.total_questions) * 100}%` }}
              />
            </div>
          </div>

          <motion.div 
            key={currentQuestion}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-lg font-semibold mb-6">{quiz.questions[currentQuestion].question}</h3>
            
            <div className="space-y-3">
              {quiz.questions[currentQuestion].options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === quiz.questions[currentQuestion].correct_answer;
                const showCorrect = selectedAnswer && isCorrect;
                const showWrong = selectedAnswer === option && !isCorrect;
                
                return (
                  <button
                    key={i}
                    onClick={() => !selectedAnswer && handleAnswer(option)}
                    disabled={selectedAnswer}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      showCorrect ? 'bg-green-500/20 border border-green-500' :
                      showWrong ? 'bg-red-500/20 border border-red-500' :
                      isSelected ? 'bg-purple-500/20 border border-purple-500' :
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
                <p className="text-sm">{quiz.questions[currentQuestion].explanation}</p>
              </motion.div>
            )}
          </motion.div>
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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/notes', { topic, detail_level: detailLevel });
      setNotes(response.data);
      toast.success('Notes generated!');
    } catch (error) {
      toast.error('Failed to generate notes');
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

      {!notes ? (
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
      ) : (
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
            <h2 className="text-2xl font-bold mb-2">{notes.heading}</h2>
            <p className="text-gray-400 text-sm">Topic: {notes.topic}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              Key Points
            </h3>
            <ul className="space-y-2">
              {notes.key_points.map((point, i) => (
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

          <button
            onClick={() => { setNotes(null); setTopic(''); }}
            className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            Generate More Notes
          </button>
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
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  useEffect(() => {
    if (activeView === 'stats') {
      api.get('/dashboard').then(response => {
        setDashboardStats(response.data);
      }).catch(() => {
        toast.error('Failed to load dashboard stats');
      });
    }
  }, [activeView]);

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stress', label: 'Stress Check', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gemini-bg text-gemini-text overflow-hidden font-sans">
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
            <button className="flex items-center gap-2 text-sm text-gemini-muted hover:text-gemini-text transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <User size={18} />
              </div>
              <span className="hidden sm:inline-block">{currentUser?.name || 'User'}</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 p-2 hover:bg-gemini-hover rounded-lg transition-colors text-red-400 hover:text-red-300">
              <LogOut size={20} />
            </button>
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
                <div className="flex-1 overflow-hidden">
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
    </div>
  );
}

export default Dashboard;
