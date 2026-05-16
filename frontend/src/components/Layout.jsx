import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      location.pathname === path
        ? 'text-white'
        : 'hover:text-white'
    }`;

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <nav style={{ background: '#12121a', borderBottom: '1px solid #2a2a4a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold tracking-tight" style={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>
                Taskify
              </Link>
              <div className="hidden sm:flex space-x-1">
                <Link to="/dashboard" className={linkClass('/dashboard')} style={{ color: location.pathname === '/dashboard' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/dashboard' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  Dashboard
                </Link>
                <Link to="/my-tasks" className={linkClass('/my-tasks')} style={{ color: location.pathname === '/my-tasks' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/my-tasks' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  My Tasks
                </Link>
                <Link to="/projects" className={linkClass('/projects')} style={{ color: isActive('/projects') && !location.pathname.includes('/issues') ? '#00f0ff' : '#8888aa', ...(isActive('/projects') && !location.pathname.includes('/issues') ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  Projects
                </Link>
                <Link to="/chat" className={linkClass('/chat')} style={{ color: location.pathname === '/chat' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/chat' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  Chat
                </Link>
                <Link to="/dm" className={linkClass('/dm')} style={{ color: location.pathname === '/dm' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/dm' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  DMs
                </Link>
                <Link to="/timesheets" className={linkClass('/timesheets')} style={{ color: location.pathname === '/timesheets' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/timesheets' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  Timesheets
                </Link>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/users" className={linkClass('/users')} style={{ color: location.pathname === '/users' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/users' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                    Users
                  </Link>
                )}
                <Link to="/settings" className={linkClass('/settings')} style={{ color: location.pathname === '/settings' ? '#00f0ff' : '#8888aa', ...(location.pathname === '/settings' ? { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)', borderBottom: '2px solid #00f0ff' } : {}) }}>
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggle}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#8888aa' }}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <NotificationsDropdown />
              <div className="flex items-center space-x-2">
                <span className="text-sm" style={{ color: '#8888aa' }}>{user?.name}</span>
                {user?.role === 'SUPER_ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: '#ffaa00', color: '#0a0a0f' }}>SUPER ADMIN</span>
                )}
                {user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: '#39ff14', color: '#0a0a0f' }}>ADMIN</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium transition-all"
                style={{ background: '#2a2a4a', color: '#e0e0ff', border: '1px solid #3a3a5a' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
