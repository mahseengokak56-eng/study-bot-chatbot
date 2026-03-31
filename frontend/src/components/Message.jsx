import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ── Copy button for code blocks ───────────────────────────────────────────────
function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      title="Copy code"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

// ── Markdown components config ────────────────────────────────────────────────
const markdownComponents = {
  // Code blocks with syntax highlighting
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (!inline && match) {
      return (
        <div className="relative group my-3 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[#1d1d1d] border-b border-[#333] text-xs text-gray-400 font-mono">
            <span>{match[1]}</span>
          </div>
          <CopyButton code={codeString} />
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: '#1a1a1a',
              fontSize: '0.85rem',
              lineHeight: '1.6',
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }

    // Inline code
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#e06c75] font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Headings
  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-gray-200">{children}</h3>,

  // Paragraphs
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,

  // Lists
  ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed text-gray-200">{children}</li>,

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gemini-primary pl-4 my-3 italic text-gray-400">
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
      {children}
    </a>
  ),

  // Table
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[#444] bg-[#1e1e1e] px-3 py-2 text-left font-semibold text-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[#444] px-3 py-2 text-gray-300">{children}</td>
  ),

  // Horizontal rule
  hr: () => <hr className="border-[#333] my-4" />,

  // Strong / Em
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
};

// ── Main Message component ────────────────────────────────────────────────────
export default function Message({ message }) {
  const isBot = message.role === 'bot';
  const isError = message.role === 'error';
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={clsx(
        "flex w-full px-4 md:px-6 mx-auto max-w-3xl mb-6 space-x-4",
        isUser ? "justify-end flex-row-reverse space-x-reverse" : "justify-start"
      )}
    >
      {/* Avatar */}
      <div className={clsx(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
        isBot && "bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-md",
        isUser && "bg-gemini-userBubble text-gray-300",
        isError && "bg-red-900/50 text-red-400"
      )}>
        {isBot && <Bot size={17} strokeWidth={2} />}
        {isUser && <User size={17} />}
        {isError && <AlertTriangle size={17} />}
      </div>

      {/* Message bubble */}
      <div className={clsx(
        "rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed",
        isBot && "text-gemini-text bg-transparent py-1",
        isUser && "text-gray-100 bg-gemini-userBubble shadow-sm px-4 py-3",
        isError && "text-red-300 bg-red-950/40 border border-red-800/50 px-4 py-3"
      )}>
        {isBot ? (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content || ' '}
            </ReactMarkdown>
            {/* Blinking cursor while streaming */}
            {message.streaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block w-0.5 h-4 bg-gemini-primary ml-0.5 align-middle rounded-sm"
              />
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </motion.div>
  );
}
