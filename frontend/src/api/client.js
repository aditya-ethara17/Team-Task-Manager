import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

export const projects = {
  search: (q) => api.get(`/users/search`, { params: { q } }),
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
};

export const tasks = {
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getById: (id) => api.get(`/tasks/${id}`),
  search: (params) => api.get('/tasks/search', { params }),
  kanban: (projectId) => api.get(`/tasks/kanban/${projectId}`),
  my: (params) => api.get('/tasks/my', { params }),
  myKanban: () => api.get('/tasks/my/kanban'),
  watch: (id) => api.post(`/tasks/${id}/watch`),
  watchStatus: (id) => api.get(`/tasks/${id}/watch`),
};

export const issues = {
  getByProject: (projectId, params) => api.get(`/issues/project/${projectId}`, { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (projectId, data) => api.post(`/issues/project/${projectId}`, data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
  kanban: (projectId) => api.get(`/issues/kanban/${projectId}`),
};

export const phases = {
  getByProject: (projectId) => api.get(`/phases/project/${projectId}`),
  create: (projectId, data) => api.post(`/phases/project/${projectId}`, data),
  update: (id, data) => api.put(`/phases/${id}`, data),
  delete: (id) => api.delete(`/phases/${id}`),
};

export const timesheets = {
  getMy: (params) => api.get('/timesheets/my', { params }),
};

export const comments = {
  getByTask: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (taskId, data) => api.post(`/comments/task/${taskId}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const subtasks = {
  getByTask: (taskId) => api.get(`/subtasks/task/${taskId}`),
  create: (taskId, data) => api.post(`/subtasks/task/${taskId}`, data),
  toggle: (id) => api.patch(`/subtasks/${id}/toggle`),
  delete: (id) => api.delete(`/subtasks/${id}`),
};

export const labels = {
  getByProject: (projectId) => api.get(`/labels/project/${projectId}`),
  create: (projectId, data) => api.post(`/labels/project/${projectId}`, data),
  delete: (id) => api.delete(`/labels/${id}`),
  addToTask: (taskId, labelId) => api.post(`/labels/task/${taskId}`, { labelId }),
  removeFromTask: (taskId, labelId) => api.delete(`/labels/task/${taskId}/label/${labelId}`),
};

export const notifications = {
  getMy: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const timeEntries = {
  getByTask: (taskId) => api.get(`/time/task/${taskId}`),
  create: (taskId, data) => api.post(`/time/task/${taskId}`, data),
  delete: (id) => api.delete(`/time/${id}`),
};

export const dashboard = {
  getStats: () => api.get('/dashboard'),
};

export const users = {
  search: (q) => api.get(`/users/search`, { params: { q } }),
  getAll: () => api.get('/users'),
  updateRole: (id, data) => api.patch(`/users/${id}/role`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const projectDocuments = {
  upload: (projectId, files) => {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    return api.post(`/documents/project/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getByProject: (projectId) => api.get(`/documents/project/${projectId}`),
  delete: (documentId) => api.delete(`/documents/${documentId}`),
};

export const resourceLinks = {
  create: (data) => api.post('/links', data),
  getByProject: (projectId) => api.get(`/links/project/${projectId}`),
  getByTask: (taskId) => api.get(`/links/task/${taskId}`),
  delete: (linkId) => api.delete(`/links/${linkId}`),
};

export const filesApi = {
  upload: (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/files/task/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadMultiple: (taskId, files) => {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    return api.post(`/files/task/${taskId}/multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

export default api;

export const chat = {
  send: (data) => api.post('/chat', data),
  getByProject: (projectId, since) => api.get(`/chat/project/${projectId}`, { params: { since } }),
  getByTask: (taskId, since) => api.get(`/chat/task/${taskId}`, { params: { since } }),
  getGlobal: (since) => api.get('/chat/global', { params: { since } }),
};

export const dm = {
  getConversations: () => api.get('/dm/conversations'),
  startOrGetConversation: (participantId) => api.post('/dm/conversations', { participantId }),
  getMessages: (conversationId, since) => api.get(`/dm/conversations/${conversationId}/messages`, { params: { since } }),
  sendMessage: (conversationId, content) => api.post('/dm/messages', { conversationId, content }),
};
