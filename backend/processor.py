import re
from pathlib import Path
from typing import Dict, Any, List

from extractors import detect_and_extract


def _split_resume_into_lines(text: str) -> List[Dict[str, Any]]:
    """
    Split resume text into lines per rules:
    (i)  Extra \\n after \\n = line boundary (split on \\n\\n+)
    (ii) Whole bullet points as a line
    (iii) Text ended with . and \\n = one line
    """
    # Normalize all newline variants and also turn literal "\n" into real newlines
    text = text.replace("\\n", "\n").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not text:
        return []

    # Simple rule: **every** newline becomes its own logical line
    lines_out: List[str] = [l.strip() for l in text.split("\n") if l.strip()]

    return [
        {"line_number": i + 1, "line_text": t}
        for i, t in enumerate(lines_out)
    ]


def process_resume_file(path: Path) -> Dict[str, Any]:
    """
    Process a resume file:
    1. Extract raw text from PDF/DOC/DOCX/TXT
    2. Split into lines (no embedding model - resume is NOT sent to model)
    3. Return dict with lines: [{line_number, line_text}, ...]
    """
    text = detect_and_extract(path)
    lines = _split_resume_into_lines(text)

    return {
        "file_name": path.name,
        "file_path": str(path),
        "lines": lines,
    }

