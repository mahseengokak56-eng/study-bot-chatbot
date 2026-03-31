import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import InputArea from './components/InputArea';
import { useChat } from './hooks/useChat';
import { Menu } from 'lucide-react';

function App() {
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

  const closeSidebar = () => setIsSidebarOpen(false);

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

        {/* Mobile top bar */}
        <header className="absolute top-0 w-full p-4 flex items-center lg:hidden z-20 pointer-events-none">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gemini-hover rounded-full transition-colors text-gemini-text pointer-events-auto shadow-sm"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Chat feed */}
        <ChatContainer
          messages={activeSession?.messages || []}
          isTyping={isTyping}
          onSuggest={sendMessage}
        />

        {/* Input */}
        <div className="bg-gradient-to-t from-gemini-bg via-gemini-bg to-transparent pt-6 pb-2">
          <InputArea
            onSend={sendMessage}
            disabled={isTyping}
          />
          <p className="text-center text-xs text-gemini-muted mt-2 mx-auto max-w-lg mb-2 opacity-60">
            Study Bot can make mistakes. Verify important information.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
