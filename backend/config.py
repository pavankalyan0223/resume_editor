from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "upload"
RESULT_DIR = BASE_DIR / "result"
JOB_DES_DIR = BASE_DIR / "Job_des"
CHANGES_DIR = RESULT_DIR  # All transient JSON lives in result now
PROMPT_DIR = BASE_DIR / "prompt"


def ensure_dirs() -> None:
    """
    Ensure that required directories (upload, result, Job_des) exist.
    """
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    JOB_DES_DIR.mkdir(parents=True, exist_ok=True)