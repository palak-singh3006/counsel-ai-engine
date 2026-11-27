"""
Counsel AI Master Orchestrator.
Coordinates the end-to-end pipeline:
Document Ingestion -> Document Analyst -> Timeline Agent -> Action Agent -> Reviewer Agent
Synthesizes all outputs into a validated CaseIntelligenceResult.
"""

import uuid
from typing import List, Optional, Union
from app.document_processing.loaders import load_document, ProcessedDocument
from app.schemas.legal_schemas import (
    CaseIntelligenceResult,
    DocumentAnalystOutput,
    TimelineOutput,
    ActionAgentOutput,
    ReviewerOutput
)
from app.agents.document_analyst import run_document_analyst
from app.agents.timeline_agent import run_timeline_agent
from app.agents.action_agent import run_action_agent
from app.agents.reviewer_agent import run_reviewer_agent

class CounselOrchestrator:
    """Master workflow coordinator for Counsel Case Intelligence."""
    
    def __init__(self, use_llm_reviewer: bool = True):
        self.use_llm_reviewer = use_llm_reviewer

    def analyze_case(
        self,
        case_input: Union[str, List[str]],
        case_id: Optional[str] = None,
        matter_title: Optional[str] = None
    ) -> CaseIntelligenceResult:
        """
        Executes the full AI pipeline on either:
        1. A list of file paths (PDF, DOCX, TXT)
        2. A raw text string representing case description
        """
        c_id = case_id or f"case_{uuid.uuid4().hex[:8]}"
        pipeline_status = {}
        processed_docs: List[str] = []
        aggregated_text = ""

        # --- STAGE 1: DOCUMENT INGESTION ---
        if isinstance(case_input, list):
            for file_path in case_input:
                try:
                    doc: ProcessedDocument = load_document(file_path)
                    processed_docs.append(doc.filename)
                    if doc.warning:
                        pipeline_status[f"doc_{doc.filename}"] = f"Warning: {doc.warning}"
                    if not doc.is_empty and not doc.is_scanned:
                        aggregated_text += f"\n\n--- DOCUMENT: {doc.filename} ---\n{doc.raw_text}"
                except Exception as e:
                    pipeline_status[f"doc_err_{file_path}"] = f"Load failed: {str(e)}"
        else:
            aggregated_text = case_input.strip()
            processed_docs.append("case_narrative.txt")

        if not aggregated_text.strip():
            raise ValueError("No readable text found in the provided case documents or text input.")

        # --- STAGE 2: DOCUMENT ANALYST AGENT ---
        analyst_output: Optional[DocumentAnalystOutput] = None
        try:
            analyst_output = run_document_analyst(aggregated_text)
            pipeline_status["document_analyst"] = "success"
        except Exception as e:
            pipeline_status["document_analyst"] = f"failed: {str(e)}"
            # Fallback stub to prevent complete pipeline crash
            analyst_output = DocumentAnalystOutput(
                case_title=matter_title or "Unanalyzed Legal Matter",
                matter_type="General Legal Matter",
                summary="Automated extraction encountered an error.",
                facts=[f"Extraction error: {str(e)}"],
                missing_documents=["Original readable file"]
            )

        # --- STAGE 3: TIMELINE AGENT ---
        timeline_output: Optional[TimelineOutput] = None
        try:
            source_label = processed_docs[0] if processed_docs else "case_file"
            timeline_output = run_timeline_agent(aggregated_text, source_doc=source_label)
            pipeline_status["timeline_agent"] = "success"
        except Exception as e:
            pipeline_status["timeline_agent"] = f"failed: {str(e)}"
            timeline_output = TimelineOutput()

        # --- STAGE 4: ACTION AGENT ---
        action_output: Optional[ActionAgentOutput] = None
        try:
            action_output = run_action_agent(
                summary=analyst_output.summary,
                facts=analyst_output.facts,
                missing_documents=analyst_output.missing_documents,
                risks=analyst_output.risks
            )
            pipeline_status["action_agent"] = "success"
        except Exception as e:
            pipeline_status["action_agent"] = f"failed: {str(e)}"
            action_output = ActionAgentOutput()

        # --- STAGE 5: REVIEWER AGENT ---
        reviewer_output: Optional[ReviewerOutput] = None
        try:
            reviewer_output = run_reviewer_agent(
                source_text=aggregated_text,
                analyst=analyst_output,
                timeline=timeline_output,
                use_llm=self.use_llm_reviewer
            )
            pipeline_status["reviewer_agent"] = "success"
        except Exception as e:
            pipeline_status["reviewer_agent"] = f"failed: {str(e)}"

        # --- STAGE 6: SYNTHESIS ---
        final_title = matter_title or analyst_output.case_title or "Legal Matter Analysis"
        
        return CaseIntelligenceResult(
            case_id=c_id,
            matter_title=final_title,
            processed_documents=processed_docs,
            document_analyst=analyst_output,
            timeline=timeline_output,
            actions=action_output,
            review=reviewer_output,
            pipeline_status=pipeline_status
        )

# Module-level helper
def execute_counsel_pipeline(
    case_input: Union[str, List[str]],
    case_id: Optional[str] = None,
    matter_title: Optional[str] = None
) -> CaseIntelligenceResult:
    """Convenience function to run the full Counsel pipeline."""
    orchestrator = CounselOrchestrator()
    return orchestrator.analyze_case(case_input, case_id=case_id, matter_title=matter_title)
