import { useState } from 'react';
import { labels } from '../api/client';

const PRESET_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function LabelPicker({ projectId, taskId, taskLabels, projectLabels, onRefresh }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const taskLabelIds = taskLabels.map(tl => tl.labelId);

  const handleAddLabel = async (labelId) => {
    try {
      await labels.addToTask(taskId, labelId);
      onRefresh();
    } catch (err) {
      if (err.response?.status !== 409) alert(err.response?.data?.error || 'Failed to add label');
    }
  };

  const handleRemoveLabel = async (labelId) => {
    try {
      await labels.removeFromTask(taskId, labelId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove label');
    }
  };

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { data } = await labels.create(projectId, { name: newName, color: newColor });
      await labels.addToTask(taskId, data.id);
      setNewName('');
      setNewColor('#6366f1');
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create label');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">Labels</p>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-xs text-indigo-600 hover:underline">
            {showMenu ? 'Done' : '+ Label'}
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Labels</span>
                <button onClick={() => setShowCreate(true)} className="text-xs text-indigo-600 hover:underline">+ New</button>
              </div>

              {showCreate && (
                <form onSubmit={handleCreateLabel} className="mb-2 p-2 bg-gray-50 rounded space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Label name"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={`w-4 h-4 rounded-full ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs">Add</button>
                  </div>
                </form>
              )}

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {projectLabels.map(label => {
                  const isOnTask = taskLabelIds.includes(label.id);
                  return (
                    <div key={label.id} className="flex items-center justify-between py-1">
                      <button
                        onClick={() => isOnTask ? handleRemoveLabel(label.id) : handleAddLabel(label.id)}
                        className="flex items-center space-x-2 flex-1"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                        <span className={`text-xs ${isOnTask ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                          {label.name}
                        </span>
                      </button>
                      {isOnTask && <span className="text-xs text-indigo-500">✓</span>}
                    </div>
                  );
                })}
                {projectLabels.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No labels in this project</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {taskLabels.map(tl => (
            <span
              key={tl.label.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tl.label.color }}
            >
              {tl.label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
