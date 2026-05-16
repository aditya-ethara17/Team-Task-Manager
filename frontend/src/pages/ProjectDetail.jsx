import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { projects, tasks, filesApi, projectDocuments, resourceLinks } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TaskComments from '../components/TaskComments';
import TaskChecklist from '../components/TaskChecklist';
import LabelPicker from '../components/LabelPicker';
import TimeLog from '../components/TimeLog';
import ChatBox from '../components/ChatBox';
import TaskActivity from '../components/TaskActivity';

const statusOptions = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  const [editTaskId, setEditTaskId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [expandedTask, setExpandedTask] = useState(searchParams.get('task') || null);

  const [projectDocs, setProjectDocs] = useState([]);
  const [projectLinks, setProjectLinks] = useState([]);
  const [showUploadDocs, setShowUploadDocs] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', title: '', description: '' });
  const [taskLinks, setTaskLinks] = useState({});

  const fetchProject = async () => {
    try {
      const { data } = await projects.getById(id);
      setProject(data);
      const myMembership = data.members.find(m => m.user.id === user?.id);
      setIsAdmin(user?.role === 'SUPER_ADMIN' || myMembership?.role === 'ADMIN');
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  useEffect(() => {
    if (project) {
      projectDocuments.getByProject(id).then(({ data }) => setProjectDocs(data)).catch(() => {});
      resourceLinks.getByProject(id).then(({ data }) => setProjectLinks(data)).catch(() => {});
    }
  }, [project]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await tasks.create(id, taskForm);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      setShowTaskForm(false);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await tasks.update(taskId, updates);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasks.delete(taskId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await projects.addMember(id, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setMemberRole('MEMBER');
      setShowMemberForm(false);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projects.removeMember(id, memberId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleFileUpload = async (taskId, file) => {
    try {
      await filesApi.upload(taskId, file);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await filesApi.delete(fileId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete file');
    }
  };

  const handleWatchTask = async (taskId) => {
    try {
      await tasks.watch(taskId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle watch');
    }
  };

  const isWatching = (task) => {
    return task.watchers?.some(w => w.user.id === user?.id);
  };

  const handleUploadDocs = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    try {
      await projectDocuments.upload(id, files);
      e.target.value = '';
      const { data } = await projectDocuments.getByProject(id);
      setProjectDocs(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload documents');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await projectDocuments.delete(docId);
      setProjectDocs(prev => prev.filter(d => d.id !== docId));
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    try {
      await resourceLinks.create({ ...linkForm, projectId: id });
      setLinkForm({ url: '', title: '', description: '' });
      setShowAddLink(false);
      const { data } = await resourceLinks.getByProject(id);
      setProjectLinks(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Delete this link?')) return;
    try {
      await resourceLinks.delete(linkId);
      setProjectLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete link');
    }
  };

  const handleUploadMultipleFiles = async (taskId, files) => {
    if (!files.length) return;
    try {
      await filesApi.uploadMultiple(taskId, files);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload files');
    }
  };

  const loadTaskLinks = async (taskId) => {
    if (taskLinks[taskId]) return;
    try {
      const { data } = await resourceLinks.getByTask(taskId);
      setTaskLinks(prev => ({ ...prev, [taskId]: data }));
    } catch (err) {
      console.error('Failed to load task links');
    }
  };

  const handleAddTaskLink = async (taskId, e) => {
    e.preventDefault();
    const url = e.target.url.value;
    const title = e.target.title.value;
    if (!url || !title) return;
    try {
      await resourceLinks.create({ url, title, taskId });
      e.target.reset();
      const { data } = await resourceLinks.getByTask(taskId);
      setTaskLinks(prev => ({ ...prev, [taskId]: data }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add link');
    }
  };

  const handleDeleteTaskLink = async (linkId, taskId) => {
    if (!window.confirm('Delete this link?')) return;
    try {
      await resourceLinks.delete(linkId);
      const { data } = await resourceLinks.getByTask(taskId);
      setTaskLinks(prev => ({ ...prev, [taskId]: data }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete link');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This cannot be undone.')) return;
    try {
      await projects.delete(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !filterPriority && !filterAssignee && !filterStatus) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (filterPriority) params.priority = filterPriority;
      if (filterAssignee) params.assigneeId = filterAssignee;
      if (filterStatus) params.status = filterStatus;
      const { data } = await tasks.search({ projectId: id, ...params });
      setSearchResults(data);
    } catch (err) {
      alert('Search failed');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery || filterPriority || filterAssignee || filterStatus) {
      handleSearch();
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, filterPriority, filterAssignee, filterStatus]);

  const getTaskCountByStatus = (status) =>
    project?.tasks.filter(t => t.status === status).length || 0;

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

  if (!project) {
    return <div className="text-gray-500 text-center py-10">Project not found</div>;
  }

  const displayedTasks = searchResults || project.tasks;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-indigo-600 hover:underline mb-1">&larr; Back to Projects</button>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/projects/${id}/kanban`)}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Board
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/issues`)}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Issues ({project.issues?.length || 0})
          </button>
          {isAdmin && (
            <button onClick={handleDeleteProject} className="text-red-600 text-sm hover:underline">Delete Project</button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="flex-1 min-w-[200px] px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">All status</option>
                {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">All priority</option>
                {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">All members</option>
                {project.members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex space-x-2 mb-4">
            {statusOptions.map(s => (
              <div key={s} className={`flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium ${statusBadge[s]}`}>
                {s.replace('_', ' ')}: {getTaskCountByStatus(s)}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Tasks ({displayedTasks.length})
              {searchResults && <span className="text-sm font-normal text-gray-400 ml-2">(filtered)</span>}
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Add Task
              </button>
            )}
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
              <h3 className="font-medium text-gray-800 mb-4">New Task</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Task title *"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={taskForm.assigneeId}
                    onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowTaskForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create Task</button>
              </div>
            </form>
          )}

          {displayedTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400">{searchResults ? 'No tasks match your filters' : 'No tasks yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedTasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className="text-gray-400 hover:text-gray-600 text-xs">
                          {expandedTask === task.id ? '▼' : '▶'}
                        </button>
                        <h3 className="font-medium text-gray-800">{task.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityBadge[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Task Labels */}
                      {task.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-5">
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

                      {task.description && <p className="text-sm text-gray-500 mt-1 ml-5">{task.description}</p>}

                      {/* Subtask Progress */}
                      {task.subtasks?.length > 0 && (
                        <div className="ml-5 mt-1">
                          <div className="flex items-center text-xs text-gray-400">
                            <span>Checklist: {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                            <div className="ml-2 flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400 ml-5">
                        {task.assignee && <span>Assigned to: <span className="font-medium">{task.assignee.name}</span></span>}
                        {task.dueDate && (
                          <span className={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-medium' : ''}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span>Created by: {task.createdBy.name}</span>
                      </div>

                      {/* Expanded Content */}
                      {expandedTask === task.id && (
                        <div className="ml-5">
                          {/* Checklist */}
                          <TaskChecklist
                            taskId={task.id}
                            subtasksList={task.subtasks || []}
                            onRefresh={fetchProject}
                          />

                          {/* Labels */}
                          {project.labels && (
                            <LabelPicker
                              projectId={id}
                              taskId={task.id}
                              taskLabels={task.labels || []}
                              projectLabels={project.labels}
                              onRefresh={fetchProject}
                            />
                          )}

                          {/* Files */}
                          {task.files && task.files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-2">Attachments</p>
                              <div className="space-y-1">
                                {task.files.map(file => (
                                  <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                    <a
                                      href={`/uploads/${file.path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-indigo-600 hover:underline truncate"
                                    >
                                      {file.name}
                                    </a>
                                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                      <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)}KB</span>
                                      {isAdmin && (
                                        <button onClick={() => handleDeleteFile(file.id)} className="text-red-500 text-xs hover:underline">Del</button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2 flex items-center space-x-3">
                            <label className="cursor-pointer text-xs text-indigo-600 hover:underline">
                              + Attach file
                              <input
                                type="file"
                                className="hidden"
                                onChange={e => {
                                  if (e.target.files[0]) {
                                    handleFileUpload(task.id, e.target.files[0]);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                            <label className="cursor-pointer text-xs text-indigo-600 hover:underline">
                              + Attach multiple
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={e => {
                                  if (e.target.files.length) {
                                    handleUploadMultipleFiles(task.id, e.target.files);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Task Links */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-500">Links</p>
                              <button
                                onClick={() => {
                                  loadTaskLinks(task.id);
                                  const el = document.getElementById(`task-link-form-${task.id}`);
                                  el.classList.toggle('hidden');
                                }}
                                className="text-xs text-indigo-600 hover:underline"
                              >+ Add link</button>
                            </div>
                            <form
                              id={`task-link-form-${task.id}`}
                              className="hidden mb-2 flex gap-1"
                              onSubmit={e => handleAddTaskLink(task.id, e)}
                            >
                              <input name="url" placeholder="URL" className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" required />
                              <input name="title" placeholder="Title" className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" required />
                              <button type="submit" className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">Add</button>
                            </form>
                            {(taskLinks[task.id] || []).length > 0 && (
                              <div className="space-y-1">
                                {(taskLinks[task.id] || []).map(link => (
                                  <div key={link.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate">
                                      {link.title}
                                    </a>
                                    <button onClick={() => handleDeleteTaskLink(link.id, task.id)} className="text-red-500 text-xs hover:underline ml-2 flex-shrink-0">Del</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Task Chat */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-2">Task Chat</p>
                            <ChatBox taskId={task.id} maxHeight="200px" />
                          </div>

                          {/* Comments */}
                          <TaskComments
                            taskId={task.id}
                            commentsList={task.comments || []}
                            onRefresh={fetchProject}
                          />

                          {/* Time Tracking */}
                          <TimeLog
                            taskId={task.id}
                            entries={task.timeEntries || []}
                            totalHours={(task.timeEntries || []).reduce((s, e) => s + e.hours, 0)}
                            onRefresh={fetchProject}
                          />

                          {/* Activity */}
                          <TaskActivity
                            taskId={task.id}
                            taskTitle={task.title}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleWatchTask(task.id)}
                        className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                          isWatching(task)
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                        }`}
                        title={isWatching(task) ? 'Unwatch' : 'Watch'}
                      >
                        {isWatching(task) ? '👁 Watching' : '👁 Watch'}
                      </button>
                      {editTaskId === task.id ? (
                        <select
                          value={editStatus}
                          onChange={e => {
                            handleUpdateTask(task.id, { title: task.title, status: e.target.value });
                            setEditTaskId(null);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        >
                          {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      ) : (
                        <button
                          onClick={() => {
                            setEditTaskId(task.id);
                            setEditStatus(task.status);
                          }}
                          className="text-indigo-600 text-sm hover:underline"
                        >
                          Update
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Phases & Members */}
        <div className="space-y-6">
          {/* Phases */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Phases ({project.phases?.length || 0})</h2>
            {project.phases?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No phases defined</p>
            ) : (
              <div className="space-y-3">
                {project.phases.map(phase => (
                  <div key={phase.id} className="border-l-4 border-indigo-400 pl-3">
                    <p className="text-sm font-medium text-gray-700">{phase.name}</p>
                    {phase.description && <p className="text-xs text-gray-500">{phase.description}</p>}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        phase.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        phase.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{phase.status}</span>
                      {phase.startDate && <span className="text-xs text-gray-400">{new Date(phase.startDate).toLocaleDateString()}</span>}
                      {phase.endDate && <span className="text-xs text-gray-400">→ {new Date(phase.endDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Documents ({projectDocs.length})</h2>
              {isAdmin && (
                <label className="text-indigo-600 text-sm font-medium cursor-pointer hover:underline">
                  + Upload
                  <input type="file" multiple className="hidden" onChange={handleUploadDocs} />
                </label>
              )}
            </div>
            {projectDocs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No documents uploaded</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {projectDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <a
                      href={`/uploads/${doc.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline truncate"
                    >
                      {doc.name}
                    </a>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-400">{(doc.size / 1024).toFixed(0)}KB</span>
                      {isAdmin && (
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-500 text-xs hover:underline">Del</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Links ({projectLinks.length})</h2>
              {isAdmin && (
                <button onClick={() => setShowAddLink(true)} className="text-indigo-600 text-sm font-medium hover:underline">+ Add</button>
              )}
            </div>

            {showAddLink && (
              <form onSubmit={handleAddLink} className="mb-4 space-y-2">
                <input
                  type="url"
                  placeholder="URL *"
                  value={linkForm.url}
                  onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Title *"
                  value={linkForm.title}
                  onChange={e => setLinkForm({ ...linkForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={linkForm.description}
                  onChange={e => setLinkForm({ ...linkForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex space-x-2">
                  <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Add</button>
                  <button type="button" onClick={() => { setShowAddLink(false); setLinkForm({ url: '', title: '', description: '' }); }} className="text-gray-500 text-sm">Cancel</button>
                </div>
              </form>
            )}

            {projectLinks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No links added</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {projectLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline truncate"
                    >
                      {link.title}
                    </a>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      {link.description && <span className="text-xs text-gray-400 truncate max-w-[100px]">{link.description}</span>}
                      {isAdmin && (
                        <button onClick={() => handleDeleteLink(link.id)} className="text-red-500 text-xs hover:underline">Del</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Members ({project.members.length})</h2>
              {isSuperAdmin && (
                <button onClick={() => setShowMemberForm(true)} className="text-indigo-600 text-sm font-medium hover:underline">+ Add</button>
              )}
            </div>

            {showMemberForm && (
              <form onSubmit={handleAddMember} className="mb-4 space-y-2">
                <input
                  type="email"
                  placeholder="Member email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex space-x-2">
                  <select
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Add</button>
                  <button type="button" onClick={() => setShowMemberForm(false)} className="text-gray-500 text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {project.members.map(member => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{member.user.name}</p>
                    <p className="text-xs text-gray-400">{member.user.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                    {isSuperAdmin && member.role !== 'ADMIN' && (
                      <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
