import { useState } from 'react';

export default function ProjectCard({ project, onClick, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border-l-4"
      style={{ borderLeftColor: project.color }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
            <h3 className="font-semibold text-text truncate">{project.name}</h3>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 hover:bg-surface rounded-lg transition-colors text-muted"
            >
              ...
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-surface rounded-xl shadow-lg border border-gray-700 py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-card transition-colors text-red-400 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-muted mt-2 line-clamp-2">
          {project.description || 'No description'}
        </p>

        <div className="flex items-center justify-between mt-4 text-xs text-muted">
          <span>{project.document_count} documents</span>
          <span>{formatDate(project.created_at)}</span>
        </div>
      </div>
    </div>
  );
}