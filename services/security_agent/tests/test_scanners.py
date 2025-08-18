import unittest
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.vulnerability_scanner import VulnerabilityScanner
from app.sast_analyzer import SASTAnalyzer

class TestSecurityScanners(unittest.TestCase):

    def setUp(self):
        """Set up instances of the scanners for testing."""
        self.vuln_scanner = VulnerabilityScanner()
        self.sast_analyzer = SASTAnalyzer()

    def test_vuln_scanner_finds_secret(self):
        """Test that the vulnerability scanner finds a hardcoded password."""
        bad_code = 'config = {"password": "my-super-secret-password"}'
        vulnerabilities = self.vuln_scanner.scan_for_hardcoded_secrets(bad_code, "config.py")
        self.assertEqual(len(vulnerabilities), 1)
        self.assertEqual(vulnerabilities[0]["type"], "hardcoded_secret")
        self.assertIn("my-su", vulnerabilities[0]["description"])

    def test_vuln_scanner_no_secret(self):
        """Test that the vulnerability scanner does not flag clean code."""
        clean_code = 'message = "This is a secure password-protected system."'
        vulnerabilities = self.vuln_scanner.scan_for_hardcoded_secrets(clean_code, "app.py")
        self.assertEqual(len(vulnerabilities), 0)

    def test_sast_analyzer_finds_eval(self):
        """Test that the SAST analyzer finds the use of eval()."""
        bad_code = "user_input = '1+1'\nresult = eval(user_input)"
        issues = self.sast_analyzer.analyze_source_code(bad_code, "main.py")
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["type"], "sast_issue")
        self.assertIn("Use of 'eval'", issues[0]["description"])

    def test_sast_analyzer_finds_exec(self):
        """Test that the SAST analyzer finds the use of exec()."""
        bad_code = "exec('print(\"hello\")')"
        issues = self.sast_analyzer.analyze_source_code(bad_code, "main.py")
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["type"], "sast_issue")
        self.assertIn("Use of 'exec'", issues[0]["description"])

    def test_sast_analyzer_clean_code(self):
        """Test that the SAST analyzer does not flag clean code."""
        clean_code = "def add(a, b):\n    return a + b"
        issues = self.sast_analyzer.analyze_source_code(clean_code, "math.py")
        self.assertEqual(len(issues), 0)


if __name__ == '__main__':
    unittest.main()
