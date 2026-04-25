import { useNavigate, useParams } from 'react-router-dom';
import { FiFile, FiMessageSquare, FiEdit, FiTarget, FiHelpCircle, FiMap, FiList, FiBookOpen, FiArrowLeft } from 'react-icons/fi';

export default function ProjectSidebar({ project, stats }) {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const sidebarCss = `
    .sidebar-bg {
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
    }
    [data-theme="dark"] .sidebar-bg {
      background: #0f172a;
      border-right: 1px solid rgba(255,255,255,0.07);
    }
    [data-theme="light"] .sidebar-bg {
      background: #FFFFFF;
      border-right: 1px solid #E2E8F0;
    }
    .sidebar-border {
      border-color: var(--color-border);
    }
    [data-theme="dark"] .sidebar-border {
      border-color: rgba(255,255,255,0.07);
    }
    [data-theme="light"] .sidebar-border {
      border-color: #E2E8F0;
    }
    .sidebar-label {
      color: var(--color-muted);
    }
    [data-theme="dark"] .sidebar-label {
      color: #52525b;
    }
    [data-theme="light"] .sidebar-label {
      color: #94A3B8;
    }
    .sidebar-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      transition: all 0.2s;
    }
    [data-theme="dark"] .sidebar-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
    }
    [data-theme="light"] .sidebar-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
    }
    .sidebar-card:hover {
      background: var(--color-input-bg);
    }
    [data-theme="dark"] .sidebar-card:hover {
      background: rgba(255,255,255,0.06);
    }
    [data-theme="light"] .sidebar-card:hover {
      background: #E2E8F0;
    }
    .sidebar-stat {
      color: var(--color-text);
    }
    .sidebar-stat-label {
      color: var(--color-muted);
    }
    .quick-btn {
      color: var(--color-muted);
      transition: all 0.2s;
    }
    [data-theme="dark"] .quick-btn {
      color: #71717a;
    }
    [data-theme="light"] .quick-btn {
      color: #64748B;
    }
    .quick-btn:hover {
      background: rgba(99,179,237,0.08);
      transform: translateX(2px);
    }
    [data-theme="light"] .quick-btn:hover {
      color: #1E293B;
      background: rgba(99,179,237,0.08);
    }
    .sidebar-link {
      color: var(--color-secondary);
    }
    [data-theme="dark"] .sidebar-link {
      color: #71717a;
    }
    [data-theme="light"] .sidebar-link {
      color: #64748B;
    }
    [data-theme="dark"] .sidebar-link:hover {
      color: #e2e8f0;
    }
    [data-theme="light"] .sidebar-link:hover {
      color: #1E293B;
    }
    .sidebar-title {
      color: var(--color-text);
    }
  `;

  if (!project) return null;

  return (
    <>
      <style>{sidebarCss}</style>
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col sidebar-bg">
        <div className="p-5 border-b sidebar-border">
          <button
            onClick={() => navigate('/dashboard')}
            className="sidebar-link flex items-center gap-2 hover:text-gray-300 transition-colors mb-4"
          >
            <FiArrowLeft size={14} />
            <span className="text-xs">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || '#6C63FF' }}
            />
            <h2 className="font-semibold truncate sidebar-title">{project.name}</h2>
          </div>
          {project.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{project.description}</p>
          )}
        </div>

        <div className="p-4 border-b sidebar-border">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-sky-400">{stats?.documents || 0}</div>
              <div className="text-[10px] sidebar-stat-label uppercase tracking-wider">Docs</div>
            </div>
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-sky-400">{stats?.decks || 0}</div>
              <div className="text-[10px] sidebar-stat-label uppercase tracking-wider">Cards</div>
            </div>
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-emerald-400">{stats?.quizzes || 0}</div>
              <div className="text-[10px] sidebar-stat-label uppercase tracking-wider">Quiz</div>
            </div>
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-violet-400">{stats?.notes || 0}</div>
              <div className="text-[10px] sidebar-stat-label uppercase tracking-wider">Notes</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4">
            <h3 className="text-[10px] uppercase tracking-widest sidebar-label font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=documents`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiFile size={14} />
                <span className="text-xs">Documents</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=chat`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiMessageSquare size={14} />
                <span className="text-xs">Chat</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=notes`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiEdit size={14} />
                <span className="text-xs">Notes</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=flashcards`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiTarget size={14} />
                <span className="text-xs">Flashcards</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=quiz`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiHelpCircle size={14} />
                <span className="text-xs">Quiz</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=mindmap`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiMap size={14} />
                <span className="text-xs">Mind Map</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=summary`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <FiList size={14} />
                <span className="text-xs">Summary</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=study`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-400"
              >
                <FiBookOpen size={14} />
                <span className="text-xs font-semibold">Study Mode</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}