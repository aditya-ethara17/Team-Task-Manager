import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasks } from '../api/client';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'border-yellow-400', bg: 'bg-yellow-50' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-indigo-400', bg: 'bg-indigo-50' },
  { key: 'REVIEW', label: 'Review', color: 'border-orange-400', bg: 'bg-orange-50' },
  { key: 'DONE', label: 'Done', color: 'border-green-400', bg: 'bg-green-50' },
];

const statusBadge = {
  TODO: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  REVIEW: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
};

const priorityBadge = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [tasksList, setTasksList] = useState([]);
  const [columns, setColumns] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      if (view === 'board') {
        const { data } = await tasks.myKanban();
        setColumns(data);
      } else {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        const { data } = await tasks.my(params);
        setTasksList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [view, statusFilter]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasks.update(taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleQuickStatus = async (taskId, newStatus) => {
    try {
      await tasks.update(taskId, { status: newStatus });
      setTasksList(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedTasks.size === 0) return;
    if (!window.confirm(`Update ${selectedTasks.size} task(s) to ${bulkStatus}?`)) return;
    try {
      for (const id of selectedTasks) {
        await tasks.update(id, { status: bulkStatus });
      }
      setSelectedTasks(new Set());
      setBulkStatus('');
      fetchTasks();
    } catch (err) {
      alert('Failed to update some tasks');
    }
  };

  const toggleSelect = (id) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (task, fromCol) => {
    setDraggedTask({ ...task, fromColumn: fromCol });
  };

  const handleDrop = async (toCol) => {
    if (!draggedTask || draggedTask.fromColumn === toCol) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }
    try {
      await tasks.update(draggedTask.id, { status: toCol });
      setColumns(prev => {
        const next = { ...prev };
        next[draggedTask.fromColumn] = next[draggedTask.fromColumn].filter(t => t.id !== draggedTask.id);
        next[toCol] = [{ ...draggedTask, status: toCol }, ...next[toCol]];
        return next;
      });
    } catch (err) {
      alert('Failed to move task');
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  if (loading && !tasksList.length && !columns) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('board')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'board' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            Board
          </button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className="flex items-center space-x-2 mb-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>

            {selectedTasks.size > 0 && (
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-gray-500">{selectedTasks.size} selected</span>
                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Set status...</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatus}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Apply
                </button>
                <button onClick={() => setSelectedTasks(new Set())} className="text-sm text-gray-500 hover:underline">Clear</button>
              </div>
            )}
          </div>

          {tasksList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400 text-lg">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasksList.map(task => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/projects/${task.projectId}?task=${task.id}`)}
                            className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate"
                          >
                            {task.title}
                          </button>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge[task.status] || statusBadge.TODO}`}>
                            {task.status?.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityBadge[task.priority] || priorityBadge.MEDIUM}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                          <span>{task.project?.name}</span>
                          {task.dueDate && (
                            <span className={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-medium' : ''}>
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {task.subtasks?.length > 0 && (
                            <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks</span>
                          )}
                          {task.timeEntries?.length > 0 && (
                            <span>{task.timeEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h logged</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <select
                      value={task.status}
                      onChange={e => handleQuickStatus(task.id, e.target.value)}
                      className="ml-4 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'board' && (
        <div className="grid grid-cols-4 gap-4" style={{ minHeight: '70vh' }}>
          {COLUMNS.map(col => (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
              onDrop={() => handleDrop(col.key)}
              className={`bg-gray-50 rounded-xl border-t-4 ${col.color} ${dragOverColumn === col.key ? 'ring-2 ring-indigo-400' : ''} transition-all`}
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                    {(columns?.[col.key] || []).length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {(columns?.[col.key] || []).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, col.key)}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <button
                        onClick={() => navigate(`/projects/${task.projectId}?task=${task.id}`)}
                        className="text-sm font-medium text-gray-800 hover:text-indigo-600 text-left leading-tight"
                      >
                        {task.title}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">{task.project?.name}</div>
                    {task.dueDate && (
                      <div className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    {task.timeEntries?.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {task.timeEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h
                      </div>
                    )}
                  </div>
                ))}
                {(!columns?.[col.key] || columns[col.key].length === 0) && (
                  <div className="flex items-center justify-center h-24 text-xs text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
