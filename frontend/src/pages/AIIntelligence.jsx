import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  Scale,
  CheckSquare,
  Square,
  Info,
  AlertTriangle,
  Award,
  Users,
  FileText,
  HelpCircle,
  XCircle,
  Edit3,
  Save,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import {
  caseService,
  documentService,
  aiService,
  extractErrorMessage,
} from '../services/api';

const analysisSteps = [
  {
    id: 'orchestrator',
    name: 'Document Processing',
    role: 'File preparation and text validation',
    description: 'Prepares your selected case documents for review.',
  },
  {
    id: 'document_analyst',
    name: 'Case Summary & Facts',
    role: 'Parties, verified facts, claims & gaps',
    description: 'Extracts grounded facts, disputed claims, payment terms, and missing evidence.',
  },
  {
    id: 'timeline_agent',
    name: 'Case Timeline',
    role: 'Chronological events & date conflicts',
    description: 'Orders dated events chronologically and highlights conflicting dates.',
  },
  {
    id: 'action_agent',
    name: 'Suggested Next Steps',
    role: 'Prioritized preparation tasks',
    description: 'Recommends evidence-gathering and verification tasks by priority.',
  },
  {
    id: 'reviewer_agent',
    name: 'Accuracy & Source Check',
    role: 'Source verification & gap flags',
    description: 'Checks findings against source documents and flags unsupported claims.',
  },
];

const STEP_STATUS_LABELS = {
  idle: 'Ready',
  processing: 'In progress',
  done: 'Complete',
  failed: 'Needs attention',
};

const REVIEW_BADGE_MAP = {
  ai_generated: {
    shortLabel: 'AI Draft',
    label: 'AI-Generated Draft (Unverified)',
    bg: 'var(--brass-bg)',
    color: 'var(--brass-muted)',
    banner: 'rgba(184, 150, 62, 0.07)',
    description: 'AI findings support case preparation and require advocate review before formal reliance.',
  },
  under_review: {
    shortLabel: 'Under Review',
    label: 'Under Advocate Review',
    bg: 'var(--brass-bg)',
    color: 'var(--brass-muted)',
    banner: 'rgba(184, 150, 62, 0.1)',
    description: 'Currently under advocate review. Save your notes or approve once verified.',
  },
  approved: {
    shortLabel: 'Approved',
    label: 'Advocate Approved',
    bg: 'var(--sage-bg)',
    color: 'var(--sage-text)',
    banner: 'rgba(107, 143, 113, 0.08)',
    description: 'Reviewed, verified, and approved by the supervising advocate.',
  },
  rejected: {
    shortLabel: 'Rejected',
    label: 'Needs Re-analysis',
    bg: 'var(--terracotta-bg)',
    color: 'var(--terracotta-text)',
    banner: 'rgba(196, 105, 74, 0.08)',
    description: 'Marked as rejected by advocate. Run a fresh analysis with updated documents or notes.',
  },
};

export default function AIIntelligence() {
  const toast = useToast();
  const location = useLocation();

  const [casesList, setCasesList] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(location.state?.selectedCaseId || '');
  const [caseDocuments, setCaseDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(
    location.state?.selectedDocumentId ? [location.state.selectedDocumentId] : []
  );
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [taskPrompt, setTaskPrompt] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  const [aiEngineHealth, setAiEngineHealth] = useState(null);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [workflowState, setWorkflowState] = useState('idle'); // 'idle' | 'running' | 'completed' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [checkedActions, setCheckedActions] = useState({});

  // Advocate Review & Correction State
  const [advocateComments, setAdvocateComments] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [correctedSummary, setCorrectedSummary] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const hydrateResult = useCallback((result) => {
    if (!result) {
      setAnalysisResult(null);
      setWorkflowState('idle');
      return;
    }
    setAnalysisResult(result);
    setAdvocateComments(result.review?.advocateComments || '');
    setCorrectedSummary(
      result.review?.correctedResult?.summaryText ?? result.summary?.text ?? ''
    );
    setIsEditingSummary(false);
    setWorkflowState('completed');
  }, []);

  // Load cases and AI Engine health on mount
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [casesRes, healthRes] = await Promise.allSettled([
          caseService.getAll(),
          aiService.getHealth(),
        ]);
        if (!active) return;

        if (casesRes.status === 'fulfilled') {
          const list = casesRes.value.data?.data || [];
          setCasesList(list);
          if (!selectedCaseId && list.length > 0) {
            setSelectedCaseId(list[0].id);
          }
        }
        if (healthRes.status === 'fulfilled') {
          setAiEngineHealth(healthRes.value.data?.data || { status: 'healthy' });
        } else {
          setAiEngineHealth({ status: 'unreachable' });
        }
      } catch {
        // Handled per settled promise
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [selectedCaseId]);

  // Load documents & saved AI analyses whenever selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) return;
    let active = true;
    async function loadCaseContext() {
      try {
        const [docsRes, analysesRes] = await Promise.all([
          documentService.getByCase(selectedCaseId),
          aiService.getAnalysesByCase(selectedCaseId),
        ]);
        if (!active) return;

        const docs = docsRes.data?.data || [];
        setCaseDocuments(docs);

        // Preserve incoming document selection if it belongs to this case
        const incomingDocId = location.state?.selectedDocumentId;
        if (incomingDocId && docs.some((d) => d.id === incomingDocId)) {
          setSelectedDocIds([incomingDocId]);
        } else {
          setSelectedDocIds([]);
        }

        const analyses = analysesRes.data?.data || [];
        setSavedAnalyses(analyses);
        const latestCompleted = analyses.find((a) => a.processingStatus === 'completed');
        if (latestCompleted) {
          hydrateResult(latestCompleted);
        } else {
          setAnalysisResult(null);
          setWorkflowState('idle');
        }
      } catch (err) {
        if (active) {
          toast(extractErrorMessage(err, 'Failed to load case documents or AI history'), 'error');
        }
      }
    }
    loadCaseContext();
  }, [selectedCaseId, location.state, hydrateResult, toast]);

  const toggleDocumentSelection = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const startAnalysis = async () => {
    if (!selectedCaseId) {
      toast('Please select a legal matter first', 'error');
      return;
    }
    if (selectedDocIds.length === 0 && attachedFiles.length === 0 && !documentContent.trim()) {
      toast('Select at least one case document, attach a file, or enter case text', 'error');
      return;
    }

    setWorkflowState('running');
    setErrorMessage('');

    try {
      let res;
      if (attachedFiles.length > 0) {
        const fd = new FormData();
        fd.append('caseId', selectedCaseId);
        if (selectedDocIds.length > 0) fd.append('documentIds', JSON.stringify(selectedDocIds));
        if (taskPrompt.trim()) fd.append('task', taskPrompt.trim());
        if (documentContent.trim()) fd.append('documentText', documentContent.trim());
        attachedFiles.forEach((f) => fd.append('files', f));
        res = await aiService.runWorkflow(fd);
      } else {
        res = await aiService.runWorkflow({
          caseId: selectedCaseId,
          documentIds: selectedDocIds,
          task: taskPrompt.trim() || undefined,
          documentText: documentContent.trim() || undefined,
        });
      }

      const result = res.data?.data;
      hydrateResult(result);
      setAttachedFiles([]);

      const analysesRes = await aiService.getAnalysesByCase(selectedCaseId);
      setSavedAnalyses(analysesRes.data?.data || []);

      toast('Case analysis completed', 'success');
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        'We could not complete the document analysis right now. Please try again in a moment.'
      );
      setErrorMessage(msg);
      setWorkflowState('error');
      toast(msg, 'error');
    }
  };

  const submitReviewAction = async (nextStatus) => {
    if (!analysisResult?.analysisId) return;
    setSavingReview(true);
    try {
      const correctedResult =
        correctedSummary && correctedSummary !== analysisResult.summary?.text
          ? { ...(analysisResult.review?.correctedResult || {}), summaryText: correctedSummary }
          : analysisResult.review?.correctedResult || null;

      const payload = {
        review_status: nextStatus,
        advocate_comments: advocateComments,
        corrected_result: correctedResult,
      };

      const res =
        nextStatus === 'approved'
          ? await aiService.certifyAnalysis(analysisResult.analysisId, payload)
          : await aiService.saveReview(analysisResult.analysisId, payload);

      const updated = res.data?.data;
      hydrateResult(updated);
      setSavedAnalyses((prev) =>
        prev.map((a) => (a.analysisId === updated.analysisId ? updated : a))
      );

      toast(
        nextStatus === 'approved'
          ? 'Analysis reviewed and approved'
          : nextStatus === 'rejected'
          ? 'Analysis marked for re-analysis'
          : 'Advocate review notes saved',
        nextStatus === 'rejected' ? 'info' : 'success'
      );
    } catch (err) {
      toast(extractErrorMessage(err, 'Unable to save your review right now. Please try again.'), 'error');
    } finally {
      setSavingReview(false);
    }
  };

  const handleExportDossier = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `counsel-case-brief-${analysisResult.analysisId?.slice(0, 8) || 'report'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Case brief exported successfully', 'success');
  };

  const toggleAction = (idx) => {
    setCheckedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const reviewStatus = analysisResult?.reviewStatus || 'ai_generated';
  const reviewMeta = REVIEW_BADGE_MAP[reviewStatus] || REVIEW_BADGE_MAP.ai_generated;

  const getAgentState = (agentId) => {
    if (workflowState === 'running') return 'processing';
    if (workflowState === 'error') return 'failed';
    if (!analysisResult) return 'idle';
    if (agentId === 'orchestrator') return 'done';
    const rawStatus = analysisResult.pipelineStatus?.[agentId];
    if (!rawStatus) return 'done';
    if (rawStatus === 'success') return 'done';
    if (rawStatus.startsWith('failed')) return 'failed';
    return 'done';
  };

  const effectiveSummaryText =
    analysisResult?.review?.correctedResult?.summaryText ||
    analysisResult?.summary?.text ||
    'No case summary available for this document.';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-title">AI Case Intelligence</h1>
            <span
              style={{
                fontSize: '0.643rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '3px',
                background: aiEngineHealth?.status === 'healthy' ? 'var(--sage-bg)' : 'var(--terracotta-bg)',
                color: aiEngineHealth?.status === 'healthy' ? 'var(--sage-text)' : 'var(--terracotta-text)',
              }}
            >
              {aiEngineHealth?.status === 'healthy'
                ? 'AI Assistant Ready'
                : 'AI Assistant Temporarily Unavailable'}
            </span>
          </div>
          <p className="page-subtitle">
            AI-assisted case analysis, timelines, and preparation steps for advocate review
          </p>
        </div>

        <div className="page-actions">
          {analysisResult && (
            <button className="btn btn-primary" onClick={handleExportDossier}>
              <Download size={14} /> Export Case Brief
            </button>
          )}
        </div>
      </div>

      {/* Legal Notice Banner */}
      <div
        style={{
          background: 'rgba(184, 150, 62, 0.07)',
          border: '1px solid rgba(184, 150, 62, 0.25)',
          borderRadius: '6px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={16} style={{ color: 'var(--brass-muted)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.857rem', color: 'var(--text-secondary)' }}>
            <strong>Advocate Review Required:</strong> AI-generated findings assist with case preparation and must be verified by an advocate before formal reliance.
          </div>
        </div>
      </div>

      <div className="ai-workbench-grid">
        {/* Left Column: Case, Documents & Objective */}
        <div className="flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Analyse Legal Document</span>
              <span className="text-caption">Case Brief</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Select Matter</label>
                <select
                  className="form-input"
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                >
                  <option value="">Choose a matter...</option>
                  {casesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.case_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Uploaded Documents for this Case */}
              <div className="form-group">
                <label className="form-label">
                  Uploaded Case Documents ({caseDocuments.length})
                </label>
                {caseDocuments.length > 0 ? (
                  <div
                    style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '8px',
                      background: 'var(--stone-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {caseDocuments.map((doc) => {
                      const checked = selectedDocIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.813rem',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            background: checked ? '#fff' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDocumentSelection(doc.id)}
                          />
                          <span style={{ flex: 1 }} className="truncate">{doc.name}</span>
                          <span className="text-caption">{doc.type}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-caption" style={{ padding: '8px 10px', background: 'var(--stone-bg)', borderRadius: '6px' }}>
                    No documents uploaded for this matter yet. Attach files below or paste text.
                  </div>
                )}
              </div>

              {/* Direct File Attach */}
              <div className="form-group">
                <label className="form-label">Or Upload Documents (.pdf, .docx, .txt)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  className="form-input"
                  style={{ padding: '6px' }}
                  onChange={(e) => setAttachedFiles(Array.from(e.target.files || []))}
                />
                {attachedFiles.length > 0 && (
                  <div className="text-caption" style={{ marginTop: '4px', color: 'var(--sage-text)' }}>
                    {attachedFiles.length} file(s) ready for analysis
                  </div>
                )}
              </div>

              {/* Task Directive */}
              <div className="form-group">
                <label className="form-label">Analysis Focus (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Extract material facts, identify missing evidence, and build case timeline..."
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                />
              </div>

              {/* Supplemental Text */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Case Notes or Document Text</label>
                  <span className="text-caption">{documentContent.length} characters</span>
                </div>
                <textarea
                  className="form-textarea"
                  rows={5}
                  style={{ fontFamily: 'monospace', fontSize: '0.786rem', background: 'var(--stone-bg)' }}
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Optional: paste pleading text or case notes if you are not selecting an uploaded document..."
                />
              </div>

              <button
                className="btn btn-accent w-full"
                style={{ justifyContent: 'center', padding: '10px', marginTop: '8px' }}
                disabled={workflowState === 'running'}
                onClick={startAnalysis}
              >
                {workflowState === 'running' ? (
                  <>
                    <Clock size={15} className="animate-spin" /> Preparing Your Case Analysis...
                  </>
                ) : analysisResult ? (
                  <>
                    <RotateCcw size={15} /> Analyse Again
                  </>
                ) : (
                  <>
                    <Play size={15} /> Analyse Document
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Saved History for Case */}
          {savedAnalyses.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Previous Analyses ({savedAnalyses.length})</span>
              </div>
              <div className="card-body" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedAnalyses.map((item) => {
                  const badge = REVIEW_BADGE_MAP[item.reviewStatus] || REVIEW_BADGE_MAP.ai_generated;
                  return (
                    <button
                      key={item.analysisId}
                      type="button"
                      onClick={() => hydrateResult(item)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${analysisResult?.analysisId === item.analysisId ? 'var(--brass)' : 'var(--border-subtle)'}`,
                        background: analysisResult?.analysisId === item.analysisId ? 'var(--brass-bg)' : 'var(--stone-bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.786rem', fontWeight: 600 }}>
                          {item.matterTitle || 'Case Analysis'}
                        </span>
                        <span className="text-caption">{badge.shortLabel}</span>
                      </div>
                      <div className="text-caption">
                        {new Date(item.createdAt).toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analysis Steps */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">AI Analysis</span>
              <span className="text-caption">5 Steps</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="flex-col gap-3">
                {analysisSteps.map((step) => {
                  const state = getAgentState(step.id);
                  return (
                    <div
                      key={step.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background:
                          state === 'processing'
                            ? 'var(--brass-bg)'
                            : state === 'done'
                            ? 'rgba(107, 143, 113, 0.05)'
                            : state === 'failed'
                            ? 'var(--terracotta-bg)'
                            : 'var(--stone-bg)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {state === 'done' ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--sage-text)' }} />
                          ) : state === 'processing' ? (
                            <Clock size={16} style={{ color: 'var(--brass-muted)' }} />
                          ) : state === 'failed' ? (
                            <XCircle size={16} style={{ color: 'var(--terracotta)' }} />
                          ) : (
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1.5px solid var(--stone-light)' }} />
                          )}
                          <div style={{ fontSize: '0.857rem', fontWeight: 600 }}>{step.name}</div>
                        </div>
                        <span className="text-caption" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                          {STEP_STATUS_LABELS[state] || state}
                        </span>
                      </div>
                      <div className="text-caption" style={{ marginTop: '4px', marginLeft: '24px' }}>
                        {step.role}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Structured Findings */}
        <div>
          {workflowState === 'idle' && (
            <div className="card" style={{ minHeight: '620px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--brass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brass)', marginBottom: '16px' }}>
                <Brain size={28} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '8px' }}>
                AI Case Assistant
              </h3>
              <p className="text-body" style={{ maxWidth: '460px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Select case documents or paste case notes on the left, then click <strong>Analyse Document</strong> to generate a structured case summary, chronology, and recommended next steps.
              </p>
            </div>
          )}

          {workflowState === 'running' && (
            <div className="card" style={{ minHeight: '620px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--midnight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brass-light)', marginBottom: '20px' }}>
                <Scale size={32} className="animate-pulse" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '8px' }}>
                Preparing Your Case Analysis...
              </h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)', maxWidth: '440px' }}>
                Reviewing your case documents, extracting key facts, organizing important dates, and preparing suggested next steps for your review.
              </p>
            </div>
          )}

          {workflowState === 'error' && (
            <div className="card" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <AlertTriangle size={36} style={{ color: 'var(--terracotta)', marginBottom: '12px' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '8px' }}>
                Unable to Complete Analysis
              </h3>
              <p className="text-small" style={{ color: 'var(--terracotta-text)', maxWidth: '480px', marginBottom: '20px' }}>
                {errorMessage}
              </p>
              <button className="btn btn-primary" onClick={startAnalysis}>
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          )}

          {workflowState === 'completed' && analysisResult && (
            <div className="card" style={{ minHeight: '620px' }}>
              {/* Advocate Review / Certification Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: reviewMeta.banner,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {reviewStatus === 'approved' ? (
                      <Award size={20} style={{ color: 'var(--sage-text)', flexShrink: 0 }} />
                    ) : reviewStatus === 'rejected' ? (
                      <XCircle size={20} style={{ color: 'var(--terracotta)', flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={20} style={{ color: 'var(--brass-muted)', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.688rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            background: reviewMeta.bg,
                            color: reviewMeta.color,
                          }}
                        >
                          {reviewMeta.label}
                        </span>
                        {analysisResult.review?.certifiedAt && (
                          <span className="text-caption">
                            Certified at {new Date(analysisResult.review.certifiedAt).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="text-caption" style={{ marginTop: '3px', color: 'var(--text-secondary)' }}>
                        {reviewMeta.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {reviewStatus === 'approved' ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={savingReview}
                        onClick={() => submitReviewAction('under_review')}
                      >
                        Reopen for Revision
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={savingReview}
                          onClick={() => submitReviewAction('under_review')}
                        >
                          <Save size={13} /> Save Review
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--terracotta)' }}
                          disabled={savingReview}
                          onClick={() => submitReviewAction('rejected')}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={savingReview}
                          onClick={() => submitReviewAction('approved')}
                        >
                          <ShieldCheck size={14} /> Approve Findings
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.813rem', padding: '6px 10px', background: '#fff' }}
                    placeholder="Add advocate review notes or verification comments..."
                    value={advocateComments}
                    onChange={(e) => setAdvocateComments(e.target.value)}
                  />
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs" style={{ padding: '0 16px', background: 'var(--stone-bg)', overflowX: 'auto' }}>
                <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                  Case Summary
                </button>
                <button className={`tab ${activeTab === 'facts' ? 'active' : ''}`} onClick={() => setActiveTab('facts')}>
                  Facts &amp; Claims ({analysisResult.materialFacts?.length || 0})
                </button>
                <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
                  Case Timeline ({analysisResult.timeline?.length || 0})
                </button>
                <button className={`tab ${activeTab === 'strategy' ? 'active' : ''}`} onClick={() => setActiveTab('strategy')}>
                  Legal Issues &amp; Risks ({analysisResult.strategyConsiderations?.length || 0})
                </button>
                <button className={`tab ${activeTab === 'actions' ? 'active' : ''}`} onClick={() => setActiveTab('actions')}>
                  Suggested Next Steps ({analysisResult.recommendedActions?.length || 0})
                </button>
                <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
                  Review AI Findings ({analysisResult.reviewFlags?.length || 0})
                </button>
              </div>

              <div className="card-body">
                {/* TAB 1: Summary & Parties */}
                {activeTab === 'summary' && (
                  <div>
                    <div style={{ padding: '16px', background: 'var(--stone-bg)', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div className="text-label">
                          Executive Case Summary {analysisResult.summary?.matterType ? `· ${analysisResult.summary.matterType}` : ''}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setIsEditingSummary(!isEditingSummary)}
                        >
                          <Edit3 size={13} /> {isEditingSummary ? 'Done Editing' : 'Edit Summary'}
                        </button>
                      </div>
                      {isEditingSummary ? (
                        <textarea
                          className="form-textarea"
                          rows={4}
                          value={correctedSummary}
                          onChange={(e) => setCorrectedSummary(e.target.value)}
                        />
                      ) : (
                        <p className="text-body" style={{ color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                          {effectiveSummaryText}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div className="text-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} /> Identified Parties ({analysisResult.parties?.length || 0})
                      </div>
                      {analysisResult.parties?.length > 0 ? (
                        <div className="flex-col gap-2">
                          {analysisResult.parties.map((p, idx) => (
                            <div key={idx} style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.857rem', fontWeight: 600 }}>{p.name}</div>
                              <span style={{ fontSize: '0.643rem', fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '3px', background: 'var(--stone-bg)' }}>
                                {p.role || 'Party'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No named parties extracted.</div>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div className="text-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> Evidence Mentioned ({analysisResult.evidence?.length || 0})
                      </div>
                      {analysisResult.evidence?.length > 0 ? (
                        <div className="flex-col gap-2">
                          {analysisResult.evidence.map((ev, idx) => (
                            <div key={idx} style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.857rem' }}>
                              {ev.item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No evidentiary items explicitly referenced.</div>
                      )}
                    </div>

                    {analysisResult.paymentInformation?.length > 0 && (
                      <div>
                        <div className="text-label" style={{ marginBottom: '10px' }}>Payment &amp; Consideration Terms</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {analysisResult.paymentInformation.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Material Facts & Disputed Claims */}
                {activeTab === 'facts' && (
                  <div>
                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Verified Material Facts ({analysisResult.materialFacts?.length || 0})
                      </div>
                      {analysisResult.materialFacts?.length > 0 ? (
                        <div className="flex-col gap-3">
                          {analysisResult.materialFacts.map((f) => (
                            <div key={f.id} style={{ padding: '14px', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--sage)', borderRadius: '6px', background: '#fff' }}>
                              <div style={{ fontSize: '0.929rem', fontWeight: 500, marginBottom: '4px' }}>{f.fact}</div>
                              {f.source && (
                                <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                                  Source: <em>{f.source}</em>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No verified material facts extracted.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Disputed Claims &amp; Allegations ({analysisResult.claimsAndAllegations?.length || 0})
                      </div>
                      {analysisResult.claimsAndAllegations?.length > 0 ? (
                        <div className="flex-col gap-2">
                          {analysisResult.claimsAndAllegations.map((claim, idx) => (
                            <div key={idx} style={{ padding: '12px 14px', border: '1px solid rgba(184,150,62,0.3)', borderLeft: '3px solid var(--brass)', borderRadius: '6px', background: 'rgba(184,150,62,0.04)', fontSize: '0.857rem' }}>
                              {claim}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No disputed allegations isolated.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Chronological Timeline */}
                {activeTab === 'timeline' && (
                  <div>
                    <div className="text-label" style={{ marginBottom: '16px' }}>
                      Chronological Sequence ({analysisResult.timeline?.length || 0} dated events)
                    </div>
                    {analysisResult.timeline?.length > 0 ? (
                      <div style={{ position: 'relative', paddingLeft: '24px', marginBottom: '24px' }}>
                        <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border)' }} />
                        <div className="flex-col gap-6">
                          {analysisResult.timeline.map((item, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                              <div
                                style={{
                                  position: 'absolute',
                                  left: '-24px',
                                  top: '4px',
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: item.isConflict ? 'var(--terracotta)' : 'var(--midnight)',
                                  border: '3px solid #ffffff',
                                  boxShadow: '0 0 0 1px var(--border)',
                                }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '0.857rem', fontWeight: 600 }}>{item.date}</span>
                                  {item.sourceDoc && (
                                    <span style={{ fontSize: '0.643rem', padding: '1px 6px', borderRadius: '3px', background: 'var(--stone-bg)' }}>
                                      {item.sourceDoc}{item.pageNumber ? ` (p.${item.pageNumber})` : ''}
                                    </span>
                                  )}
                                  {item.isConflict && (
                                    <span className="status-badge status-urgent" style={{ fontSize: '0.643rem' }}>Date Conflict</span>
                                  )}
                                </div>
                                <div className="text-small" style={{ color: 'var(--text-secondary)' }}>{item.event}</div>
                                {item.conflictNote && (
                                  <div className="text-caption" style={{ color: 'var(--terracotta-text)', marginTop: '2px' }}>
                                    Conflict: {item.conflictNote}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-caption" style={{ marginBottom: '16px' }}>No dated chronological events extracted.</div>
                    )}

                    {analysisResult.dateConflicts?.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div className="text-label" style={{ marginBottom: '8px', color: 'var(--terracotta-text)' }}>Date Inconsistencies</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.857rem', color: 'var(--terracotta-text)' }}>
                          {analysisResult.dateConflicts.map((c, idx) => <li key={idx}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Issues, Risks & Questions */}
                {activeTab === 'strategy' && (
                  <div>
                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Identified Risks &amp; Legal Considerations ({analysisResult.strategyConsiderations?.length || 0})
                      </div>
                      {analysisResult.strategyConsiderations?.length > 0 ? (
                        <div className="flex-col gap-3">
                          {analysisResult.strategyConsiderations.map((s, idx) => (
                            <div key={idx} style={{ padding: '12px 16px', background: 'var(--stone-bg)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.857rem', marginBottom: '4px' }}>{s.title}</div>
                              <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>{s.detail}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No legal risks returned.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Recommended Advocate Questions ({analysisResult.advocateQuestions?.length || 0})
                      </div>
                      {analysisResult.advocateQuestions?.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.857rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                          {analysisResult.advocateQuestions.map((q, idx) => <li key={idx}>{q}</li>)}
                        </ul>
                      ) : (
                        <div className="text-caption">No client/witness questions generated.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: Action Items */}
                {activeTab === 'actions' && (
                  <div>
                    {analysisResult.immediateNextSteps?.length > 0 && (
                      <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--brass-bg)', borderRadius: '6px' }}>
                        <div className="text-label" style={{ marginBottom: '6px', color: 'var(--brass-muted)' }}>Immediate Next Steps</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.857rem' }}>
                          {analysisResult.immediateNextSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="text-label" style={{ marginBottom: '12px' }}>
                      Recommended Advocate Actions ({analysisResult.recommendedActions?.length || 0})
                    </div>
                    {analysisResult.recommendedActions?.length > 0 ? (
                      <div className="flex-col gap-3">
                        {analysisResult.recommendedActions.map((act, idx) => {
                          const isDone = !!checkedActions[idx];
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleAction(idx)}
                              style={{
                                padding: '14px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                background: isDone ? 'var(--stone-bg)' : '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                              }}
                            >
                              <div style={{ marginTop: '2px' }}>
                                {isDone ? <CheckSquare size={16} style={{ color: 'var(--sage-text)' }} /> : <Square size={16} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '0.929rem', fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none' }}>
                                    {act.title}
                                  </div>
                                  <span style={{ fontSize: '0.643rem', fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '3px', background: act.priority === 'High' ? 'var(--terracotta-bg)' : 'var(--brass-bg)', color: act.priority === 'High' ? 'var(--terracotta-text)' : 'var(--brass-muted)' }}>
                                    {act.priority}
                                  </span>
                                </div>
                                <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{act.explanation}</div>
                                {act.missingEvidence && (
                                  <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                                    Addresses gap: {act.missingEvidence}
                                  </div>
                                )}
                                {act.advocateVerificationNeeded && (
                                  <div className="text-caption" style={{ color: 'var(--brass-muted)' }}>
                                    Verify: {act.advocateVerificationNeeded}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-caption">No recommended actions returned.</div>
                    )}
                  </div>
                )}

                {/* TAB 6: Review, Missing Info & Source References */}
                {activeTab === 'review' && (
                  <div>
                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={14} style={{ color: 'var(--terracotta)' }} /> Missing Evidentiary Documents ({analysisResult.missingInformation?.length || 0})
                      </div>
                      {analysisResult.missingInformation?.length > 0 ? (
                        <div className="flex-col gap-2">
                          {analysisResult.missingInformation.map((item, idx) => (
                            <div key={idx} style={{ padding: '10px 14px', background: 'rgba(196, 105, 74, 0.05)', border: '1px solid rgba(196, 105, 74, 0.2)', borderRadius: '6px', fontSize: '0.857rem', color: 'var(--terracotta-text)' }}>
                              {item.item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No missing documents flagged.</div>
                      )}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Verification Flags ({analysisResult.reviewFlags?.length || 0})
                      </div>
                      {analysisResult.reviewFlags?.length > 0 ? (
                        <div className="flex-col gap-2">
                          {analysisResult.reviewFlags.map((rf, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '6px', gap: '12px' }}>
                              <div>
                                <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>{rf.issueType}</div>
                                <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>{rf.description}</div>
                                {rf.recommendation && (
                                  <div className="text-caption" style={{ color: 'var(--brass-muted)', marginTop: '2px' }}>
                                    Recommendation: {rf.recommendation}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '0.643rem', fontWeight: 600, padding: '2px 8px', borderRadius: '3px', background: rf.severity === 'Warning' ? 'var(--terracotta-bg)' : 'var(--brass-bg)', color: rf.severity === 'Warning' ? 'var(--terracotta-text)' : 'var(--brass-muted)' }}>
                                {rf.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-caption">No verification issues flagged.</div>
                      )}
                    </div>

                    {analysisResult.confidence && (
                      <div style={{ padding: '16px', background: 'rgba(107, 143, 113, 0.08)', border: '1px solid rgba(107, 143, 113, 0.25)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.929rem', color: 'var(--sage-text)' }}>
                            Source Grounding Confidence: {Math.round((analysisResult.confidence.score ?? 0) * 100)}%
                            {analysisResult.confidence.reviewPassed !== null && (
                              <span> ({analysisResult.confidence.reviewPassed ? 'Verified' : 'Needs Review'})</span>
                            )}
                          </div>
                          {analysisResult.confidence.groundingSummary && (
                            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {analysisResult.confidence.groundingSummary}
                            </div>
                          )}
                        </div>
                        <ShieldCheck size={28} style={{ color: 'var(--sage-text)', flexShrink: 0 }} />
                      </div>
                    )}

                    <div>
                      <div className="text-label" style={{ marginBottom: '8px' }}>
                        Source Documents Reviewed ({analysisResult.sourceReferences?.length || 0})
                      </div>
                      {analysisResult.sourceReferences?.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.786rem', color: 'var(--text-secondary)' }}>
                          {analysisResult.sourceReferences.map((ref, idx) => (
                            <li key={idx}><span style={{ fontFamily: 'monospace' }}>{ref}</span></li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-caption">No source document references recorded.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
