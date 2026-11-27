"""
Central LLM service for Counsel AI Engine.
Initializes and provides reusable access to Google Gemini models via LangChain.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings

def get_gemini_llm(temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    """
    Initializes and returns a ChatGoogleGenerativeAI instance.
    
    Args:
        temperature: Controls randomness (0.0 = deterministic and factual for legal tasks).
    
    Returns:
        ChatGoogleGenerativeAI configured with current settings.
    """
    settings.validate_api_key()
    
    return ChatGoogleGenerativeAI(
        model=settings.model_name,
        api_key=settings.api_key,
        temperature=temperature
    )
