import { useState } from 'react';
import { timeEntries } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TimeLog({ taskId, entries, totalHours, onRefresh }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) return;
    try {
      await timeEntries.create(taskId, { hours: parseFloat(hours), description });
      setHours('');
      setDescription('');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log time');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await timeEntries.delete(entryId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete entry');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">
          Time Tracking {totalHours > 0 && <span className="font-bold">({totalHours.toFixed(1)}h total)</span>}
        </p>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-indigo-600 hover:underline">
          {showForm ? 'Cancel' : '+ Log time'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 mb-2">
          <div>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="Hours"
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-medium">Log</button>
        </form>
      )}

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-sm font-medium text-indigo-600 flex-shrink-0">{entry.hours}h</span>
              <span className="text-xs text-gray-500 truncate">{entry.description || 'No description'}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">— {entry.user.name}</span>
            </div>
            {(entry.user.id === user?.id || user?.role === 'SUPER_ADMIN') && (
              <button onClick={() => handleDelete(entry.id)} className="text-red-400 text-xs hover:text-red-600 flex-shrink-0 ml-2">✕</button>
            )}
          </div>
        ))}
        {entries.length === 0 && <p className="text-xs text-gray-400 italic">No time logged</p>}
      </div>
    </div>
  );
}
