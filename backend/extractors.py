from pathlib import Path

import fitz  # PyMuPDF
import docx


def extract_text_from_pdf(path: Path) -> str:
    with fitz.open(path) as doc:
        texts = []
        for page in doc:
            texts.append(page.get_text())
    return "\n".join(texts)


def extract_text_from_docx(path: Path) -> str:
    document = docx.Document(str(path))
    return "\n".join(p.text for p in document.paragraphs)


def extract_text_from_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def detect_and_extract(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix in {".docx", ".doc"}:
        return extract_text_from_docx(path)
    if suffix == ".txt":
        return extract_text_from_txt(path)
    raise ValueError(f"Unsupported file type: {suffix}")