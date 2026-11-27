"""
Text chunking module for Counsel AI Engine.
Splits processed documents into manageable chunks while preserving
source file name, page numbers, and contextual overlap.
"""

from typing import List, Optional
from pydantic import BaseModel
from app.document_processing.loaders import ProcessedDocument

class DocumentChunk(BaseModel):
    """Represents a text chunk with complete source provenance."""
    chunk_id: str
    source_file: str
    page_number: Optional[int] = None
    text: str
    char_count: int

def chunk_document(
    doc: ProcessedDocument,
    chunk_size: int = 1000,
    chunk_overlap: int = 150
) -> List[DocumentChunk]:
    """
    Chunks a ProcessedDocument by page or overall text.
    Preserves page number provenance for citations.
    """
    if doc.is_empty or doc.is_scanned:
        return []
        
    chunks: List[DocumentChunk] = []
    chunk_idx = 0
    
    # Process page by page to keep page numbers strictly accurate
    for page in doc.pages:
        page_text = page.text.strip()
        if not page_text:
            continue
            
        # If page fits in one chunk
        if len(page_text) <= chunk_size:
            chunk_idx += 1
            chunks.append(DocumentChunk(
                chunk_id=f"{doc.filename}_p{page.page_number}_c{chunk_idx}",
                source_file=doc.filename,
                page_number=page.page_number,
                text=page_text,
                char_count=len(page_text)
            ))
        else:
            # Split page text with overlap
            start = 0
            while start < len(page_text):
                end = min(start + chunk_size, len(page_text))
                slice_text = page_text[start:end].strip()
                
                if slice_text:
                    chunk_idx += 1
                    chunks.append(DocumentChunk(
                        chunk_id=f"{doc.filename}_p{page.page_number}_c{chunk_idx}",
                        source_file=doc.filename,
                        page_number=page.page_number,
                        text=slice_text,
                        char_count=len(slice_text)
                    ))
                
                if end == len(page_text):
                    break
                start += (chunk_size - chunk_overlap)
                
    return chunks
