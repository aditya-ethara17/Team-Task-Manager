import { useState, useEffect, useRef } from 'react';
import { chat } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChatBox({ projectId, taskId, maxHeight = '300px' }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const since = messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
      let data;
      if (taskId) {
        const res = await chat.getByTask(taskId, since);
        data = res.data;
      } else if (projectId) {
        const res = await chat.getByProject(projectId, since);
        data = res.data;
      } else {
        const res = await chat.getGlobal(since);
        data = res.data;
      }
      if (data.length > 0) {
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));
          const newMsgs = data.filter(m => !existing.has(m.id));
          return [...prev, ...newMsgs];
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setContent('');
    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [projectId, taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const payload = { content: content.trim() };
      if (taskId) payload.taskId = taskId;
      else if (projectId) payload.projectId = projectId;
      const { data } = await chat.send(payload);
      setMessages(prev => [...prev, data]);
      setContent('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const roleBadge = (role) => {
    if (role === 'SUPER_ADMIN') return 'bg-yellow-100 text-yellow-800';
    if (role === 'ADMIN') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
      <div
        className="overflow-y-auto space-y-2 mb-3 pr-1"
        style={{ maxHeight }}
      >
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-4">No messages yet</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.user.id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${msg.user.id === user?.id ? 'bg-indigo-50' : 'bg-gray-50'} rounded-lg px-3 py-2`}>
                {msg.user.id !== user?.id && (
                  <div className="flex items-center space-x-1 mb-0.5">
                    <span className="text-xs font-medium text-gray-700">{msg.user.name}</span>
                    <span className={`px-1 py-0.5 text-[10px] font-medium rounded ${roleBadge(msg.user.role)}`}>
                      {msg.user.role === 'SUPER_ADMIN' ? 'SA' : msg.user.role === 'ADMIN' ? 'A' : 'M'}
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-800">{msg.content}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
