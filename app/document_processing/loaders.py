"""
Document loaders for Counsel AI Engine.
Supports PDF, DOCX, and TXT with page tracking, empty file checks,
and scanned PDF / OCR-required detection.
"""

import os
from typing import List, Optional
from pydantic import BaseModel, Field
import pypdf
import docx

class ProcessedPage(BaseModel):
    """Represents text extracted from a specific page."""
    page_number: int
    text: str

class ProcessedDocument(BaseModel):
    """Represents a fully ingested and validated document."""
    filename: str
    file_type: str
    pages: List[ProcessedPage] = Field(default_factory=list)
    total_pages: int = 0
    raw_text: str = ""
    is_empty: bool = False
    is_scanned: bool = False
    warning: Optional[str] = None

def load_text_file(file_path: str) -> ProcessedDocument:
    """Loads plain text (.txt) files."""
    filename = os.path.basename(file_path)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            content = f.read()
            
    is_empty = len(content.strip()) == 0
    pages = [ProcessedPage(page_number=1, text=content)] if not is_empty else []
    
    return ProcessedDocument(
        filename=filename,
        file_type="txt",
        pages=pages,
        total_pages=1 if not is_empty else 0,
        raw_text=content,
        is_empty=is_empty,
        is_scanned=False,
        warning="Document is empty." if is_empty else None
    )

def load_pdf_file(file_path: str) -> ProcessedDocument:
    """Loads PDF (.pdf) files with per-page text extraction and scanned detection."""
    filename = os.path.basename(file_path)
    pages: List[ProcessedPage] = []
    total_text = ""
    
    try:
        reader = pypdf.PdfReader(file_path)
        total_pages = len(reader.pages)
        
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            pages.append(ProcessedPage(page_number=idx + 1, text=page_text))
            total_text += f"\n[Page {idx + 1}]\n" + page_text
            
        clean_text = total_text.strip()
        is_empty = total_pages == 0 or len(clean_text) == 0
        
        # If pages exist but text is near-empty (less than 20 chars across multiple pages), it's likely a scanned image
        is_scanned = total_pages > 0 and len(clean_text) < 25
        warning = None
        if is_empty and not is_scanned:
            warning = "PDF document is empty."
        elif is_scanned:
            warning = "Scanned PDF detected with no digital text layer. OCR is required to extract contents."
            
        return ProcessedDocument(
            filename=filename,
            file_type="pdf",
            pages=pages,
            total_pages=total_pages,
            raw_text=clean_text,
            is_empty=is_empty,
            is_scanned=is_scanned,
            warning=warning
        )
    except Exception as e:
        raise ValueError(f"Failed to read PDF '{filename}': {str(e)}")

def load_docx_file(file_path: str) -> ProcessedDocument:
    """Loads Microsoft Word (.docx) files."""
    filename = os.path.basename(file_path)
    try:
        doc = docx.Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        
        # Also extract table text if present
        table_texts = []
        for table in doc.tables:
            for row in table.rows:
                row_str = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_str:
                    table_texts.append(row_str)
                    
        all_lines = paragraphs + table_texts
        full_text = "\n".join(all_lines).strip()
        is_empty = len(full_text) == 0
        
        pages = [ProcessedPage(page_number=1, text=full_text)] if not is_empty else []
        
        return ProcessedDocument(
            filename=filename,
            file_type="docx",
            pages=pages,
            total_pages=1 if not is_empty else 0,
            raw_text=full_text,
            is_empty=is_empty,
            is_scanned=False,
            warning="Word document is empty." if is_empty else None
        )
    except Exception as e:
        raise ValueError(f"Failed to read Word document '{filename}': {str(e)}")

def load_document(file_path: str) -> ProcessedDocument:
    """
    Main entry point for document loading.
    Inspects file extension and routes to appropriate loader.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".txt":
        return load_text_file(file_path)
    elif ext == ".pdf":
        return load_pdf_file(file_path)
    elif ext == ".docx":
        return load_docx_file(file_path)
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Counsel supports .pdf, .docx, and .txt files.")
