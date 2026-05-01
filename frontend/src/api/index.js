import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saarthi_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: centralized error handling ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response = network/server is down
    if (!error.response) {
      error.userMessage = 'Network error — please check your connection.';
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      localStorage.removeItem('saarthi_token');
      localStorage.removeItem('saarthi_user');
      window.location.href = '/login';
    } else if (status === 403) {
      error.userMessage = error.response.data?.message || 'You don\'t have permission to do this.';
    } else if (status === 404) {
      error.userMessage = error.response.data?.message || 'Resource not found.';
    } else if (status >= 500) {
      error.userMessage = 'Server error — please try again later.';
    } else {
      error.userMessage = error.response.data?.message || 'Something went wrong.';
    }

    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  list: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  get: (taskId) => api.get(`/tasks/${taskId}`),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
};

// ─── Comments ────────────────────────────────────────────────────────────────
export const commentsAPI = {
  list: (taskId) => api.get(`/tasks/${taskId}/comments`),
  add: (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text }),
  delete: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  generateTasks: (projectGoal) => api.post('/ai/generate-tasks', { projectGoal }),
};

export default api;

