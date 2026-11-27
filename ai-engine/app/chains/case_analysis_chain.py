"""
Case Analysis Chain for Counsel AI Engine.
Builds and executes an LCEL pipeline:
  case_analysis_prompt | structured_llm -> CaseAnalysis
"""

from app.services.llm_service import get_gemini_llm
from app.schemas.legal_schemas import CaseAnalysis
from app.prompts.legal_prompts import case_analysis_prompt

def get_case_analysis_chain():
    """
    Constructs the LCEL chain for legal case analysis.
    
    Pipeline:
      1. case_analysis_prompt: formats {case_text} into system/human messages.
      2. structured_llm: Gemini configured with with_structured_output(CaseAnalysis).
    
    Returns:
      A runnable LCEL chain that takes {"case_text": "..."} and returns a CaseAnalysis instance.
    """
    llm = get_gemini_llm(temperature=0.0)
    structured_llm = llm.with_structured_output(CaseAnalysis)
    return case_analysis_prompt | structured_llm

def analyze_case(case_text: str) -> CaseAnalysis:
    """
    Executes case analysis on raw legal text and returns validated structured data.
    
    Args:
        case_text: The factual description or summary of the legal matter.
        
    Returns:
        A validated CaseAnalysis Pydantic instance.
        
    Raises:
        ValueError: If case_text is empty or invalid.
        RuntimeError: If LLM call or parsing fails.
    """
    if not case_text or not case_text.strip():
        raise ValueError("Case text cannot be empty.")
        
    chain = get_case_analysis_chain()
    
    try:
        result = chain.invoke({"case_text": case_text.strip()})
        return result
    except Exception as e:
        error_msg = str(e)
        raise RuntimeError(f"Case analysis failed: {error_msg}") from e
