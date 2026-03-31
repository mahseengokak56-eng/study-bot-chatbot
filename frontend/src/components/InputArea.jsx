import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function InputArea({ onSend, disabled }) {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  // Auto resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap the vertical growth at ~144px (about 6 lines)
      textareaRef.current.style.height = `${Math.min(scrollHeight, 144)}px`;
    }
  }, [content]);

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content);
      setContent('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-4xl mx-auto flex items-end">
      <div className="relative flex items-end w-full bg-[#1E1F20] rounded-3xl border border-gemini-border focus-within:border-gemini-muted transition-colors shadow-sm">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Study Bot a question..."
          className="w-full bg-transparent text-gemini-text border-none focus:outline-none focus:ring-0 resize-none px-6 py-4 m-0 overflow-y-auto align-bottom text-base max-h-36 block placeholder-gemini-muted"
          rows={1}
          disabled={disabled}
        />
        
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="mr-3 mb-2.5 p-2 rounded-full text-gemini-primary hover:bg-[#333537] disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center justify-center h-10 w-10 shrink-0"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
