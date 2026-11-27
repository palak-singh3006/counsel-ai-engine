"""
Timeline Agent for Counsel AI Engine.
Extracts confirmed dates and chronological events, flags date conflicts,
and separates undated occurrences without inventing dates.
"""

from app.services.llm_service import get_gemini_llm
from app.schemas.legal_schemas import TimelineOutput
from app.prompts.legal_prompts import timeline_prompt

def get_timeline_chain():
    """Builds the LCEL chain for Timeline Agent."""
    llm = get_gemini_llm(temperature=0.0)
    structured_llm = llm.with_structured_output(TimelineOutput)
    return timeline_prompt | structured_llm

def run_timeline_agent(case_text: str, source_doc: str = "case_file") -> TimelineOutput:
    """
    Executes Timeline Agent to construct chronological case event flow.
    
    Args:
        case_text: Raw or synthesized case text.
        source_doc: Name of primary source document.
        
    Returns:
        TimelineOutput with chronologically sorted events and conflict flags.
    """
    if not case_text or not case_text.strip():
        raise ValueError("Case text cannot be empty for Timeline Agent.")
        
    chain = get_timeline_chain()
    return chain.invoke({
        "case_text": case_text.strip(),
        "source_doc": source_doc
    })
