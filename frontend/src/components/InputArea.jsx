import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InputArea({ onSend, disabled }) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Auto resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 144)}px`;
    }
  }, [content]);

  const handleSend = () => {
    if ((content.trim() || selectedImage || selectedFile) && !disabled) {
      onSend(content, { image: selectedImage, file: selectedFile });
      setContent('');
      setSelectedImage(null);
      setSelectedFile(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input
  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setContent((prev) => prev + ' ' + transcript);
      };
      recognition.onerror = () => setIsRecording(false);

      recognition.start();
    } else {
      alert('Voice input is not supported. Please use Chrome.');
    }
  };

  // Image upload
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage({ file, preview: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // File upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-4xl mx-auto">
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-2 p-2 bg-gemini-surface rounded-lg border border-gemini-border flex items-center gap-3"
          >
            <img src={selectedImage.preview} alt="Selected" className="w-16 h-16 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gemini-text truncate">{selectedImage.file.name}</p>
              <p className="text-xs text-gemini-muted">{(selectedImage.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-gemini-hover rounded">
              <X size={16} className="text-gemini-muted" />
            </button>
          </motion.div>
        )}

        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-2 p-2 bg-gemini-surface rounded-lg border border-gemini-border flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded flex items-center justify-center">
              <Paperclip size={20} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gemini-text truncate">{selectedFile.name}</p>
              <p className="text-xs text-gemini-muted">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gemini-hover rounded">
              <X size={16} className="text-gemini-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-end w-full bg-gemini-surface rounded-3xl border border-gemini-border focus-within:border-gemini-muted focus-within:shadow-xl transition-all shadow-lg">
        {/* Left action buttons - properly aligned */}
        <div className="flex items-center pl-3 pb-3 pt-3 gap-0.5 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => imageInputRef.current?.click()} 
            disabled={disabled || selectedImage}
            className="p-2.5 rounded-xl text-gemini-muted hover:bg-gemini-hover hover:text-gemini-text transition-all duration-200 disabled:opacity-40" 
            title="Upload image"
          >
            <ImageIcon size={20} />
          </motion.button>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()} 
            disabled={disabled || selectedFile}
            className="p-2.5 rounded-xl text-gemini-muted hover:bg-gemini-hover hover:text-gemini-text transition-all duration-200 disabled:opacity-40" 
            title="Upload file"
          >
            <Paperclip size={20} />
          </motion.button>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Textarea */}
        <textarea 
          ref={textareaRef} 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="Message EduNova AI..."
          className="flex-1 bg-transparent text-gemini-text border-none focus:outline-none focus:ring-0 resize-none px-3 py-4 m-0 overflow-y-auto align-bottom text-base max-h-36 block placeholder-gemini-muted"
          rows={1} 
          disabled={disabled} 
        />

        {/* Right action buttons - properly aligned */}
        <div className="flex items-center pr-3 pb-3 pt-3 gap-1 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }}
            onClick={startVoiceInput} 
            disabled={disabled || isRecording}
            className={`p-2.5 rounded-xl transition-all duration-200 ${isRecording ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-gemini-muted hover:bg-gemini-hover hover:text-gemini-text'} disabled:opacity-40`}
            title="Voice input"
          >
            <Mic size={20} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }}
            onClick={handleSend} 
            disabled={!content.trim() && !selectedImage && !selectedFile || disabled}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:hover:from-blue-600 disabled:hover:to-purple-600 transition-all shadow-lg"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>

      {isRecording && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center justify-center gap-2 text-red-400 text-sm"
        >
          <motion.div 
            className="w-2 h-2 rounded-full bg-red-400"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          Recording... Speak now
        </motion.div>
      )}
    </div>
  );
}
