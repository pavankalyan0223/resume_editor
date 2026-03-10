import json
from pathlib import Path

from config import UPLOAD_DIR, RESULT_DIR, JOB_DES_DIR, ensure_dirs
from jd_processor import process_job_description
from processor import process_resume_file


def main() -> None:
    """
    Simple batch flow:
    1) For each resume in upload/, extract text and skills using models/ and save JSON.
    2) For each job description in Job_des/, do the same.
    No comparison, no frontend integration.
    """
    ensure_dirs()

    # Process resumes
    resume_files = [
        p
        for p in UPLOAD_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in {".pdf", ".docx", ".doc", ".txt"}
    ]

    if not resume_files:
        print(f"No resumes found in {UPLOAD_DIR}")
    else:
        for path in resume_files:
            try:
                print(f"Processing resume {path.name} ...")
                result = process_resume_file(path)
                out_path = RESULT_DIR / f"{path.stem}.json"
                with out_path.open("w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                print(f"Saved resume result: {out_path}")
            except Exception as exc:
                print(f"Failed to process resume {path.name}: {exc}")

    # Process job descriptions
    jd_files = [
        p
        for p in JOB_DES_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in {".txt", ".pdf", ".docx", ".doc"}
    ]

    if not jd_files:
        print(f"No job descriptions found in {JOB_DES_DIR}")
    else:
        for path in jd_files:
            try:
                print(f"Processing job description {path.name} ...")
                result = process_job_description(path)
                out_path = RESULT_DIR / f"{path.stem}_jd.json"
                with out_path.open("w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                print(f"Saved job description result: {out_path}")
            except Exception as exc:
                print(f"Failed to process job description {path.name}: {exc}")


if __name__ == "__main__":
    main()
