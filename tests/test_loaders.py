"""
Offline unit tests for Document Loaders and Chunking.
Runs without network or API calls.
"""

import os
import tempfile
import unittest
from app.document_processing.loaders import (
    load_document, 
    load_text_file, 
    ProcessedDocument
)
from app.document_processing.chunking import chunk_document

class TestDocumentLoaders(unittest.TestCase):
    
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        
    def tearDown(self):
        self.temp_dir.cleanup()
        
    def test_load_text_file(self):
        txt_path = os.path.join(self.temp_dir.name, "sample_contract.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("Agreement between Party A and Party B dated 10 October 2026.\nPayment terms: 30 days.")
            
        doc = load_document(txt_path)
        self.assertEqual(doc.file_type, "txt")
        self.assertFalse(doc.is_empty)
        self.assertFalse(doc.is_scanned)
        self.assertEqual(doc.total_pages, 1)
        self.assertIn("Party A and Party B", doc.raw_text)
        
    def test_empty_text_file(self):
        empty_path = os.path.join(self.temp_dir.name, "empty.txt")
        with open(empty_path, "w", encoding="utf-8") as f:
            f.write("   \n  \t  ")
            
        doc = load_document(empty_path)
        self.assertTrue(doc.is_empty)
        self.assertEqual(doc.warning, "Document is empty.")
        
    def test_unsupported_file_format(self):
        bad_path = os.path.join(self.temp_dir.name, "image.png")
        with open(bad_path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            
        with self.assertRaises(ValueError) as ctx:
            load_document(bad_path)
        self.assertIn("Unsupported file format '.png'", str(ctx.exception))

    def test_chunking_preserves_metadata(self):
        txt_path = os.path.join(self.temp_dir.name, "long_text.txt")
        # Write text longer than chunk_size (e.g. 500 chars with chunk_size=200)
        sample_text = "Legal clause A. " * 30
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(sample_text)
            
        doc = load_document(txt_path)
        chunks = chunk_document(doc, chunk_size=200, chunk_overlap=50)
        self.assertGreater(len(chunks), 1)
        for c in chunks:
            self.assertEqual(c.source_file, "long_text.txt")
            self.assertEqual(c.page_number, 1)
            self.assertGreater(c.char_count, 0)

if __name__ == "__main__":
    unittest.main()
