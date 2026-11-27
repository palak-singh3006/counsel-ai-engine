/**
 * Counsel — Smart Advocate Office Management System
 * API Service Layer & Proposed Backend Integration Contract
 *
 * NOTE: These endpoints, schemas, and default fallback URL (http://localhost:8000/api)
 * represent the frontend client's proposed integration interface. The actual backend
 * base URL, route paths, payload schemas, and authentication handshake are subject to
 * confirmation by the backend teammate.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: injects bearer token from local storage if authenticated
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
      // On 401, redirect or emit unauthenticated event when backend auth is linked
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   1. CLIENT SERVICE & CONTRACT
   ========================================================================== */

/**
 * @typedef {Object} ClientPayload
 * @property {string} name - Full client name or organization legal entity
 * @property {'individual'|'corporate'} type - Entity classification
 * @property {string} email - Primary contact email
 * @property {string} phone - Primary telephone / mobile contact
 * @property {string} address - Registered address / jurisdiction
 * @property {string} [notes] - Optional client dossier remarks
 */

export const clientService = {
  /** GET /clients - Retrieve list of all clients */
  getAll: () => api.get('/clients'),

  /** GET /clients/:id - Retrieve client profile with associated matters */
  getById: (id) => api.get(`/clients/${id}`),

  /** POST /clients - Register a new client entity */
  create: (data) => api.post('/clients', data),

  /** PUT /clients/:id - Update existing client dossier */
  update: (id, data) => api.put(`/clients/${id}`, data),

  /** DELETE /clients/:id - Archive or remove client record */
  delete: (id) => api.delete(`/clients/${id}`),
};

/* ==========================================================================
   2. CASE / MATTER SERVICE & CONTRACT
   ========================================================================== */

/**
 * @typedef {Object} CasePayload
 * @property {string} title - Case caption (e.g. "Verma vs State of UP")
 * @property {string} case_number - Court registration / CNR number
 * @property {string} client_id - Foreign key to associated client
 * @property {'criminal'|'civil'|'corporate'|'arbitration'|'constitutional'} type - Legal domain
 * @property {string} court - Adjudicating bench (e.g. "High Court Lucknow")
 * @property {string} judge - Presiding judicial officer
 * @property {'active'|'pending'|'disposed'} status - Procedural status
 * @property {string} filing_date - Date of institution (YYYY-MM-DD)
 * @property {string} [description] - Scope and summary of brief
 */

export const caseService = {
  /** GET /cases - Retrieve list of matters with optional filtering */
  getAll: () => api.get('/cases'),

  /** GET /cases/:id - Retrieve complete case dossier, filings, and hearings */
  getById: (id) => api.get(`/cases/${id}`),

  /** POST /cases - Institute new legal matter */
  create: (data) => api.post('/cases', data),

  /** PUT /cases/:id - Update matter metadata */
  update: (id, data) => api.put(`/cases/${id}`, data),

  /** DELETE /cases/:id - Archive legal matter */
  delete: (id) => api.delete(`/cases/${id}`),
};

/* ==========================================================================
   3. HEARING SERVICE & CONTRACT
   ========================================================================== */

/**
 * @typedef {Object} HearingPayload
 * @property {string} case_id - Foreign key to linked matter
 * @property {string} date - Hearing listing date (YYYY-MM-DD)
 * @property {string} time - Time of call (e.g. "10:30 AM")
 * @property {string} courtroom - Courtroom / Bench identifier (e.g. "Court No. 3")
 * @property {string} judge - Presiding judge
 * @property {string} purpose - Hearing objective (e.g. "Arguments on Regular Bail")
 * @property {'upcoming'|'completed'|'adjourned'} status - Listing status
 * @property {string} [notes] - Advocate appearance notes or next directions
 */

export const hearingService = {
  /** GET /hearings - Retrieve calendar listing of all hearings */
  getAll: () => api.get('/hearings'),

  /** GET /hearings/:id - Retrieve hearing details */
  getById: (id) => api.get(`/hearings/${id}`),

  /** POST /hearings - Schedule a new court appearance or motion listing */
  create: (data) => api.post('/hearings', data),

  /** PUT /hearings/:id - Record hearing outcome or adjournment */
  update: (id, data) => api.put(`/hearings/${id}`, data),

  /** DELETE /hearings/:id - Cancel or remove listing */
  delete: (id) => api.delete(`/hearings/${id}`),
};

/* ==========================================================================
   4. DOCUMENT MANAGEMENT SERVICE & CONTRACT
   ========================================================================== */

export const documentService = {
  /** GET /documents - Retrieve document catalog */
  getAll: () => api.get('/documents'),

  /** GET /documents/:id - Retrieve document metadata and signed download URL */
  getById: (id) => api.get(`/documents/${id}`),

  /**
   * POST /documents/upload - Multipart upload for legal pleadings, petitions, orders
   * @param {FormData} formData - Contains file, case_id, category, and confidentiality tags
   */
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** DELETE /documents/:id - Delete document from record */
  delete: (id) => api.delete(`/documents/${id}`),
};

/* ==========================================================================
   5. FINANCIALS & BILLING SERVICE & CONTRACT
   ========================================================================== */

/**
 * @typedef {Object} PaymentPayload
 * @property {string} case_id - Foreign key to linked matter
 * @property {string} client_id - Foreign key to paying client
 * @property {number} amount - Transaction amount in INR
 * @property {'retainer'|'court_fee'|'hearing_fee'|'drafting_charge'} category - Accounting head
 * @property {'paid'|'pending'|'overdue'} status - Settlement state
 * @property {string} date - Invoice or receipt date (YYYY-MM-DD)
 * @property {string} [invoice_number] - Tax invoice identifier
 */

export const paymentService = {
  /** GET /payments - Retrieve firm billing ledger and payment records */
  getAll: () => api.get('/payments'),

  /** GET /payments/:id - Retrieve single transaction receipt */
  getById: (id) => api.get(`/payments/${id}`),

  /** POST /payments - Record a fee collection or issue an invoice */
  create: (data) => api.post('/payments', data),

  /** PUT /payments/:id - Update settlement state */
  update: (id, data) => api.put(`/payments/${id}`, data),
};

/* ==========================================================================
   6. AI CASE INTELLIGENCE WORKBENCH CONTRACT
   ========================================================================== */

/**
 * AI Workbench Multi-Agent Pipeline Request Contract
 * @typedef {Object} AIAnalysisRequest
 * @property {string} case_id - Foreign key to associated case
 * @property {string} task_prompt - Advocate directive & legal objective
 * @property {string} document_text - Raw pleading, order, or transcript text
 * @property {Object} [options] - Pipeline flags (e.g. citation_jurisdiction: 'ALLAHABAD_HC')
 */

/**
 * AI Workbench Multi-Agent Pipeline Response Output Contract
 * @typedef {Object} AIAnalysisResult
 * @property {string} analysis_id - Unique pipeline execution UUID
 * @property {string} case_id - Associated matter
 * @property {string} case_summary - Executive brief summary
 * @property {Array<{role: string, name: string, counsel: string}>} parties - Named legal entities
 * @property {Array<{statute: string, issue: string, significance: string}>} legal_issues - Statutory points
 * @property {Array<{id: string, fact: string, source: string, confidence: string}>} material_facts - Verified findings
 * @property {Array<{date: string, event: string, impact: string}>} timeline - Chronological sequence
 * @property {Array<{item: string, type: string, status: string}>} evidence - Evidentiary catalog
 * @property {Array<{title: string, detail: string}>} strategy_considerations - Defense & argument angles
 * @property {Array<{title: string, priority: string, deadline: string, detail: string}>} recommended_actions - Procedural motions
 * @property {Array<{item: string, description: string, impact: string}>} missing_information - Lacunae & caveats
 * @property {Array<{flag: string, status: string, note: string}>} review_flags - Registry compliance checks
 * @property {{overall_confidence: string, verdict: string, key_vulnerability: string}} confidence_or_uncertainty - Assessment
 * @property {Array<string>} source_references - Cited case laws & acts
 * @property {'pending_advocate_review'|'approved_by_advocate'} review_status - Advocate certification state
 */

export const aiService = {
  /**
   * POST /ai/analyze - Enqueue multi-agent analysis on pleading / evidentiary record
   * @param {AIAnalysisRequest} data
   */
  startAnalysis: (data) => api.post('/ai/analyze', data),

  /**
   * GET /ai/analysis/:id/status - Poll status of asynchronous agent pipeline
   * @returns {{ analysis_id: string, status: 'queued'|'running'|'completed'|'failed', current_agent: string, progress_percent: number }}
   */
  getAnalysisStatus: (id) => api.get(`/ai/analysis/${id}/status`),

  /**
   * GET /ai/analysis/:id - Fetch final synthesized intelligence report conforming to AIAnalysisResult
   */
  getAnalysisResult: (id) => api.get(`/ai/analysis/${id}`),

  /**
   * GET /ai/analysis/:id/agents/:agentName - Stream agent-specific reasoning traces
   */
  getAgentProgress: (analysisId, agentName) =>
    api.get(`/ai/analysis/${analysisId}/agents/${agentName}`),

  /**
   * POST /ai/analysis/:id/certify - Senior Advocate formal certification & approval
   * @param {string} id - Analysis ID
   * @param {{ advocate_id: string, signature_stamp: string, notes?: string }} data
   */
  certifyAnalysis: (id, data) => api.post(`/ai/analysis/${id}/certify`, data),
};

export default api;
