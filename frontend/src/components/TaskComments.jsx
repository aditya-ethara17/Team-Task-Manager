import { useState } from 'react';
import { comments } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TaskComments({ taskId, commentsList, onRefresh }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await comments.create(taskId, { content });
      setContent('');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await comments.delete(commentId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-2">Comments ({commentsList.length})</p>
      <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
        {commentsList.map((c) => (
          <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-gray-700">{c.user.name}</span>
                <span className="text-xs text-gray-400 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              {(c.user.id === user?.id || user?.role === 'SUPER_ADMIN') && (
                <button onClick={() => handleDelete(c.id)} className="text-red-400 text-xs hover:text-red-600 ml-2">✕</button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
          </div>
        ))}
        {commentsList.length === 0 && <p className="text-xs text-gray-400 italic">No comments yet</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
