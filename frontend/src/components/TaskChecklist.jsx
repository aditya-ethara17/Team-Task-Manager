import { useState } from 'react';
import { subtasks } from '../api/client';

export default function TaskChecklist({ taskId, subtasksList, onRefresh }) {
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await subtasks.create(taskId, { title: newTitle });
      setNewTitle('');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add subtask');
    }
  };

  const handleToggle = async (subtaskId) => {
    try {
      await subtasks.toggle(subtaskId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle subtask');
    }
  };

  const handleDelete = async (subtaskId) => {
    try {
      await subtasks.delete(subtaskId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete subtask');
    }
  };

  const completed = subtasksList.filter(s => s.completed).length;
  const total = subtasksList.length;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">Checklist ({completed}/{total})</p>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-indigo-600 hover:underline">
          {showForm ? 'Cancel' : '+ Add item'}
        </button>
      </div>

      {total > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Checklist item..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <button type="submit" className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium">Add</button>
        </form>
      )}

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {subtasksList.map(s => (
          <div key={s.id} className="flex items-center justify-between group">
            <label className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={s.completed}
                onChange={() => handleToggle(s.id)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={`text-sm ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {s.title}
              </span>
            </label>
            <button onClick={() => handleDelete(s.id)} className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
        {total === 0 && <p className="text-xs text-gray-400 italic">No checklist items</p>}
      </div>
    </div>
  );
}
