"""
Action Agent for Counsel AI Engine.
Generates concrete, prioritized preparation recommendations for the advocate
based on evidentiary gaps and case risks.
"""

from typing import List
from app.services.llm_service import get_gemini_llm
from app.schemas.legal_schemas import ActionAgentOutput
from app.prompts.legal_prompts import action_agent_prompt

def get_action_chain():
    """Builds the LCEL chain for Action Agent."""
    llm = get_gemini_llm(temperature=0.0)
    structured_llm = llm.with_structured_output(ActionAgentOutput)
    return action_agent_prompt | structured_llm

def run_action_agent(
    summary: str,
    facts: List[str],
    missing_documents: List[str],
    risks: List[str]
) -> ActionAgentOutput:
    """
    Executes Action Agent to produce advocate next steps.
    """
    chain = get_action_chain()
    return chain.invoke({
        "summary": summary,
        "facts": "\n".join(f"- {f}" for f in facts) if facts else "No specific facts extracted.",
        "missing_documents": ", ".join(missing_documents) if missing_documents else "None identified.",
        "risks": ", ".join(risks) if risks else "None identified."
    })
