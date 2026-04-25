import { useState } from 'react';
import { FiMoreVertical, FiTrash2 } from 'react-icons/fi';

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
      className="project-card relative rounded-2xl cursor-pointer overflow-hidden"
      style={{ borderLeftColor: project.color, borderLeftWidth: '3px' }}
      onClick={onClick}
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }}></div>
            <h3 className="font-semibold truncate project-title">{project.name}</h3>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-lg transition-colors project-menu-btn"
            >
              <FiMoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 rounded-xl shadow-lg py-1 z-20 project-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left project-dropdown-item text-red-400 text-sm flex items-center gap-2"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm project-description mt-2.5 line-clamp-2">
          {project.description || 'No description'}
        </p>

        <div className="flex items-center justify-between mt-4 text-xs project-meta">
          <span>{project.document_count} documents</span>
          <span>{formatDate(project.created_at)}</span>
        </div>
      </div>
    </div>
  );
}