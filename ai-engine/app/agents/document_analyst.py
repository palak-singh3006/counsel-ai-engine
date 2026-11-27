"""
Document Analyst Agent for Counsel AI Engine.
Reads case text and extracts structured legal facts, claims, evidence,
payment information, missing documents, and advocate questions.
"""

from app.services.llm_service import get_gemini_llm
from app.schemas.legal_schemas import DocumentAnalystOutput
from app.prompts.legal_prompts import document_analyst_prompt

def get_document_analyst_chain():
    """Builds the LCEL chain for Document Analyst."""
    llm = get_gemini_llm(temperature=0.0)
    structured_llm = llm.with_structured_output(DocumentAnalystOutput)
    return document_analyst_prompt | structured_llm

def run_document_analyst(case_text: str) -> DocumentAnalystOutput:
    """
    Executes Document Analyst on raw legal text.
    
    Args:
        case_text: Aggregated text from case documents.
        
    Returns:
        DocumentAnalystOutput with structured legal facts.
    """
    if not case_text or not case_text.strip():
        raise ValueError("Case text cannot be empty for Document Analyst.")
        
    chain = get_document_analyst_chain()
    return chain.invoke({"case_text": case_text.strip()})
