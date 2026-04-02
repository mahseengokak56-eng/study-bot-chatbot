import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatContainer from './ChatContainer';
import InputArea from './InputArea';
import { useChat } from '../hooks/useChat';
import { Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    // Basic logout handling
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gemini-bg text-gemini-text overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={(id) => { setActiveSessionId(id); closeSidebar(); }}
        createNewChat={() => { createNewChat(); closeSidebar(); }}
        removeSession={removeSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-gemini-bg relative min-w-0">
        
        {/* Top Navbar */}
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
            <button className="flex items-center gap-2 text-sm text-gemini-muted hover:text-gemini-text transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <User size={18} />
              </div>
              <span className="hidden sm:inline-block">Profile</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 p-2 hover:bg-gemini-hover rounded-lg transition-colors text-red-400 hover:text-red-300">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Header Spacer for Chat feed */}
        <div className="h-[73px] flex-shrink-0"></div>

        {/* Chat feed */}
        <ChatContainer
          messages={activeSession?.messages || []}
          isTyping={isTyping}
          onSuggest={sendMessage}
        />

        {/* Input */}
        <div className="bg-gradient-to-t from-gemini-bg via-gemini-bg to-transparent pt-6 pb-2 border-t border-gemini-border">
          <InputArea
            onSend={sendMessage}
            disabled={isTyping}
          />
          <p className="text-center text-xs text-gemini-muted mt-2 mx-auto max-w-lg mb-2 opacity-60">
            Current Session: {activeSession?.title || 'Unknown'} - EduNova AI can make mistakes.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
