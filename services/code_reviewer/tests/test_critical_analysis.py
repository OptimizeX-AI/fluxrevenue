import unittest
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.critical_analysis import CriticalAnalysis

class TestCodeReviewerCriticalAnalysis(unittest.TestCase):

    def setUp(self):
        """Set up a new CriticalAnalysis instance for each test."""
        self.analyzer = CriticalAnalysis()

    def test_valid_approved_report(self):
        """Test a valid 'APPROVED' report passes analysis."""
        # Arrange
        valid_report = [{
            "status": "APPROVED",
            "summary": "Code looks great. No issues found.",
            "details": []
        }]

        # Act
        result = self.analyzer.analyze_output(valid_report)

        # Assert
        self.assertTrue(result["is_valid"])
        self.assertEqual(result["feedback"], "Output is valid.")

    def test_valid_rejected_report(self):
        """Test a valid 'REJECTED' report passes analysis."""
        # Arrange
        valid_report = [{
            "status": "REJECTED",
            "summary": "Found several issues.",
            "details": ["Hardcoded secret found on line 10."]
        }]

        # Act
        result = self.analyzer.analyze_output(valid_report)

        # Assert
        self.assertTrue(result["is_valid"])

    def test_invalid_report_missing_status(self):
        """Test a report that is missing the 'status' field."""
        # Arrange
        invalid_report = [{
            "summary": "A report without a status."
        }]

        # Act
        result = self.analyzer.analyze_output(invalid_report)

        # Assert
        self.assertFalse(result["is_valid"])
        self.assertIn("must_have_status_field", result["feedback"])

    def test_invalid_report_bad_status(self):
        """Test a report with an invalid value for the 'status' field."""
        # Arrange
        invalid_report = [{
            "status": "MAYBE",
            "summary": "Not sure about this one."
        }]

        # Act
        result = self.analyzer.analyze_output(invalid_report)

        # Assert
        self.assertFalse(result["is_valid"])
        self.assertIn("status_must_be_valid", result["feedback"])

    def test_invalid_report_missing_summary(self):
        """Test a report that is missing the 'summary' field."""
        # Arrange
        invalid_report = [{
            "status": "APPROVED"
        }]

        # Act
        result = self.analyzer.analyze_output(invalid_report)

        # Assert
        self.assertFalse(result["is_valid"])
        self.assertIn("must_have_summary_field", result["feedback"])

    def test_invalid_rejected_report_missing_details(self):
        """Test a 'REJECTED' report that is missing the 'details' field."""
        # This rule is not currently enforced, but we can test for it.
        # Let's assume the rule is: if status is REJECTED, details must not be empty.
        # The current rule is `lambda output: "details" in output if output.get("status") == "REJECTED" else True`
        # So it just checks for presence of the key.

        # Arrange
        invalid_report = [{
            "status": "REJECTED",
            "summary": "It's just bad."
            # Missing 'details' key
        }]

        # Act
        result = self.analyzer.analyze_output(invalid_report)

        # Assert
        self.assertFalse(result["is_valid"])
        self.assertIn("rejected_must_have_details", result["feedback"])


if __name__ == '__main__':
    unittest.main()
