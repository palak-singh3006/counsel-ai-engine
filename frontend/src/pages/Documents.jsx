import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  FolderOpen
} from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { documents as initialDocuments, cases } from '../data/mockData';

const categories = [
  'All',
  'Court Filing',
  'Legal Brief',
  'Evidence',
  'Expert Report',
  'Contract',
  'Correspondence',
  'Government Order',
  'IP Filing',
  'Police Record',
  'Medical',
];

export default function Documents() {
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [docList, setDocList] = useState(initialDocuments);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCase, setSelectedCase] = useState('All');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload Form State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Court Filing');
  const [docCaseId, setDocCaseId] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Unique case list for filter
  const caseOptions = useMemo(() => {
    const list = Array.from(new Set(docList.map((d) => d.caseTitle)));
    return ['All', ...list];
  }, [docList]);

  // Filtered documents
  const filtered = useMemo(() => {
    return docList.filter((doc) => {
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) return false;
      if (selectedCase !== 'All' && doc.caseTitle !== selectedCase) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          doc.name.toLowerCase().includes(q) ||
          doc.caseTitle.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          doc.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [docList, search, selectedCategory, selectedCase]);

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setUploadedFile(file);
    if (!docName) {
      // Use file name without extension as default
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setDocName(cleanName);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!uploadedFile && !docName.trim()) {
      errors.file = 'Please select a document or enter a name';
    }
    if (!docName.trim()) {
      errors.name = 'Document title is required';
    }
    if (!docCaseId) {
      errors.caseId = 'Matter association is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const linkedCase = cases.find((c) => c.id === docCaseId);

    const newDoc = {
      id: `DOC${String(docList.length + 1).padStart(3, '0')}`,
      name: docName.trim(),
      category: docCategory,
      caseId: docCaseId,
      caseTitle: linkedCase ? linkedCase.title : 'General Repository',
      uploadDate: new Date().toISOString().split('T')[0],
      size: uploadedFile ? `${(uploadedFile.size / 1024).toFixed(0)} KB` : '420 KB',
      type: uploadedFile?.name.endsWith('.docx') ? 'DOCX' : 'PDF',
    };

    setDocList([newDoc, ...docList]);
    toast(`"${newDoc.name}" uploaded successfully`, 'success');
    closeUploadModal();
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadedFile(null);
    setDocName('');
    setDocCategory('Court Filing');
    setDocCaseId('');
    setFormErrors({});
    setDragActive(false);
  };

  const handleDelete = (id, name) => {
    setDocList((prev) => prev.filter((d) => d.id !== id));
    if (previewDoc?.id === id) setPreviewDoc(null);
    toast(`"${name}" has been removed from repository`, 'info');
  };

  const handleDownload = (name) => {
    toast(`Preparing download for "${name}" (Backend storage sync pending)`, 'info');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Legal Documents</h1>
          <p className="page-subtitle">
            {docList.length} indexed records · Evidence, pleadings, judicial orders, and transcripts
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={15} /> Upload Document
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input" style={{ width: '280px' }}>
            <Search />
            <input
              type="text"
              placeholder="Search filename, matter, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            style={{ maxWidth: '220px' }}
          >
            {caseOptions.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Matters' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Associated Matter</th>
                <th>Filing / Upload Date</th>
                <th>Format & Size</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setPreviewDoc(doc)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          background: 'var(--stone-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--brass-muted)',
                          flexShrink: 0,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</div>
                        <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                          {doc.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        padding: '3px 8px',
                        borderRadius: '3px',
                        background: 'var(--stone-bg)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {doc.category}
                    </span>
                  </td>
                  <td
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/matters', { state: { selectedCaseId: doc.caseId } });
                    }}
                    title="Click to view matter dossier"
                  >
                    <div style={{ fontSize: '0.857rem', color: 'var(--text-primary)', maxWidth: '240px' }} className="truncate">
                      {doc.caseTitle}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--brass-muted)' }}>{doc.caseId} &rarr;</div>
                  </td>
                  <td className="text-small" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(doc.uploadDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <span
                      className="text-label"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--stone)',
                      }}
                    >
                      <span
                        style={{
                          padding: '1px 4px',
                          background: 'var(--midnight-soft)',
                          color: '#fff',
                          borderRadius: '2px',
                          fontSize: '0.643rem',
                        }}
                      >
                        {doc.type}
                      </span>
                      {doc.size}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        className="btn-ghost btn-sm"
                        title="View Preview"
                        onClick={() => setPreviewDoc(doc)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        title="Download Document"
                        onClick={() => handleDownload(doc.name)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        title="Delete Document"
                        onClick={() => handleDelete(doc.id, doc.name)}
                        style={{ padding: '4px 8px', color: 'var(--terracotta)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <FolderOpen size={40} />
                      <h3>No documents match your query</h3>
                      <p>Adjust your search filters or upload a new record to this repository.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview & Details Modal */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title="Document Inspector" wide>
        {previewDoc && (
          <div>
            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.286rem', color: 'var(--text-primary)' }}>
                    {previewDoc.name}
                  </div>
                  <div className="text-caption" style={{ marginTop: '2px' }}>
                    Document Ref: {previewDoc.id} · Recorded: {previewDoc.uploadDate}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'var(--brass-bg)',
                    color: 'var(--brass-muted)',
                    fontSize: '0.786rem',
                    fontWeight: 600,
                  }}
                >
                  {previewDoc.category}
                </span>
              </div>

              {/* Document Meta Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    background: 'var(--stone-bg)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onClick={() => {
                    const targetCaseId = previewDoc.caseId;
                    setPreviewDoc(null);
                    navigate('/matters', { state: { selectedCaseId: targetCaseId } });
                  }}
                  title="Click to view matter dossier"
                >
                  <div className="text-label" style={{ marginBottom: '4px' }}>Associated Matter &rarr;</div>
                  <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--brass-muted)' }} className="truncate">
                    {previewDoc.caseTitle}
                  </div>
                  <div className="text-caption">{previewDoc.caseId} · Click to open matter</div>
                </div>

                <div style={{ padding: '12px', background: 'var(--stone-bg)', borderRadius: '6px' }}>
                  <div className="text-label" style={{ marginBottom: '4px' }}>File Specifications</div>
                  <div style={{ fontSize: '0.857rem', fontWeight: 500 }}>
                    {previewDoc.type} format ({previewDoc.size})
                  </div>
                  <div className="text-caption">Integrity checksum verified</div>
                </div>

                <div style={{ padding: '12px', background: 'var(--stone-bg)', borderRadius: '6px' }}>
                  <div className="text-label" style={{ marginBottom: '4px' }}>Access Protocol</div>
                  <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--sage-text)' }}>
                    Privileged & Confidential
                  </div>
                  <div className="text-caption">Attorney-Client Work Product</div>
                </div>
              </div>

              {/* Simulated Document Preview Canvas */}
              <div
                style={{
                  height: '280px',
                  background: '#fcfbfa',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 16,
                    fontSize: '0.714rem',
                    color: 'var(--stone)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Document Viewer Mockup — 1 of 12 pages
                </div>
                <FileText size={48} style={{ color: 'var(--stone-light)', marginBottom: '12px' }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.071rem', marginBottom: '6px' }}>
                  {previewDoc.name}
                </h4>
                <p className="text-small" style={{ maxWidth: '440px', color: 'var(--text-secondary)' }}>
                  This legal instrument is stored in encrypted vault storage. In production, inline PDF rendering with annotations, signature checks, and full-text OCR indexing will display here.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownload(previewDoc.name)}
                  >
                    <Download size={13} /> Download Original File
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--terracotta)' }}
                onClick={() => handleDelete(previewDoc.id, previewDoc.name)}
              >
                <Trash2 size={14} /> Remove Document
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={showUploadModal} onClose={closeUploadModal} title="Upload Legal Instrument">
        <form onSubmit={handleUploadSubmit}>
          <div className="modal-body">
            {/* Drag and Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--brass)' : 'var(--border)'}`,
                background: dragActive ? 'var(--brass-bg)' : 'var(--stone-bg)',
                borderRadius: '8px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '16px',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={28} style={{ color: 'var(--brass-muted)', margin: '0 auto 8px' }} />
              {uploadedFile ? (
                <div>
                  <div style={{ fontSize: '0.857rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {uploadedFile.name}
                  </div>
                  <div className="text-caption" style={{ color: 'var(--sage-text)', marginTop: '2px' }}>
                    {(uploadedFile.size / 1024).toFixed(1)} KB — Click to change file
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Drop document file here, or <span style={{ color: 'var(--brass)', textDecoration: 'underline' }}>browse</span>
                  </div>
                  <div className="text-caption" style={{ marginTop: '4px' }}>
                    Supports PDF, DOCX, TXT up to 25MB
                  </div>
                </div>
              )}
            </div>
            {formErrors.file && <div className="form-error" style={{ marginBottom: '12px' }}>{formErrors.file}</div>}

            {/* Document Title */}
            <div className="form-group">
              <label className="form-label">Document Title *</label>
              <input
                type="text"
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="e.g. Affidavit in Reply, Written Arguments"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
              {formErrors.name && <div className="form-error">{formErrors.name}</div>}
            </div>

            <div className="form-row">
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                >
                  {categories.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Matter */}
              <div className="form-group">
                <label className="form-label">Linked Matter *</label>
                <select
                  className={`form-input ${formErrors.caseId ? 'error' : ''}`}
                  value={docCaseId}
                  onChange={(e) => setDocCaseId(e.target.value)}
                >
                  <option value="">Select Matter...</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.id})
                    </option>
                  ))}
                </select>
                {formErrors.caseId && <div className="form-error">{formErrors.caseId}</div>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeUploadModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm & Index Document
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
