import { useNavigate, useParams } from 'react-router-dom';
import { FiFile, FiMessageSquare, FiEdit, FiTarget, FiHelpCircle, FiMap, FiList, FiBookOpen, FiArrowLeft } from 'react-icons/fi';

export default function ProjectSidebar({ project, stats }) {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const sidebarCss = `
    .sidebar-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .sidebar-card:hover {
      background: rgba(255,255,255,0.06);
    }
    .quick-btn {
      transition: all 0.2s;
    }
    .quick-btn:hover {
      background: rgba(99,179,237,0.08);
      transform: translateX(2px);
    }
  `;

  if (!project) return null;

  return (
    <>
      <style>{sidebarCss}</style>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950 border-r border-white/[0.07] flex flex-col">
        <div className="p-5 border-b border-white/[0.07]">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors mb-4"
          >
            <FiArrowLeft size={14} />
            <span className="text-xs">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || '#6C63FF' }}
            />
            <h2 className="font-semibold text-gray-100 truncate">{project.name}</h2>
          </div>
          {project.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{project.description}</p>
          )}
        </div>

        <div className="p-4 border-b border-white/[0.07]">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-sky-400">{stats?.documents || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Docs</div>
            </div>
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-sky-400">{stats?.decks || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Cards</div>
            </div>
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-emerald-400">{stats?.quizzes || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Quiz</div>
            </div>
            <div className="sidebar-card rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-violet-400">{stats?.notes || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Notes</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=documents`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
              >
                <FiFile size={14} />
                <span className="text-xs">Documents</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=chat`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
              >
                <FiMessageSquare size={14} />
                <span className="text-xs">Chat</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=notes`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
              >
                <FiEdit size={14} />
                <span className="text-xs">Notes</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=flashcards`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
              >
                <FiTarget size={14} />
                <span className="text-xs">Flashcards</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=quiz`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
              >
                <FiHelpCircle size={14} />
                <span className="text-xs">Quiz</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=mindmap`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
              >
                <FiMap size={14} />
                <span className="text-xs">Mind Map</span>
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}?tab=summary`)}
                className="quick-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400"
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