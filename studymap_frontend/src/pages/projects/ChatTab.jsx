import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiFile, FiSearch, FiTrash2, FiMessageSquare,
  FiZap, FiPlus, FiSend, FiX, FiArrowLeft, FiMenu,
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../../store/useChatStore';
import '../../styles/chat.css';

const CHAT_MODES = [
  {
    id: 'strict',
    name: 'Document Only',
    icon: FiFile,
    modeClass: 'mode-violet',
    description: 'Answers exclusively from your uploaded documents. Perfect for exam prep.',
  },
  {
    id: 'hybrid',
    name: 'Enhanced',
    icon: FiSearch,
    modeClass: 'mode-sky',
    description: 'Uses documents as a base and enriches with broader knowledge.',
  },
  {
    id: 'search',
    name: 'Discover',
    icon: FiSearch,
    modeClass: 'mode-amber',
    description: 'Recommends external resources and websites for deeper research.',
  },
];

export default function ChatTab({ projectId, onExit }) {
  const {
    sessions, messages, activeSession, isSending,
    fetchSessions, createSession, deleteSession,
    setActiveSession, sendMessage, fetchMessages,
  } = useChatStore();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [sidebarOpen, setSidebarOpen]           = useState(false); // mobile only
  const [inputValue, setInputValue]             = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const projectSessions = useMemo(() =>
    [...(sessions[projectId] || [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ),
    [sessions, projectId]
  );
  const currentMessages = activeSession ? (messages[activeSession.id] || []) : [];

  /* ── content helpers ── */
  const processContent = (content) =>
    content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/^([A-D])\.\s+/gm, '$1. ');

  const markdownComponents = useMemo(() => ({
    ol: ({ node, ...props }) => {
      const hasLetters = (node?.children || []).every(
        item => /^[A-D]\./.test(item.children?.[0]?.value || '')
      );
      return hasLetters ? <ol {...props} data-lettered /> : <ol {...props} />;
    },
    li: ({ node, ...props }) => {
      const match = (node?.children?.[0]?.value || '').match(/^([A-D])\.\s+(.*)/);
      return match
        ? <li data-letter={match[1]} {...props}>{match[2]}</li>
        : <li {...props} />;
    },
  }), []);

  /* ── effects ── */
  useEffect(() => {
    if (projectId) { setActiveSession(null); fetchSessions(projectId); }
  }, [projectId, fetchSessions, setActiveSession]);

  useEffect(() => {
    if (projectSessions.length > 0 && !activeSession) {
      setActiveSession(projectSessions[0]);
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
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [inputValue]);

  /* ── handlers ── */
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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(projectId, activeSession.id, content);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    deleteSession(projectId, sessionId);
  };

  const selectSession = (session) => {
    setActiveSession(session);
    setSidebarOpen(false); // close on mobile after picking
  };

  const getModeBadge = (mode) => {
    const m = CHAT_MODES.find(x => x.id === mode);
    return m ? (
      <span className={`mode-badge px-1.5 py-0.5 rounded-full ${m.modeClass}`}>
        {m.name}
      </span>
    ) : null;
  };

  const activeMode = activeSession
    ? CHAT_MODES.find(m => m.id === activeSession.mode)
    : null;

  /* ── render ── */
  return (
    <div className="chat-root">

      {/* ══════════════════════════════════════════════
          LEFT SIDEBAR — sessions list
          ══════════════════════════════════════════════ */}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="chat-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar--open' : ''}`}>

        {/* Sidebar header */}
        <div className="chat-sidebar-header">
          <span className="chat-sidebar-title">Chats</span>
          <button
            onClick={() => setShowModeSelector(true)}
            className="sidebar-new-btn"
            aria-label="New chat"
          >
            <FiPlus size={14} />
          </button>
        </div>

        {/* Sessions list */}
        <div className="chat-sidebar-sessions">
          {projectSessions.length === 0 ? (
            <div className="sessions-empty">
              <p>No chats yet.<br />Start one to begin.</p>
              <button
                onClick={() => setShowModeSelector(true)}
                className="glow-sky mt-2 px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5"
              >
                <FiPlus size={12} /> New Chat
              </button>
            </div>
          ) : (
            projectSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => selectSession(session)}
                className={`session-item ${activeSession?.id === session.id ? 'active' : ''}`}
              >
                <div className="session-item-body">
                  <span className="session-item-title">
                    {session.title || 'New Chat'}
                  </span>
                  <div className="session-item-meta">
                    {getModeBadge(session.mode)}
                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="session-delete-btn"
                  aria-label="Delete session"
                >
                  <FiTrash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar footer */}
        <div className="chat-sidebar-footer">
          <button onClick={onExit || (() => {})} className="sidebar-exit-btn">
            <FiArrowLeft size={14} />
            Back to project
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN AREA — topbar + messages + input
          ══════════════════════════════════════════════ */}
      <div className="chat-main">

        {/* Topbar */}
        <div className="chat-topbar">
          {/* Mobile sidebar toggle */}
          <button
            className="topbar-sidebar-btn"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Toggle sessions"
          >
            <FiMenu size={15} />
          </button>

          {activeSession ? (
            <>
              <div className="chat-topbar-indicator" />
              <span className="chat-topbar-name">
                {activeSession.title || 'New Chat'}
              </span>
              {activeMode && (
                <span className={`mode-badge px-2 py-0.5 rounded-full ${activeMode.modeClass}`}>
                  {activeMode.name}
                </span>
              )}
            </>
          ) : (
            <span className="chat-topbar-name" style={{ color: 'var(--c-muted)' }}>
              Select a chat or start a new one
            </span>
          )}
        </div>

        {/* ── Messages ── */}
        <div className="chat-messages">
          {!activeSession ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <FiMessageSquare size={24} />
              </div>
              <h2>Start a conversation</h2>
              <p>Select an existing chat from the sidebar, or start a new one.</p>
              <button
                onClick={() => setShowModeSelector(true)}
                className="glow-sky px-5 py-2.5 text-sm rounded-xl flex items-center gap-1.5"
              >
                <FiPlus size={14} /> New Chat
              </button>
            </div>

          ) : currentMessages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <FiMessageSquare size={24} />
              </div>
              <h2>Ask anything</h2>
              <p>Type your question below and I'll answer based on your documents.</p>
            </div>

          ) : (
            <div className="chat-thread">
              {currentMessages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`chat-msg-row ${msg.role === 'user' ? 'chat-msg-row--user' : 'chat-msg-row--ai'}`}
                  style={{ animationDelay: `${i * 16}ms` }}
                >
                  <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>

                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {processContent(msg.content)}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* AI insight */}
                    {msg.injected_thought && (
                      <div className="ai-insight mt-2.5 p-2.5 rounded-xl">
                        <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <FiZap size={10} /> AI Insight
                        </div>
                        <p className="text-xs italic opacity-80">{msg.injected_thought}</p>
                      </div>
                    )}

                    {/* Document sources */}
                    {msg.sources?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <span key={idx} className="source-badge px-2.5 py-1 flex items-center gap-1">
                            <FiFile size={9} /> {src.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Web sources */}
                    {msg.web_sources?.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {msg.web_sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2.5 source-badge rounded-xl"
                            style={{ borderRadius: 'var(--r-md)' }}
                          >
                            <div className="font-medium text-xs" style={{ color: 'var(--c-blue)' }}>
                              {src.title}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--c-muted)' }}>
                              {src.url}
                            </div>
                            {src.snippet && (
                              <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                {src.snippet}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
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

        {/* ── Pinned input bar ── */}
        {activeSession && (
          <div className="chat-input-bar">
            <div className="chat-input-wrap">
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
                  className="chat-send-btn"
                  aria-label="Send"
                >
                  <FiSend size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODE SELECTOR MODAL
          ══════════════════════════════════════════════ */}
      {showModeSelector && (
        <div className="chat-modal-overlay" onClick={() => setShowModeSelector(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="chat-modal-title">Choose Chat Mode</h2>
              <button
                onClick={() => setShowModeSelector(false)}
                className="p-1"
                style={{ color: 'var(--c-muted)' }}
              >
                <FiX size={17} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--c-muted)' }}>
              Select how the AI should respond
            </p>

            <div className="space-y-2">
              {CHAT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleNewChat(mode.id)}
                  className="mode-option p-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <mode.icon
                      size={15}
                      style={{ color: `var(--c-${mode.modeClass.replace('mode-', '')})` }}
                      className="flex-shrink-0"
                    />
                    <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>
                      {mode.name}
                    </span>
                    <span className={`ml-auto mode-badge px-2 py-0.5 rounded-full ${mode.modeClass}`}>
                      {mode.id}
                    </span>
                  </div>
                  <p className="text-xs pl-6" style={{ color: 'var(--c-muted)' }}>
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModeSelector(false)}
              className="w-full mt-3 ghost-btn px-4 py-2.5 text-sm rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}