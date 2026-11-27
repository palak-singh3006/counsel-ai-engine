/**
 * Counsel — Smart Advocate Office Management System
 * API Service Layer connected to the Main Node.js/Express Backend
 */

import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: injects Supabase JWT bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('counsel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: graceful 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('counsel_token');
      window.dispatchEvent(new CustomEvent('counsel:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err) {
    console.error('[Counsel Request Error]', err);
  }

  const status = err?.response?.status;
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    '';

  const lower = String(raw).toLowerCase();

  // Translate infrastructure / connectivity errors into clear user-facing guidance
  if (
    lower.includes('network error') ||
    lower.includes('econnrefused') ||
    lower.includes('timeout') ||
    lower.includes('supabase') ||
    lower.includes('fastapi') ||
    lower.includes('gemini') ||
    lower.includes('ai engine') ||
    lower.includes('ai_engine')
  ) {
    if (status === 504 || lower.includes('timeout')) {
      return 'The request took too long to complete. Please try again with a smaller document or retry in a moment.';
    }
    if (lower.includes('ai') || lower.includes('gemini') || lower.includes('fastapi')) {
      return 'The AI assistant is temporarily unavailable. Please try again shortly.';
    }
    return 'Unable to connect right now. Please check your connection and try again.';
  }

  if (status >= 500 && !raw) {
    return fallback;
  }

  return raw || fallback;
}

/* ==========================================================================
   0. AUTH & PROFILE SERVICE
   ========================================================================== */
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

/* ==========================================================================
   1. DASHBOARD & HEALTH SERVICE
   ========================================================================== */
export const dashboardService = {
  getStats: () => api.get('/dashboard'),
  getBackendHealth: () => api.get('/health'),
};

/* ==========================================================================
   2. CLIENT SERVICE
   ========================================================================== */
export const clientService = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

/* ==========================================================================
   3. CASE / MATTER SERVICE
   ========================================================================== */
export const caseService = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
};

/* ==========================================================================
   4. HEARING SERVICE
   ========================================================================== */
export const hearingService = {
  getAll: (params) => api.get('/hearings', { params }),
  getById: (id) => api.get(`/hearings/${id}`),
  create: (data) => api.post('/hearings', data),
  update: (id, data) => api.put(`/hearings/${id}`, data),
  delete: (id) => api.delete(`/hearings/${id}`),
};

/* ==========================================================================
   5. DOCUMENT MANAGEMENT SERVICE
   ========================================================================== */
export const documentService = {
  getAll: (params) => api.get('/documents', { params }),
  getByCase: (caseId) => api.get(`/documents/case/${caseId}`),
  getById: (id) => api.get(`/documents/${id}`),
  getDownloadUrl: (id) => api.get(`/documents/${id}/download`),
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/documents/${id}`),
};

/* ==========================================================================
   6. FINANCIALS & BILLING SERVICE
   ========================================================================== */
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getByCase: (caseId) => api.get(`/payments/case/${caseId}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

/* ==========================================================================
   7. AI CASE INTELLIGENCE WORKBENCH SERVICE
   ========================================================================== */
export const aiService = {
  getHealth: () => api.get('/ai/health'),
  runWorkflow: (payload) => {
    if (payload instanceof FormData) {
      return api.post('/ai/agent-workflow', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/ai/agent-workflow', payload);
  },
  getAnalysesByCase: (caseId) => api.get(`/ai/analyses/case/${caseId}`),
  getAnalysisResult: (id) => api.get(`/ai/analysis/${id}`),
  saveReview: (id, data) => api.post(`/ai/analysis/${id}/review`, data),
  certifyAnalysis: (id, data) => api.post(`/ai/analysis/${id}/certify`, data),
};

export default api;
