import logging
import os
from typing import Dict, Optional, Tuple
import PyPDF2
import markdown
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class FileProcessor:
    """
    Reads and extracts text content from various file formats.
    """
    def __init__(self):
        logger.info("FileProcessor initialized.")

    def process_file(self, filepath: str) -> Optional[Tuple[str, str]]:
        """
        Processes a file, dispatching to the correct method based on extension.

        Args:
            filepath: The path to the file to process.

        Returns:
            A tuple containing (content_type, extracted_text), or None if the
            file type is not supported or an error occurs.
        """
        _, ext = os.path.splitext(filepath)
        ext = ext.lower()

        try:
            if ext == ".pdf":
                return "pdf", self._read_pdf(filepath)
            elif ext in [".md", ".markdown"]:
                return "markdown", self._read_markdown(filepath)
            elif ext in [".html", ".htm"]:
                return "html", self._read_html(filepath)
            elif ext in [".py", ".js", ".java", ".go", ".cs"]:
                return "source_code", self._read_source_code(filepath)
            else:
                logger.warning(f"Unsupported file type: {ext}")
                return None
        except Exception as e:
            logger.error(f"Failed to process file {filepath}: {e}", exc_info=True)
            return None

    def _read_pdf(self, filepath: str) -> str:
        """Extracts text from a PDF file."""
        text = ""
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()
        return text

    def _read_markdown(self, filepath: str) -> str:
        """Extracts text from a Markdown file, converting it to HTML first."""
        with open(filepath, 'r', encoding='utf-8') as f:
            md_content = f.read()
        # Convert Markdown to HTML, then strip tags to get clean text
        html = markdown.markdown(md_content)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

    def _read_html(self, filepath: str) -> str:
        """Extracts text from an HTML file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
        return soup.get_text()

    def _read_source_code(self, filepath: str) -> str:
        """Reads a source code file as plain text."""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
