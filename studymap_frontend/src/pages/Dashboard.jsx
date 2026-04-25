import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFolder, FiPlus, FiZap, FiMenu } from 'react-icons/fi';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    <div className="dashboard-root relative min-h-screen">
        <div className="hidden md:block">
          <Navbar />
        </div>
        
        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
            <div className="mobile-drawer absolute left-0 top-0 bottom-0 w-64 flex flex-col">
              <div className="p-4 flex justify-between items-center border-b mobile-drawer-header shrink-0">
                <h2 className="font-bold">Menu</h2>
                <button onClick={() => setMobileNavOpen(false)} className="text-gray-400">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Navbar embedded={true} />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col md:ml-64">
          <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
              <div className="flex items-center gap-3 w-full">
                <button className="md:hidden flex-shrink-0 p-2 rounded-lg shadow-lg menu-btn" onClick={() => setMobileNavOpen(true)}>
                  <FiMenu size={20} />
                </button>
                <h1 className="text-xl md:text-2xl font-bold">Your Projects</h1>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="glow-sky px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-px w-full md:w-auto justify-center"
              >
                <FiPlus size={14} /> <span className="hide-mobile">New Project</span>
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