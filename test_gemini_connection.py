"""
Counsel AI Engine - Milestone 3: First LLM Connection Test
This script verifies that:
1. The .env file can be read securely.
2. The GEMINI_API_KEY is configured.
3. LangChain's ChatGoogleGenerativeAI can communicate with Google Gemini.
4. Gemini returns a live response.
"""

import os
import sys
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

def test_connection():
    # 1. Load variables from .env file into system environment
    load_dotenv()

    api_key = os.getenv("GEMINI_API_KEY")
    # Default to gemini-3.5-flash-lite (Google AI Studio recommended model)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    if model_name in ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"):
        model_name = "gemini-3.5-flash-lite"

    # 2. Check that the key exists and isn't the placeholder
    if not api_key or api_key.strip() in ("", "your-gemini-api-key-here"):
        print("\n❌ ERROR: GEMINI_API_KEY is missing or still set to the placeholder in .env")
        print("Please edit .env and set your valid Gemini API key.")
        print("Example in .env:")
        print('  GEMINI_API_KEY="AIzaSy..."\n')
        sys.exit(1)

    print(f"\n🔑 Gemini API key found (length: {len(api_key)} characters). Never printed for security.")
    print(f"🤖 Initializing LangChain ChatGoogleGenerativeAI with model: '{model_name}'...")

    try:
        # 3. Initialize the model using LangChain
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            api_key=api_key,
        )

        # 4. Send a simple message to Gemini
        prompt = "Hello! Please confirm in one sentence that the Counsel AI Engine is successfully connected."
        print(f"📤 Sending test prompt to Gemini: \"{prompt}\"")
        
        response = llm.invoke(prompt)

        # 5. Extract clean text from response
        output_text = ""
        if isinstance(response.content, str):
            output_text = response.content
        elif isinstance(response.content, list):
            text_parts = [
                part["text"] for part in response.content 
                if isinstance(part, dict) and "text" in part
            ]
            output_text = " ".join(text_parts) if text_parts else str(response.content)
        else:
            output_text = str(response.content)

        # 6. Display the response
        print("\n✅ Success! Gemini responded:")
        print("-" * 60)
        print(output_text.strip())
        print("-" * 60)
        print("\n🎉 Milestone 3: Live LLM connection test passed successfully!\n")

    except Exception as e:
        # Redact any accidental key leakage in exception string
        error_msg = str(e)
        if api_key and api_key in error_msg:
            error_msg = error_msg.replace(api_key, "[REDACTED_KEY]")
        print(f"\n❌ Connection failed with error:\n{error_msg}\n")
        print("Tips for troubleshooting:")
        print("1. Verify your API key has Generative Language API enabled in Google AI Studio.")
        print("2. Check your internet connection.")
        print("3. Check if the model name is supported (e.g., 'gemini-3.5-flash-lite').")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
