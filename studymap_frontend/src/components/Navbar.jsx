import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBarChart2, FiUser, FiSettings, FiAward, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

const navbarCss = `
  .navbar {
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
  }
  [data-theme="dark"] .navbar {
    background: rgba(17,24,39,0.95);
    border-right: 1px solid rgba(255,255,255,0.07);
  }
  [data-theme="light"] .navbar {
    background: #FFFFFF;
    border-right: 1px solid #E2E8F0;
    box-shadow: 2px 0 8px rgba(0,0,0,0.05);
  }
  .navbar::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 1px; height: 100%;
    background: linear-gradient(180deg, rgba(99,179,237,0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  .nav-label {
    color: var(--color-muted);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
  }
  [data-theme="light"] .nav-label {
    color: #64748B;
  }
  .nav-btn {
    color: var(--color-muted);
    transition: all 0.2s;
  }
  [data-theme="dark"] .nav-btn {
    color: #71717a;
  }
  [data-theme="light"] .nav-btn {
    color: #64748B;
  }
  .nav-btn:hover {
    color: var(--color-text);
    background: var(--color-input-bg);
  }
  [data-theme="dark"] .nav-btn:hover {
    color: #e2e8f0;
    background: rgba(99,179,237,0.06);
  }
  [data-theme="light"] .nav-btn:hover {
    color: #1E293B;
    background: #F1F5F9;
  }
  .nav-btn.active {
    color: #38bdf8;
    background: rgba(56,189,248,0.1);
  }
  [data-theme="light"] .nav-btn.active {
    background: rgba(56,189,248,0.1);
  }
  .dropdown-glass {
    background: var(--color-card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-border);
    box-shadow: 0 -4px 24px rgba(0,0,0,0.2);
  }
  [data-theme="dark"] .dropdown-glass {
    background: rgba(17,24,39,0.98);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
  }
  [data-theme="light"] .dropdown-glass {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
  }
  .dropdown-item {
    color: var(--color-muted);
    transition: all 0.15s;
  }
  [data-theme="dark"] .dropdown-item {
    color: #a1a1aa;
  }
  [data-theme="light"] .dropdown-item {
    color: #64748B;
  }
  .dropdown-item:hover {
    background: var(--color-input-bg);
    color: var(--color-text);
  }
  [data-theme="dark"] .dropdown-item:hover {
    background: rgba(255,255,255,0.06);
    color: #e2e8f0;
  }
  [data-theme="light"] .dropdown-item:hover {
    background: #F1F5F9;
    color: #1E293B;
  }
  .dropdown-item.danger:hover {
    background: rgba(248,113,113,0.1);
    color: #f87171;
  }
  .logo {
    background: linear-gradient(135deg, #63b3ed, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .avatar {
    background: linear-gradient(135deg, #63b3ed, #38bdf8);
    color: #0f172a;
  }
  [data-theme="light"] .avatar {
    background: linear-gradient(135deg, #38BDF8, #0EA5E9);
    color: #FFFFFF;
  }
  .admin-dot {
    color: #fbbf24;
  }
  .section-divider {
    border-color: var(--color-border);
  }
  [data-theme="dark"] .section-divider {
    border-color: rgba(255,255,255,0.06);
  }
  [data-theme="light"] .section-divider {
    border-color: #E2E8F0;
  }
`;

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
    <>
      <style>{navbarCss}</style>
    <nav className="fixed left-0 top-0 h-screen w-64 navbar flex flex-col">
      <div className="p-5 border-b section-divider">
        <h1 className="text-xl font-bold logo cursor-pointer" onClick={() => navigate('/dashboard')}>
          StudyMap
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-3">
          <span className="nav-label">Menu</span>
        </div>
        <div className="space-y-1 px-3">
          <button
            onClick={() => navigate('/dashboard')}
            className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
              isActive('/dashboard') ? 'active' : ''
            }`}
          >
            <FiBarChart2 size={16} />
            <span className="font-medium text-sm">Dashboard</span>
          </button>
        </div>

        {recentProjects.length > 0 && (
          <>
            <div className="px-4 mt-6 mb-3">
              <span className="nav-label">Recent Projects</span>
            </div>
            <div className="space-y-1 px-3">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl group ${
                    location.pathname === `/projects/${project.id}` ? 'active' : ''
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#8b5cf6' }}
                  />
                  <span className="truncate font-medium text-sm">{project.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="px-4 mt-6 mb-3">
          <span className="nav-label">Account</span>
        </div>
        <div className="space-y-1 px-3">
          <button
            onClick={() => navigate('/profile')}
            className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
              isActive('/profile') ? 'active' : ''
            }`}
          >
            <FiUser size={16} />
            <span className="font-medium text-sm">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
              isActive('/settings') ? 'active' : ''
            }`}
          >
            <FiSettings size={16} />
            <span className="font-medium text-sm">Settings</span>
          </button>
          {user?.is_staff && (
            <button
              onClick={() => navigate('/admin')}
              className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                isActive('/admin') ? 'active' : ''
              }`}
            >
              <FiAward size={16} />
              <span className="font-medium text-sm">Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-t section-divider">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl"
          >
            <div className="relative">
              <div className="avatar w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              {user?.is_staff && (
                <FiAward className="admin-dot absolute -top-1 -right-1 text-[10px]" size={10} />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-medium truncate text-sm">{user?.username}</div>
              {user?.is_staff && (
                <div className="text-[10px] text-amber-400 font-medium">Admin</div>
              )}
            </div>
            <FiChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="dropdown-glass absolute bottom-full left-0 right-0 mb-2 rounded-xl py-1.5 z-50">
              <button
                onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                className="dropdown-item w-full px-4 py-2 text-left flex items-center gap-2 text-sm"
              >
                <FiUser size={14} /> Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                className="dropdown-item w-full px-4 py-2 text-left flex items-center gap-2 text-sm"
              >
                <FiSettings size={14} /> Settings
              </button>
              {user?.is_staff && (
                <button
                  onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                  className="dropdown-item w-full px-4 py-2 text-left flex items-center gap-2 text-sm"
                >
                  <FiAward size={14} /> Admin Panel
                </button>
              )}
              <div className="border-t border-white/5 my-1.5" />
              <button
                onClick={handleLogout}
                className="dropdown-item danger w-full px-4 py-2 text-left flex items-center gap-2 text-sm"
              >
                <FiLogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
