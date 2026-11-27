"""
Pydantic schemas for Counsel AI Engine.
Defines strongly-typed data structures for the Document Analyst, Timeline Agent,
Action Agent, Reviewer Agent, and Orchestrator.
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field

# Existing schema from Milestone 4 for backward compatibility
class CaseAnalysis(BaseModel):
    case_type: str = Field(..., description="General category or nature of legal matter.")
    parties: List[str] = Field(default_factory=list, description="Parties explicitly named.")
    summary: str = Field(..., description="Concise factual summary.")
    key_facts: List[str] = Field(default_factory=list, description="Material facts.")
    missing_information: List[str] = Field(default_factory=list, description="Missing items.")
    risk_flags: List[str] = Field(default_factory=list, description="Risk flags.")

# --- PRIORITY 2: DOCUMENT ANALYST SCHEMA ---
class DocumentAnalystOutput(BaseModel):
    case_title: str = Field(..., description="A short, descriptive legal matter title.")
    matter_type: str = Field(..., description="Category, e.g. Commercial Contract Dispute, Debt Recovery, etc.")
    parties: List[str] = Field(default_factory=list, description="Entities/parties explicitly named.")
    summary: str = Field(..., description="Objective, factual case summary grounded strictly in provided documents.")
    facts: List[str] = Field(default_factory=list, description="Explicit factual statements verified in the text.")
    claims_and_allegations: List[str] = Field(default_factory=list, description="Claims made by one party that are disputed or unproven.")
    evidence_mentioned: List[str] = Field(default_factory=list, description="Evidence, documents, or records referenced in the text.")
    payment_information: List[str] = Field(default_factory=list, description="Specific figures, currency amounts, invoices, or payment terms.")
    missing_documents: List[str] = Field(default_factory=list, description="Critical documents, receipts, or contracts noted as absent.")
    risks: List[str] = Field(default_factory=list, description="Vulnerabilities, lack of proof, or legal risks.")
    advocate_questions: List[str] = Field(default_factory=list, description="Specific questions the advocate should ask the client or opposing party.")

# --- PRIORITY 3: TIMELINE AGENT SCHEMA ---
class TimelineEvent(BaseModel):
    date: str = Field(..., description="Normalized date (e.g. YYYY-MM-DD) or approximate text date as stated.")
    event_description: str = Field(..., description="Objective description of the event.")
    source_doc: str = Field(..., description="Filename where event is mentioned.")
    page_number: Optional[int] = Field(None, description="Page number if available.")
    is_conflict: bool = Field(False, description="True if this date conflicts with another statement.")
    conflict_note: Optional[str] = Field(None, description="Explanation of date ambiguity or conflict.")

class TimelineOutput(BaseModel):
    chronological_events: List[TimelineEvent] = Field(default_factory=list, description="Chronologically sorted confirmed events.")
    undated_events: List[TimelineEvent] = Field(default_factory=list, description="Events with no identifiable date.")
    date_conflicts: List[str] = Field(default_factory=list, description="Summary of any date inconsistencies found.")

# --- PRIORITY 4: ACTION AGENT SCHEMA ---
class RecommendedAction(BaseModel):
    title: str = Field(..., description="Short imperative action title (e.g. 'Obtain Signed Delivery Proof').")
    explanation: str = Field(..., description="Detailed description of what needs to be gathered or verified.")
    priority: str = Field(..., description="'High', 'Medium', or 'Low'.")
    reason: str = Field(..., description="Legal/evidentiary rationale based on case weaknesses.")
    missing_evidence: str = Field(..., description="Specific piece of evidence this action seeks to cure.")
    advocate_verification_needed: str = Field(..., description="What the advocate must personally confirm.")

class ActionAgentOutput(BaseModel):
    recommended_actions: List[RecommendedAction] = Field(default_factory=list, description="List of concrete next steps for advocate.")
    immediate_next_steps: List[str] = Field(default_factory=list, description="Top 1-3 urgent items to address first.")

# --- PRIORITY 6: REVIEWER AGENT SCHEMA ---
class ReviewerFlag(BaseModel):
    severity: str = Field(..., description="'Warning', 'Caution', or 'Info'.")
    issue_type: str = Field(..., description="Category: 'Missing Source', 'Allegation vs Fact', 'Evidentiary Gap', etc.")
    description: str = Field(..., description="Clear explanation of the concern.")
    recommendation: str = Field(..., description="What the advocate should do to address it.")

class ReviewerOutput(BaseModel):
    review_passed: bool = Field(..., description="Whether the core analysis is grounded and legally safe.")
    confidence_score: float = Field(..., description="Confidence rating between 0.0 and 1.0.")
    flags: List[ReviewerFlag] = Field(default_factory=list, description="Audit flags and guardrails.")
    grounding_summary: str = Field(..., description="Brief assessment of source document grounding.")

# --- PRIORITY 5: FINAL COMBINED INTELLIGENCE SCHEMA ---
class CaseIntelligenceResult(BaseModel):
    case_id: str = Field(..., description="Unique case identifier.")
    matter_title: str = Field(..., description="Title of the legal matter.")
    processed_documents: List[str] = Field(default_factory=list, description="Filenames of all documents analyzed.")
    document_analyst: DocumentAnalystOutput
    timeline: TimelineOutput
    actions: ActionAgentOutput
    review: Optional[ReviewerOutput] = None
    pipeline_status: Dict[str, str] = Field(default_factory=dict, description="Execution status per agent.")
