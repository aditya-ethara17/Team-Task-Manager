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
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'text-indigo-600 dark:text-cyan-300'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
    }`;

  const isActive = (path) => location.pathname.startsWith(path);
  const activeNavStyle = {
    boxShadow: isDark ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none',
    borderBottom: `2px solid ${isDark ? '#00f0ff' : '#4f46e5'}`
  };
  const navColor = (active) => active ? (isDark ? '#00f0ff' : '#4f46e5') : undefined;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <nav className="border-b border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/dashboard"
                className="text-xl font-bold tracking-tight text-indigo-600 dark:text-cyan-300"
                style={isDark ? { textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' } : undefined}
              >
                Taskify
              </Link>
              <div className="hidden sm:flex space-x-1">
                <Link to="/dashboard" className={linkClass('/dashboard')} style={{ color: navColor(location.pathname === '/dashboard'), ...(location.pathname === '/dashboard' ? activeNavStyle : {}) }}>
                  Dashboard
                </Link>
                <Link to="/my-tasks" className={linkClass('/my-tasks')} style={{ color: navColor(location.pathname === '/my-tasks'), ...(location.pathname === '/my-tasks' ? activeNavStyle : {}) }}>
                  My Tasks
                </Link>
                <Link to="/projects" className={linkClass('/projects')} style={{ color: navColor(isActive('/projects') && !location.pathname.includes('/issues')), ...(isActive('/projects') && !location.pathname.includes('/issues') ? activeNavStyle : {}) }}>
                  Projects
                </Link>
                <Link to="/chat" className={linkClass('/chat')} style={{ color: navColor(location.pathname === '/chat'), ...(location.pathname === '/chat' ? activeNavStyle : {}) }}>
                  Chat
                </Link>
                <Link to="/dm" className={linkClass('/dm')} style={{ color: navColor(location.pathname === '/dm'), ...(location.pathname === '/dm' ? activeNavStyle : {}) }}>
                  DMs
                </Link>
                <Link to="/timesheets" className={linkClass('/timesheets')} style={{ color: navColor(location.pathname === '/timesheets'), ...(location.pathname === '/timesheets' ? activeNavStyle : {}) }}>
                  Timesheets
                </Link>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/users" className={linkClass('/users')} style={{ color: navColor(location.pathname === '/users'), ...(location.pathname === '/users' ? activeNavStyle : {}) }}>
                    Users
                  </Link>
                )}
                <Link to="/settings" className={linkClass('/settings')} style={{ color: navColor(location.pathname === '/settings'), ...(location.pathname === '/settings' ? activeNavStyle : {}) }}>
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
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
                <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
                {user?.role === 'SUPER_ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-gray-950">SUPER ADMIN</span>
                )}
                {user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-400 text-gray-950">ADMIN</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md border border-gray-200 bg-gray-100 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
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
