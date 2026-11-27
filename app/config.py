"""
Configuration module for Counsel AI Engine.
Safely loads and validates environment variables from .env.
Never logs or prints secret keys.
"""

import os
import sys
from dotenv import load_dotenv

# Load variables from .env file into os.environ
load_dotenv()

class Settings:
    def __init__(self):
        self.api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
        
        # Read configured model or default to gemini-3.5-flash-lite
        configured_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
        
        # Map deprecated/unavailable models to supported gemini-3.5-flash-lite
        if configured_model in ("", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"):
            self.model_name = "gemini-3.5-flash-lite"
        else:
            self.model_name = configured_model

    def validate_api_key(self) -> None:
        """Validates that a non-empty, non-placeholder API key is set."""
        if not self.api_key or self.api_key == "your-gemini-api-key-here":
            raise ValueError(
                "GEMINI_API_KEY is missing or set to placeholder in .env. "
                "Please configure a valid Gemini API key."
            )

# Singleton settings instance
settings = Settings()
