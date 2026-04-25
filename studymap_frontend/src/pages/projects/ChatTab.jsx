import { useState, useEffect, useRef } from 'react';
import { FiFile, FiSearch, FiTrash2, FiMessageSquare, FiZap, FiPlus, FiSend, FiX, FiChevronLeft, FiMenu } from 'react-icons/fi';
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
    sessions, messages, activeSession, isSending,
    fetchSessions, createSession, deleteSession,
    setActiveSession, sendMessage, fetchMessages,
  } = useChatStore();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

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
    if (activeSession) fetchMessages(projectId, activeSession.id);
  }, [activeSession, projectId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputValue]);

  const handleNewChat = (mode) => {
    setShowModeSelector(false);
    createSession(projectId, mode).then((session) => {
      setActiveSession(session);
      setShowDrawer(false);
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeSession || isSending) return;
    const content = inputValue;
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
      <span className={`mode-badge px-2 py-0.5 text-xs rounded-full ${modeInfo?.modeClass || ''}`}>
        {modeInfo?.name || mode}
      </span>
    );
  };

  const selectSession = (session) => {
    setActiveSession(session);
    setShowDrawer(false);
  };

  return (
    <div className="chat-root chat-shell tab-root">

      {/* ── Sidebar (desktop) / Drawer (mobile) ─────────────────────────── */}
      {/* Backdrop */}
      {showDrawer && (
        <div
          className="chat-drawer-backdrop"
          onClick={() => setShowDrawer(false)}
        />
      )}

      <aside className={`chat-sidebar ${showDrawer ? 'chat-sidebar--open' : ''}`}>
        <div className="chat-sidebar-header">
          <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">Chats</span>
          <button
            onClick={() => setShowModeSelector(true)}
            className="glow-sky new-chat-btn"
          >
            <FiPlus size={14} /> New
          </button>
        </div>

        <div className="chat-session-list">
          {projectSessions.length === 0 ? (
            <p className="text-center text-gray-600 py-10 text-sm fade-up">No chats yet</p>
          ) : (
            projectSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => selectSession(session)}
                className={`session-card ${activeSession?.id === session.id ? 'active' : ''}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium truncate text-sm session-title">
                    {session.title || 'New Chat'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                    className="session-delete-btn"
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
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────── */}
      <div className="chat-main">

        {/* Mobile top bar */}
        <div className="chat-topbar">
          <button
            onClick={() => setShowDrawer(true)}
            className="chat-topbar-btn md:hidden"
            aria-label="Open chats"
          >
            <FiMenu size={18} />
          </button>
          <div className="flex-1 min-w-0">
            {activeSession ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {activeSession.title || 'New Chat'}
                </span>
                {getModeBadge(activeSession.mode)}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Select a chat</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center fade-up px-8">
                <div className="chat-empty-icon">
                  <FiMessageSquare size={28} />
                </div>
                <p className="text-sm text-gray-500 mt-3">Start a new chat or select one</p>
                <button
                  onClick={() => setShowModeSelector(true)}
                  className="glow-sky mt-4 px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-1.5 mx-auto"
                >
                  <FiPlus size={14} /> New Chat
                </button>
              </div>
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center fade-up px-8">
                <p className="text-sm text-gray-500">Ask anything about your documents</p>
              </div>
            </div>
          ) : (
            <div className="chat-messages-inner">
              {currentMessages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`chat-msg-row ${msg.role === 'user' ? 'chat-msg-row--user' : 'chat-msg-row--ai'}`}
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>

                    {msg.injected_thought && (
                      <div className="ai-insight mt-2 p-2.5 rounded-xl">
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
                      <div className="mt-2 space-y-1.5">
                        {msg.web_sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 source-badge rounded-xl hover:border-sky-400/30 transition-colors"
                          >
                            <div className="font-medium text-sky-400 text-xs">{source.title}</div>
                            <div className="text-xs text-gray-500 truncate">{source.url}</div>
                            {source.snippet && <div className="text-xs text-gray-500 mt-0.5">{source.snippet}</div>}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="chat-msg-row chat-msg-row--ai">
                  <div className="chat-bubble chat-bubble--ai">
                    <div className="flex gap-1.5 items-center py-0.5">
                      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                      <span className="typing-dot" style={{ animationDelay: '160ms' }} />
                      <span className="typing-dot" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar — pinned to bottom, above mobile keyboard */}
        {activeSession && (
          <div className="chat-input-bar">
            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question…"
                rows={1}
                className="chat-input"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="chat-send-btn glow-sky"
                aria-label="Send"
              >
                <FiSend size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mode selector modal ──────────────────────────────────────────── */}
      {showModeSelector && (
        <div className="chat-modal-overlay" onClick={() => setShowModeSelector(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold">Choose Chat Mode</h2>
              <button onClick={() => setShowModeSelector(false)} className="text-gray-500 hover:text-gray-300 p-1">
                <FiX size={18} />
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">Select how the AI should respond.</p>
            <div className="space-y-2">
              {CHAT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleNewChat(mode.id)}
                  className="mode-option w-full p-3.5 rounded-xl text-left"
                >
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <mode.icon size={16} className={`flex-shrink-0 ${mode.modeClass.replace('mode-', 'text-')}`} />
                    <span className="font-semibold text-sm">{mode.name}</span>
                    <span className={`ml-auto mode-badge px-2 py-0.5 text-xs rounded-full ${mode.modeClass}`}>
                      {mode.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 pl-6">{mode.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModeSelector(false)}
              className="w-full mt-3 ghost-btn px-4 py-2.5 text-sm font-medium rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}