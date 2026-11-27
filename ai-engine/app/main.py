"""
FastAPI Service for Counsel AI Engine.
Exposes REST endpoints for integration with the main backend:
- GET /health
- POST /analyze
"""

import os
import shutil
import tempfile
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.orchestrator import CounselOrchestrator
from app.schemas.legal_schemas import CaseIntelligenceResult

app = FastAPI(
    title="Counsel AI Engine API",
    description="Intelligent legal case analysis and multi-agent workflow service.",
    version="1.0.0"
)

# Enable CORS for local development and backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextAnalysisRequest(BaseModel):
    case_text: str
    case_id: Optional[str] = None
    matter_title: Optional[str] = None

@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify AI service status."""
    return {
        "status": "healthy",
        "service": "Counsel AI Engine",
        "model": settings.model_name,
        "engine_version": "1.0.0"
    }

@app.post("/analyze/text", response_model=CaseIntelligenceResult, tags=["Analysis"])
def analyze_raw_text(request: TextAnalysisRequest):
    """
    Analyzes raw text narrative of a legal case.
    Useful when the backend passes aggregated text or case notes directly.
    """
    if not request.case_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'case_text' cannot be empty."
        )
    try:
        orchestrator = CounselOrchestrator()
        result = orchestrator.analyze_case(
            case_input=request.case_text,
            case_id=request.case_id,
            matter_title=request.matter_title
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}"
        )

@app.post("/analyze", response_model=CaseIntelligenceResult, tags=["Analysis"])
async def analyze_documents(
    files: List[UploadFile] = File(...),
    case_id: Optional[str] = Form(None),
    matter_title: Optional[str] = Form(None)
):
    """
    Upload one or more case files (.pdf, .docx, .txt) for full multi-agent analysis.
    Safely stores temporary files and ensures cleanup.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file must be uploaded for analysis."
        )

    # Allowed extensions
    allowed_exts = {".pdf", ".docx", ".txt"}
    temp_dir = tempfile.mkdtemp(prefix="counsel_upload_")
    saved_file_paths: List[str] = []

    try:
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in allowed_exts:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{file.filename}' has unsupported format '{ext}'. Allowed: .pdf, .docx, .txt"
                )
            
            dest_path = os.path.join(temp_dir, file.filename)
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_file_paths.append(dest_path)

        orchestrator = CounselOrchestrator()
        result = orchestrator.analyze_case(
            case_input=saved_file_paths,
            case_id=case_id,
            matter_title=matter_title
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}"
        )
    finally:
        # Guarantee safe temporary cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
