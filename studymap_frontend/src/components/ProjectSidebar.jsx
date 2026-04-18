import { useNavigate, useParams } from 'react-router-dom';
import { FiFile, FiMessageSquare, FiEdit, FiTarget, FiHelpCircle, FiMap, FiList, FiBookOpen } from 'react-icons/fi';

export default function ProjectSidebar({ project, stats }) {
  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!project) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors mb-4"
        >
          <span>←</span>
          <span className="text-sm">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color || '#6C63FF' }}
          />
          <h2 className="font-semibold text-text truncate">{project.name}</h2>
        </div>
        {project.description && (
          <p className="text-sm text-muted mt-2 line-clamp-2">{project.description}</p>
        )}
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text">{stats?.documents || 0}</div>
            <div className="text-xs text-muted">Documents</div>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text">{stats?.decks || 0}</div>
            <div className="text-xs text-muted">Flashcards</div>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text">{stats?.quizzes || 0}</div>
            <div className="text-xs text-muted">Quizzes</div>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text">{stats?.notes || 0}</div>
            <div className="text-xs text-muted">Notes</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-1">
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=documents`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiFile />
              <span className="text-sm">Documents</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=chat`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiMessageSquare />
              <span className="text-sm">Chat</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=notes`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiEdit />
              <span className="text-sm">Notes</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=flashcards`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiTarget />
              <span className="text-sm">Flashcards</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=quiz`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiHelpCircle />
              <span className="text-sm">Quiz</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=mindmap`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiMap />
              <span className="text-sm">Mind Map</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=summary`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-text"
            >
              <FiList />
              <span className="text-sm">Summary</span>
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=study`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-primary"
            >
              <FiBookOpen />
              <span className="text-sm font-semibold">Study Mode</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}