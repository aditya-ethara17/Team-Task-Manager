import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { issues, projects } from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const severityOptions = ['CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL'];

const statusBadge = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  RESOLVED: 'bg-green-100 text-green-800',
  REOPENED: 'bg-orange-100 text-orange-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const severityBadge = {
  CRITICAL: 'bg-red-100 text-red-800',
  MAJOR: 'bg-orange-100 text-orange-800',
  MINOR: 'bg-blue-100 text-blue-700',
  TRIVIAL: 'bg-gray-100 text-gray-600',
};

export default function Issues() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState('list');
  const [issuesList, setIssuesList] = useState([]);
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', severity: 'MAJOR', dueDate: '', assigneeId: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const projectRes = await projects.getById(id);
      const myMembership = projectRes.data.members.find(m => m.user.id === user?.id);
      setIsAdmin(isSuperAdmin || myMembership?.role === 'ADMIN');
      setMembers(projectRes.data.members || []);

      if (view === 'board') {
        const { data } = await issues.kanban(id);
        setColumns(data);
      } else {
        const params = {};
        if (filterStatus) params.status = filterStatus;
        if (filterPriority) params.priority = filterPriority;
        if (filterSeverity) params.severity = filterSeverity;
        const { data } = await issues.getByProject(id, params);
        setIssuesList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [id, view, filterStatus, filterPriority, filterSeverity]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await issues.create(id, form);
      setForm({ title: '', description: '', priority: 'MEDIUM', severity: 'MAJOR', dueDate: '', assigneeId: '' });
      setShowForm(false);
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create issue');
    }
  };

  const handleUpdate = async (issueId, data) => {
    try {
      await issues.update(issueId, data);
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      await issues.delete(issueId);
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading && !issuesList.length && !columns) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate(`/projects/${id}`)} className="text-sm text-indigo-600 hover:underline mb-1">&larr; Back to Project</button>
          <h1 className="text-2xl font-bold text-gray-800">Issues</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>List</button>
          <button onClick={() => setView('board')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'board' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>Board</button>
          {isAdmin && <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700">+ New Issue</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-medium text-gray-800 mb-4">New Issue</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Issue title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} />
            <div className="grid grid-cols-4 gap-3">
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {severityOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <select value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create</button>
          </div>
        </form>
      )}

      {view === 'list' && (
        <>
          <div className="flex space-x-2 mb-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">All status</option>
              {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">All priority</option>
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">All severity</option>
              {severityOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {issuesList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><p className="text-gray-400">No issues yet</p></div>
          ) : (
            <div className="space-y-2">
              {issuesList.map(issue => (
                <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-800">{issue.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge[issue.status]}`}>{issue.status.replace('_', ' ')}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityBadge[issue.severity]}`}>{issue.severity}</span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{issue.priority}</span>
                      </div>
                      {issue.description && <p className="text-sm text-gray-500 mt-1">{issue.description}</p>}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        {issue.assignee && <span>Assigned: {issue.assignee.name}</span>}
                        <span>Reported by: {issue.reporter.name}</span>
                        {issue.dueDate && <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <select value={issue.status} onChange={e => handleUpdate(issue.id, { title: issue.title, status: e.target.value })} className="px-2 py-1 border border-gray-300 rounded text-sm">
                        {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      {isAdmin && <button onClick={() => handleDelete(issue.id)} className="text-red-500 text-sm hover:underline">Del</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'board' && columns && (
        <div className="grid grid-cols-5 gap-3">
          {statusOptions.map(col => (
            <div key={col} className="bg-gray-50 rounded-xl border-t-4 border-gray-300">
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{col.replace('_', ' ')}</h3>
                <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">{(columns[col] || []).length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[150px]">
                {(columns[col] || []).map(issue => (
                  <div key={issue.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                    <p className="text-sm font-medium text-gray-800">{issue.title}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${severityBadge[issue.severity]}`}>{issue.severity}</span>
                      <span className="text-xs text-gray-400">{issue.priority}</span>
                    </div>
                    {issue.assignee && <p className="text-xs text-gray-400 mt-1">{issue.assignee.name}</p>}
                  </div>
                ))}
                {(!columns[col] || columns[col].length === 0) && (
                  <div className="flex items-center justify-center h-20 text-xs text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
