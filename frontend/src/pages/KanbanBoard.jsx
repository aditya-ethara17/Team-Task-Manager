import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasks } from '../api/client';

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'border-yellow-400', bg: 'bg-yellow-50' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-indigo-400', bg: 'bg-indigo-50' },
  { key: 'REVIEW', label: 'Review', color: 'border-orange-400', bg: 'bg-orange-50' },
  { key: 'DONE', label: 'Done', color: 'border-green-400', bg: 'bg-green-50' },
];

const priorityColors = {
  URGENT: 'text-red-600 bg-red-50',
  HIGH: 'text-orange-600 bg-orange-50',
  MEDIUM: 'text-blue-600 bg-blue-50',
  LOW: 'text-gray-600 bg-gray-50',
};

export default function KanbanBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const fetchBoard = async () => {
    try {
      const { data } = await tasks.kanban(id);
      setColumns(data);
    } catch (err) {
      alert('Failed to load board');
      navigate(`/projects/${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoard(); }, [id]);

  const handleDragStart = (task, columnKey) => {
    setDraggedTask({ ...task, fromColumn: columnKey });
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };

  const handleDrop = async (columnKey) => {
    if (!draggedTask || draggedTask.fromColumn === columnKey) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }

    try {
      await tasks.update(draggedTask.id, { status: columnKey, title: draggedTask.title });
      setColumns(prev => {
        const next = { ...prev };
        next[draggedTask.fromColumn] = next[draggedTask.fromColumn].filter(t => t.id !== draggedTask.id);
        next[columnKey] = [{ ...draggedTask, status: columnKey }, ...next[columnKey]];
        return next;
      });
    } catch (err) {
      alert('Failed to move task');
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(`/projects/${id}`)} className="text-sm text-indigo-600 hover:underline">&larr; Back to Project</button>
          <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(col => (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDrop={() => handleDrop(col.key)}
            className={`bg-gray-50 rounded-xl border-t-4 ${col.color} ${dragOverColumn === col.key ? 'ring-2 ring-indigo-400' : ''} transition-all`}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                  {(columns[col.key] || []).length}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-3 min-h-[200px]">
              {(columns[col.key] || []).map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task, col.key)}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{task.title}</p>
                    <span className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.labels.map(tl => (
                        <span
                          key={tl.label.id}
                          className="px-1.5 py-0.5 rounded text-xs text-white"
                          style={{ backgroundColor: tl.label.color }}
                        >
                          {tl.label.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    {task.assignee ? (
                      <span>{task.assignee.name}</span>
                    ) : (
                      <span className="italic">Unassigned</span>
                    )}
                    {task.dueDate && (
                      <span className={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-medium' : ''}>
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {task.subtasks?.length > 0 && (
                    <div className="mt-2 flex items-center text-xs text-gray-400">
                      <span>✓ {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                    </div>
                  )}
                </div>
              ))}

              {(!columns[col.key] || columns[col.key].length === 0) && (
                <div className="flex items-center justify-center h-24 text-xs text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
