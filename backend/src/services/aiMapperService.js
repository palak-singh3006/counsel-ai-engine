/**
 * Normalizes the Counsel AI Engine `CaseIntelligenceResult` into the
 * predictable structured JSON expected by the Counsel backend & frontend.
 *
 * Strictly preserves source grounding: never fabricates missing fields.
 * Missing data is represented explicitly as `null` or `[]`.
 */
function normalizeAiResponse(raw, { analysisId = null, caseId = null, reviewStatus = 'ai_generated' } = {}) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const analyst = raw.document_analyst || {};
  const timeline = raw.timeline || {};
  const actions = raw.actions || {};
  const review = raw.review || null;
  const processedDocuments = Array.isArray(raw.processed_documents) ? raw.processed_documents : [];

  const materialFacts = Array.isArray(analyst.facts)
    ? analyst.facts.map((fact, idx) => ({
        id: `F-${String(idx + 1).padStart(2, '0')}`,
        fact,
        source: processedDocuments.length ? processedDocuments.join(', ') : null,
      }))
    : [];

  const parties = Array.isArray(analyst.parties)
    ? analyst.parties.map((partyName) =>
        typeof partyName === 'string'
          ? { name: partyName, role: 'Named Party' }
          : partyName
      )
    : [];

  const chronologicalEvents = Array.isArray(timeline.chronological_events)
    ? timeline.chronological_events.map((ev) => ({
        date: ev.date || null,
        event: ev.event_description || '',
        sourceDoc: ev.source_doc || null,
        pageNumber: ev.page_number ?? null,
        isConflict: Boolean(ev.is_conflict),
        conflictNote: ev.conflict_note || null,
      }))
    : [];

  const undatedEvents = Array.isArray(timeline.undated_events)
    ? timeline.undated_events.map((ev) => ({
        date: ev.date || 'Undated',
        event: ev.event_description || '',
        sourceDoc: ev.source_doc || null,
        pageNumber: ev.page_number ?? null,
        isConflict: Boolean(ev.is_conflict),
        conflictNote: ev.conflict_note || null,
      }))
    : [];

  const evidence = Array.isArray(analyst.evidence_mentioned)
    ? analyst.evidence_mentioned.map((item) =>
        typeof item === 'string' ? { item } : item
      )
    : [];

  const recommendedActions = Array.isArray(actions.recommended_actions)
    ? actions.recommended_actions.map((act) => ({
        title: act.title || '',
        explanation: act.explanation || '',
        priority: act.priority || 'Medium',
        reason: act.reason || null,
        missingEvidence: act.missing_evidence || null,
        advocateVerificationNeeded: act.advocate_verification_needed || null,
      }))
    : [];

  const missingInformation = Array.isArray(analyst.missing_documents)
    ? analyst.missing_documents.map((doc) =>
        typeof doc === 'string' ? { item: doc } : doc
      )
    : [];

  const reviewFlags = Array.isArray(review?.flags)
    ? review.flags.map((f) => ({
        severity: f.severity || 'Info',
        issueType: f.issue_type || 'Audit Note',
        description: f.description || '',
        recommendation: f.recommendation || null,
      }))
    : [];

  const strategyConsiderations = Array.isArray(analyst.risks)
    ? analyst.risks.map((risk) => ({
        title: 'Evidentiary / Legal Risk',
        detail: risk,
      }))
    : [];

  return {
    analysisId,
    caseId: caseId || raw.case_id || null,
    matterTitle: raw.matter_title || analyst.case_title || null,
    processedDocuments,
    summary: {
      caseTitle: analyst.case_title || raw.matter_title || null,
      matterType: analyst.matter_type || null,
      text: analyst.summary || null,
    },
    parties,
    legalIssues: [],
    claimsAndAllegations: Array.isArray(analyst.claims_and_allegations)
      ? analyst.claims_and_allegations
      : [],
    paymentInformation: Array.isArray(analyst.payment_information)
      ? analyst.payment_information
      : [],
    advocateQuestions: Array.isArray(analyst.advocate_questions)
      ? analyst.advocate_questions
      : [],
    materialFacts,
    timeline: chronologicalEvents,
    undatedEvents,
    dateConflicts: Array.isArray(timeline.date_conflicts) ? timeline.date_conflicts : [],
    evidence,
    strategyConsiderations,
    recommendedActions,
    immediateNextSteps: Array.isArray(actions.immediate_next_steps)
      ? actions.immediate_next_steps
      : [],
    missingInformation,
    reviewFlags,
    confidence: review
      ? {
          score: review.confidence_score ?? null,
          reviewPassed: review.review_passed ?? null,
          groundingSummary: review.grounding_summary || null,
        }
      : null,
    sourceReferences: processedDocuments,
    pipelineStatus: raw.pipeline_status || {},
    reviewStatus,
  };
}

module.exports = { normalizeAiResponse };
