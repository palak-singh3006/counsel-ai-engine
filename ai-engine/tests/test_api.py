"""
Unit tests for FastAPI endpoints in app/main.py.
Runs offline using FastAPI TestClient without external network.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestCounselAPI(unittest.TestCase):
    
    def setUp(self):
        self.client = TestClient(app)
        
    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "Counsel AI Engine")
        self.assertIn("model", data)
        
    def test_empty_text_analysis_returns_400(self):
        response = self.client.post("/analyze/text", json={"case_text": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("cannot be empty", response.json()["detail"])
        
    def test_unsupported_file_upload_returns_400(self):
        files = [
            ("files", ("unsupported.exe", b"MZbinarycontent", "application/octet-stream"))
        ]
        response = self.client.post("/analyze", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("unsupported format", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()
