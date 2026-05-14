import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
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
                <Link to="/projects" className={isActive('/projects') ? 'px-3 py-2 rounded-md text-sm font-medium bg-indigo-700' : 'px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500'}>
                  Projects
                </Link>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/users" className={linkClass('/users')}>
                    Users
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
