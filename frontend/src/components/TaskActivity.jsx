import { useState, useEffect } from 'react';
import api from '../api/client';

const actionIcon = {
  CREATE: '🟢',
  UPDATE: '🔵',
  DELETE: '🔴',
  COMMENT: '💬',
  LOG_TIME: '⏱',
  UPLOAD: '📎',
};

export default function TaskActivity({ taskId, taskTitle }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/activities/entity/Task/${taskId}`);
        setActivities(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [taskId]);

  if (loading) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-2">Activity</p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {activities.map(log => (
          <div key={log.id} className="flex items-start space-x-1.5 text-xs">
            <span>{actionIcon[log.action] || '📋'}</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-600">{log.details || `${log.action} ${log.entity}`}</span>
              <span className="text-gray-400 ml-1">— {log.user?.name || 'System'}</span>
              <span className="text-gray-300 ml-1">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="text-xs text-gray-400 italic">No activity recorded</p>}
      </div>
    </div>
  );
}
