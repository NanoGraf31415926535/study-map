import { FiHome, FiFile, FiMessageSquare, FiSettings, FiUser } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

const MOBILE_NAV_ITEMS = [
  { icon: FiHome, label: 'Home', path: '/dashboard' },
  { icon: FiFile, label: 'Projects', path: '/dashboard' },
  { icon: FiMessageSquare, label: 'Chat', path: null },
  { icon: FiUser, label: 'Profile', path: '/profile' },
  { icon: FiSettings, label: 'Settings', path: '/settings' },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="mobile-nav">
      {MOBILE_NAV_ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={() => handleClick(item)}
          className={`mobile-nav-btn ${isActive(item.path) ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}