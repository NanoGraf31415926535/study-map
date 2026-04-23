import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFolder, FiPlus, FiZap } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import '../styles/dashboard.css';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { projects, fetchProjects, deleteProject, isLoading } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId);
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="dashboard-root relative min-h-screen bg-gray-950 text-gray-100">
        <Navbar />
        <div className="flex-1 flex flex-col ml-64">
          <main className="flex-1 p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-100">Your Projects</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="glow-sky px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-px"
              >
                <FiPlus size={14} /> New Project
              </button>
            </div>

            {isLoading && projects.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 empty-state rounded-2xl fade-up">
                <FiFolder className="text-6xl mb-4 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-200 mb-2">No projects yet</h2>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="glow-sky px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-px"
                >
                  <FiPlus size={14} /> Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project)}
                    onDelete={() => handleDeleteProject(project.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {showCreateModal && (
          <CreateProjectModal onClose={() => setShowCreateModal(false)} />
        )}
      </div>
  );
}