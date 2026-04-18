import { useState, useEffect, useRef, useCallback } from 'react';
import { FiFile, FiSearch, FiTrash2, FiMessageSquare, FiZap } from 'react-icons/fi';
import api from '../../api/axios';
import { useChatStore } from '../../store/useChatStore';

const CHAT_MODES = [
  {
    id: 'strict',
    name: 'Document Only',
    icon: FiFile,
    color: 'violet',
    description: 'AI answers exclusively from your uploaded documents. Perfect for exam prep.',
  },
  {
    id: 'hybrid',
    name: 'Enhanced',
    icon: FiSearch,
    color: 'sky',
    description: 'AI uses documents as base but enriches with its own knowledge.',
  },
  {
    id: 'search',
    name: 'Discover',
    icon: FiSearch,
    color: 'amber',
    description: 'AI recommends external resources and websites.',
  },
];

export default function ChatTab({ projectId }) {
  const {
    sessions,
    messages,
    activeSession,
    isSending,
    fetchSessions,
    createSession,
    deleteSession,
    setActiveSession,
    sendMessage,
    fetchMessages,
  } = useChatStore();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const projectSessions = sessions[projectId] || [];
  const currentMessages = activeSession ? (messages[activeSession.id] || []) : [];

  useEffect(() => {
    if (projectId) {
      fetchSessions(projectId);
    }
  }, [projectId, fetchSessions]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(projectId, activeSession.id);
    }
  }, [activeSession, projectId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleNewChat = (mode) => {
    setShowModeSelector(false);
    createSession(projectId, mode).then((session) => {
      setActiveSession(session);
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeSession || isSending) return;
    const content = inputValue;
    setInputValue('');
    await sendMessage(projectId, activeSession.id, content);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteSession = (sessionId) => {
    if (!window.confirm('Delete this chat?')) return;
    deleteSession(projectId, sessionId);
  };

  const getModeBadge = (mode) => {
    const modeInfo = CHAT_MODES.find(m => m.id === mode);
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full bg-${modeInfo?.color || 'gray'}-500/20 text-${modeInfo?.color || 'gray'}-400`}>
        {modeInfo?.name || mode}
      </span>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="w-72 bg-card border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => setShowModeSelector(true)}
            className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projectSessions.length === 0 ? (
            <p className="text-center text-muted py-8 text-sm">No chats yet</p>
          ) : (
            projectSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`w-full p-3 rounded-xl text-left transition-colors cursor-pointer ${
                  activeSession?.id === session.id
                    ? 'bg-primary/20 border border-primary/50'
                    : 'hover:bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-text truncate text-sm">
                    {session.title || 'New Chat'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                    className="text-muted hover:text-red-400 text-xs"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {getModeBadge(session.mode)}
                  <span className="text-xs text-muted">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {showModeSelector && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className="bg-card rounded-2xl p-6 max-w-lg w-full border border-gray-700">
              <h2 className="text-xl font-bold text-text mb-2">Choose Chat Mode</h2>
              <p className="text-muted mb-6">Select how the AI should respond to your questions.</p>
              <div className="space-y-3">
                {CHAT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleNewChat(mode.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all hover:scale-[1.02] border border-gray-700 hover:border-${mode.color}-500`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{mode.icon}</span>
                      <span className="font-semibold text-text">{mode.name}</span>
                    </div>
                    <p className="text-sm text-muted">{mode.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowModeSelector(false)}
                className="w-full mt-4 px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-muted">
            <div className="text-center">
              <FiMessageSquare className="text-4xl mb-2" />
              <p>Select a chat or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="text-center text-muted py-8">
                  <p>Start the conversation!</p>
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-card border border-gray-700 text-text'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.injected_thought && (
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          <div className="text-xs font-semibold text-amber-400 mb-1"><FiZap className="inline mr-1" /> AI Insight</div>
                          <p className="text-sm text-amber-200/80 italic">{msg.injected_thought}</p>
                        </div>
                      )}
                      {msg.sources?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.sources.map((source, i) => (
<span
                              className="px-2 py-1 text-xs bg-surface rounded-full text-muted"
                            >
                              <FiFile className="inline mr-1" /> {source.title}
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.web_sources?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.web_sources.map((source, i) => (
                            <a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 bg-surface rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <div className="font-medium text-accent text-sm">{source.title}</div>
                              <div className="text-xs text-muted truncate">{source.url}</div>
                              <div className="text-xs text-muted mt-1">{source.snippet}</div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  rows={1}
                  className="flex-1 bg-surface border border-gray-700 rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-primary resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending}
                  className="px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  Send
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {activeSession && getModeBadge(activeSession.mode)}
                <span className="text-xs text-muted">
                  {isSending ? 'Thinking...' : 'Ready'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}