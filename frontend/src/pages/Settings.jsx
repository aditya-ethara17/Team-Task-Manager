import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Settings() {
  const { isDark, toggle } = useDarkMode();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Preferences</h2>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme across the app</p>
          </div>
          <button
            onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Account</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            user?.role === 'SUPER_ADMIN' ? 'bg-yellow-100 text-yellow-800' :
            user?.role === 'ADMIN' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {user?.role}
          </span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Back to Dashboard
        </button>
      </div>
    </div>
  );
}
