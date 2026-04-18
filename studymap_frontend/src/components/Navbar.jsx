import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBarChart2, FiUser, FiSettings, FiAward, FiLogOut } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecentProjects();
    }
  }, [user, location.pathname]);

  const fetchRecentProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await api.get('/projects/');
      const projects = response.data.slice(0, 3);
      setRecentProjects(projects);
    } catch (error) {
      console.error('Failed to fetch recent projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      await api.post('/auth/logout/', { refresh: refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>
          StudyMap
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">Menu</span>
        </div>
        <div className="space-y-1 px-3">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isActive('/dashboard') ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-text'
            }`}
          >
            <FiBarChart2 />
            <span className="font-medium">Dashboard</span>
          </button>
        </div>

        {recentProjects.length > 0 && (
          <>
            <div className="px-3 mt-6 mb-2">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold">Recent Projects</span>
            </div>
            <div className="space-y-1 px-3">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                    location.pathname === `/projects/${project.id}` ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-text'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6C63FF' }}
                  />
                  <span className="truncate font-medium text-sm">{project.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="px-3 mt-6 mb-2">
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">Account</span>
        </div>
        <div className="space-y-1 px-3">
          <button
            onClick={() => navigate('/profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isActive('/profile') ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-text'
            }`}
          >
            <FiUser />
            <span className="font-medium">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isActive('/settings') ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-text'
            }`}
          >
            <FiSettings />
            <span className="font-medium">Settings</span>
          </button>
          {user?.is_staff && (
            <button
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive('/admin') ? 'bg-warning/20 text-warning' : 'hover:bg-surface text-text'
              }`}
            >
              <FiAward />
              <span className="font-medium">Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface transition-colors"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              {user?.is_staff && (
                <FiAward className="absolute -top-1 -right-1 text-xs" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-medium text-text truncate">{user?.username}</div>
              {user?.is_staff && (
                <div className="text-xs text-warning font-medium">Admin</div>
              )}
            </div>
            <span className={`text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl shadow-lg border border-gray-800 py-2 z-50">
              <button
                onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                className="w-full px-4 py-2 text-left hover:bg-surface transition-colors text-text flex items-center gap-2"
              >
                <FiUser /> Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                className="w-full px-4 py-2 text-left hover:bg-surface transition-colors text-text flex items-center gap-2"
              >
                <FiSettings /> Settings
              </button>
              {user?.is_staff && (
                <button
                  onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-surface transition-colors text-text flex items-center gap-2"
                >
                  <FiAward /> Admin Panel
                </button>
              )}
              <div className="border-t border-gray-800 my-2" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left hover:bg-surface transition-colors text-red-400 flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
