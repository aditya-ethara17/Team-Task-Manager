import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboard } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboard.getStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-10">{error}</div>;
  }

  const statusColor = {
    TODO: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    REVIEW: 'bg-orange-100 text-orange-800',
    DONE: 'bg-green-100 text-green-800',
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.totalTasks, color: 'bg-blue-500' },
    { label: 'To Do', value: stats.tasksByStatus.TODO, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.tasksByStatus.IN_PROGRESS, color: 'bg-indigo-500' },
    { label: 'Review', value: stats.tasksByStatus.REVIEW, color: 'bg-orange-500' },
    { label: 'Completed', value: stats.tasksByStatus.DONE, color: 'bg-green-500' },
    { label: 'Overdue', value: stats.overdueCount, color: 'bg-red-500' },
    { label: 'My Tasks', value: stats.myTaskCount, color: 'bg-purple-500' },
    { label: 'My Overdue', value: stats.myOverdueCount, color: 'bg-pink-500' },
    { label: 'Projects', value: stats.projectCount, color: 'bg-teal-500' },
  ];

  const actionIcon = {
    CREATE: '🟢',
    UPDATE: '🔵',
    DELETE: '🔴',
    DELETE_USER: '🔴',
    UPDATE_ROLE: '🟡',
    ADD_MEMBER: '🟢',
    REMOVE_MEMBER: '🔴',
    UPLOAD: '📎',
    SIGNUP: '🎉',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{card.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-5">
            <p className="text-sm text-indigo-600 font-medium">Total Users</p>
            <p className="text-3xl font-bold text-indigo-800 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5">
            <p className="text-sm text-green-600 font-medium">Total Projects</p>
            <p className="text-3xl font-bold text-green-800 mt-1">{stats.totalProjects}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100 p-5">
            <p className="text-sm text-purple-600 font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-purple-800 mt-1">{stats.totalTasks}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-5">
            <p className="text-sm text-amber-600 font-medium">Overdue Tasks</p>
            <p className="text-3xl font-bold text-amber-800 mt-1">{stats.overdueCount}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {stats.myTasks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">My Tasks</h2>
              <div className="space-y-3">
                {stats.myTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.project.name}</p>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && stats.topPerformers?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top Performers</h2>
              <div className="space-y-3">
                {stats.topPerformers.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">{u._count.assignedTasks} done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {stats.overdueTasks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">Overdue Tasks</h2>
              <div className="space-y-3">
                {stats.overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 truncate">{task.title}</p>
                      <p className="text-xs text-red-600">
                        {task.project.name} {task.assignee ? `· ${task.assignee.name}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-red-500 ml-2">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && stats.recentActivities?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
              <div className="space-y-2">
                {stats.recentActivities.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <span className="text-xs mt-0.5">{actionIcon[log.action] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{log.details || `${log.action} ${log.entity}`}</p>
                      <p className="text-xs text-gray-400">{log.user.name} · {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && stats.recentUsers?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Signups</h2>
              <div className="space-y-3">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {stats.myTasks.length === 0 && stats.overdueTasks.length === 0 && !isSuperAdmin && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-lg">No tasks yet. Create a project to get started!</p>
          <Link to="/projects" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Go to Projects
          </Link>
        </div>
      )}
    </div>
  );
}
