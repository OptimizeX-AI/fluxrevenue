import unittest
import sys
import os
import shutil

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.build_manager import BuildManager

class TestBuildManager(unittest.TestCase):

    def setUp(self):
        """Set up a test directory and file."""
        self.build_manager = BuildManager()
        self.source_dir = "test_source"
        self.output_dir = "test_output"
        os.makedirs(self.source_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        with open(os.path.join(self.source_dir, "app.py"), "w") as f:
            f.write("print('hello world')")

    def tearDown(self):
        """Clean up test directories."""
        shutil.rmtree(self.source_dir)
        shutil.rmtree(self.output_dir)
        # Clean up any created zip files
        if os.path.exists(f"{self.output_dir}/{self.source_dir}.zip"):
            os.remove(f"{self.output_dir}/{self.source_dir}.zip")

    def test_python_builder(self):
        """Test that the Python builder successfully creates a zip artifact."""
        # Act
        result = self.build_manager.build_project(
            source_path=self.source_dir,
            language="python",
            output_path=self.output_dir
        )

        # Assert
        self.assertEqual(result["status"], "success")
        artifact_path = result.get("artifact_path")
        self.assertIsNotNone(artifact_path)
        self.assertTrue(os.path.exists(artifact_path))
        self.assertTrue(artifact_path.endswith(".zip"))


if __name__ == '__main__':
    unittest.main()
