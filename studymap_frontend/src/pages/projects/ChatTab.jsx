import { useState, useEffect, useRef } from 'react';
import { FiFile, FiSearch, FiTrash2, FiMessageSquare, FiZap, FiPlus, FiSend, FiX } from 'react-icons/fi';
import { useChatStore } from '../../store/useChatStore';
import '../../styles/chat.css';

const CHAT_MODES = [
  {
    id: 'strict',
    name: 'Document Only',
    icon: FiFile,
    modeClass: 'mode-violet',
    description: 'AI answers exclusively from your uploaded documents. Perfect for exam prep.',
  },
  {
    id: 'hybrid',
    name: 'Enhanced',
    icon: FiSearch,
    modeClass: 'mode-sky',
    description: 'AI uses documents as base but enriches with its own knowledge.',
  },
  {
    id: 'search',
    name: 'Discover',
    icon: FiSearch,
    modeClass: 'mode-amber',
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
      setActiveSession(null);
      fetchSessions(projectId);
    }
  }, [projectId, fetchSessions, setActiveSession]);

  useEffect(() => {
    if (projectSessions.length > 0 && !activeSession) {
      const mostRecent = [...projectSessions].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];
      setActiveSession(mostRecent);
    }
  }, [projectId, projectSessions, activeSession, setActiveSession]);

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
      <span className={`px-2 py-0.5 text-xs rounded-full ${modeInfo?.modeClass || 'bg-gray-500/20 text-gray-400'}`}>
        {modeInfo?.name || mode}
      </span>
    );
  };

  return (
    <div className="chat-root relative -m-3 p-3 overflow-hidden">
        <div className="relative z-10 flex h-[calc(100vh-4.5rem)]">
          <div className="w-60 flex flex-col">
            <div className="p-2.5 border-b">
              <button
                onClick={() => setShowModeSelector(true)}
                className="w-full glow-sky px-3 py-2 text-sm font-semibold rounded-xl transition-all hover:-translate-y-px flex items-center justify-center gap-1.5"
              >
                <FiPlus size={14} /> New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {projectSessions.length === 0 ? (
                <p className="text-center text-gray-600 py-8 text-sm fade-up">No chats yet</p>
              ) : (
                projectSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className={`session-card w-full p-2.5 rounded-xl text-left cursor-pointer ${
                      activeSession?.id === session.id ? 'active' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium truncate text-sm session-title">
                        {session.title || 'New Chat'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                        className="session-delete-btn text-xs transition-colors"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {getModeBadge(session.mode)}
                      <span className="text-xs session-date">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col ml-4">
            {showModeSelector && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
                <div className="chat-modal rounded-2xl p-6 max-w-lg w-full border fade-up">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Choose Chat Mode</h2>
                    <button
                      onClick={() => setShowModeSelector(false)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">Select how the AI should respond to your questions.</p>
                  <div className="space-y-3">
                    {CHAT_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => handleNewChat(mode.id)}
                        className="mode-option w-full p-4 rounded-xl text-left"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <mode.icon className={`text-xl ${mode.modeClass.replace('mode-', 'text-')}`} />
                          <span className="font-semibold">{mode.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">{mode.description}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowModeSelector(false)}
                    className="w-full mt-4 ghost-btn px-4 py-2.5 text-sm font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!activeSession ? (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                <div className="text-center fade-up">
                  <FiMessageSquare className="text-5xl mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a chat or start a new one</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 fade-up">
                  {currentMessages.length === 0 ? (
                    <div className="text-center text-gray-600 py-8">
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                            msg.role === 'user'
                              ? 'chat-bubble-user'
                              : 'chat-bubble-ai'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          {msg.injected_thought && (
                            <div className="ai-insight mt-2 p-2 rounded-lg">
                              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                                <FiZap size={10} /> AI Insight
                              </div>
                              <p className="text-xs italic opacity-80">{msg.injected_thought}</p>
                            </div>
                          )}
                          {msg.sources?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {msg.sources.map((source, i) => (
                                <span key={i} className="source-badge px-2 py-1 text-xs rounded-full flex items-center gap-1">
                                  <FiFile size={10} /> {source.title}
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
                                  className="block p-2 source-badge rounded-lg hover:border-sky-400/30 transition-colors"
                                >
                                  <div className="font-medium text-sky-400 text-xs">{source.title}</div>
                                  <div className="text-xs text-gray-600 truncate">{source.url}</div>
                                  <div className="text-xs text-gray-600 mt-1">{source.snippet}</div>
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
                      <div className="chat-bubble-ai rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-2.5 border-t">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question..."
                      rows={1}
                      className="input-field flex-1 rounded-xl px-3 py-2 text-sm resize-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isSending}
                      className="glow-sky px-4 text-sm font-semibold rounded-xl transition-all hover:-translate-y-px disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <FiSend size={14} /> Send
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {activeSession && getModeBadge(activeSession.mode)}
                    <span className="text-xs text-gray-600">
                      {isSending ? 'Thinking...' : 'Ready'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
  );
}