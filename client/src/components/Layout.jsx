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
      location.pathname === path ? 'bg-indigo-700' : 'hover:bg-indigo-500'
    }`;

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold tracking-tight">
                TaskFlow
              </Link>
              <div className="hidden sm:flex space-x-1">
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/my-tasks" className={linkClass('/my-tasks')}>
                  My Tasks
                </Link>
                <Link to="/projects" className={isActive('/projects') && !location.pathname.includes('/issues') ? 'px-3 py-2 rounded-md text-sm font-medium bg-indigo-700' : 'px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500'}>
                  Projects
                </Link>
                <Link to="/timesheets" className={linkClass('/timesheets')}>
                  Timesheets
                </Link>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/users" className={linkClass('/users')}>
                    Users
                  </Link>
                )}
                <Link to="/settings" className={linkClass('/settings')}>
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggle}
                className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-500 rounded-lg transition-colors"
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
                <span className="text-sm text-indigo-200">{user?.name}</span>
                {user?.role === 'SUPER_ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-yellow-400 text-yellow-900 rounded-full">SUPER ADMIN</span>
                )}
                {user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-green-400 text-green-900 rounded-full">ADMIN</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors"
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
