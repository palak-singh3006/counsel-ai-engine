"""
Unit tests for legal Pydantic schemas.
Runs completely offline without making external LLM or API calls.
"""

import unittest
from pydantic import ValidationError
from app.schemas.legal_schemas import CaseAnalysis

class TestCaseAnalysisSchema(unittest.TestCase):
    
    def test_valid_case_analysis_creation(self):
        """Verify that valid data creates a proper CaseAnalysis object."""
        data = {
            "case_type": "Commercial Contract Dispute",
            "parties": ["Blue Oak Supplies", "Northstar Retail"],
            "summary": "Dispute regarding unpaid invoice of Rs. 80,000 for office equipment.",
            "key_facts": [
                "Written agreement between Blue Oak Supplies and Northstar Retail.",
                "Agreed amount is Rs. 80,000 for office equipment.",
                "Blue Oak claims delivery was completed on 10 October 2026."
            ],
            "missing_information": [
                "Signed delivery acknowledgment receipt.",
                "Copy of written contract.",
                "Itemized invoice."
            ],
            "risk_flags": [
                "Northstar claims some equipment was missing upon delivery."
            ]
        }
        
        analysis = CaseAnalysis(**data)
        
        self.assertEqual(analysis.case_type, "Commercial Contract Dispute")
        self.assertEqual(len(analysis.parties), 2)
        self.assertEqual(analysis.parties[0], "Blue Oak Supplies")
        self.assertEqual(len(analysis.key_facts), 3)
        self.assertEqual(len(analysis.missing_information), 3)
        self.assertEqual(len(analysis.risk_flags), 1)

    def test_missing_required_fields_raises_validation_error(self):
        """Verify that omitting required fields like summary raises ValidationError."""
        invalid_data = {
            "case_type": "Breach of Contract"
            # Missing required field: summary
        }
        
        with self.assertRaises(ValidationError) as context:
            CaseAnalysis(**invalid_data)
            
        self.assertIn("summary", str(context.exception))

    def test_type_coercion_and_validation(self):
        """Verify that invalid field types are caught by Pydantic."""
        invalid_data = {
            "case_type": "Debt Recovery",
            "summary": "Valid summary text.",
            "parties": "Should be a list, not an integer or invalid structure" # strings can coerce or reject invalid structures
        }
        # If passed an integer for a list, it should raise ValidationError
        with self.assertRaises(ValidationError):
            CaseAnalysis(
                case_type="Debt Recovery",
                summary="Valid summary",
                parties=12345  # Invalid type: integer instead of list
            )

    def test_defaults_for_list_fields(self):
        """Verify that list fields default to empty lists if not provided."""
        minimal_data = {
            "case_type": "Property Matter",
            "summary": "A brief summary of the property matter."
        }
        
        analysis = CaseAnalysis(**minimal_data)
        self.assertEqual(analysis.parties, [])
        self.assertEqual(analysis.key_facts, [])
        self.assertEqual(analysis.missing_information, [])
        self.assertEqual(analysis.risk_flags, [])

if __name__ == "__main__":
    unittest.main()
