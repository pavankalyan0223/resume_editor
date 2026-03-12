import json
from pathlib import Path
from typing import Any, Dict, List
import os

from fastapi import Body, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from config import CHANGES_DIR, UPLOAD_DIR, RESULT_DIR, PROMPT_DIR, ensure_dirs
from processor import process_resume_file
from apply_changes import apply_changes_in_memory


app = FastAPI(title="Resume Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _cleanup_result_on_startup() -> None:
    """
    On backend reload, clear all temporary result files (JSON and DOCX).
    Uploaded resumes in UPLOAD_DIR are preserved.
    """
    if RESULT_DIR.exists():
        for path in RESULT_DIR.glob("*"):
            if path.is_file():
                try:
                    path.unlink()
                except OSError:
                    # Best-effort cleanup; ignore files we can't delete.
                    continue


def _build_base_payload(resume_path: Path) -> Dict[str, Any]:
    """
    Build the base JSON payload that contains:
    - file_name
    - resume_lines
    """
    resume_result = process_resume_file(resume_path)
    resume_lines: List[Dict[str, Any]] = resume_result.get("lines", [])

    payload: Dict[str, Any] = {
        "file_name": resume_path.name,
        "resume_lines": resume_lines,
    }
    return payload


@app.post("/api/upload_resume")
async def upload_resume(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    1) Save the uploaded resume into the upload folder.
    2) Generate resume_lines JSON and save it as changes/<resume_stem>.json
       (e.g. MyResume.json) for inspection.
    3) Return a plain-text preview built from resume_lines. changes.json is
       NOT created at this stage.
    """
    ensure_dirs()

    filename = file.filename or "resume.docx"
    dest_path = UPLOAD_DIR / filename

    contents = await file.read()
    dest_path.write_bytes(contents)

    base_payload = _build_base_payload(dest_path)

    # Build preview text from resume_lines (no JSON is persisted)
    lines = base_payload.get("resume_lines", [])
    preview_lines = [str(item.get("line_text", "")) for item in lines]
    preview_text = "\n".join(preview_lines)

    return {
        "file_name": filename,
        "resume_preview": preview_text,
    }


def _filter_resume_by_sections(
    resume_lines: List[Dict[str, Any]],
    all_section_names: List[str],
    selected_section_names: List[str],
) -> List[Dict[str, Any]]:
    """
    Given flat resume_lines and:
    - all_section_names: every possible section heading label from the UI
    - selected_section_names: the subset the user checked

    return only the lines that fall under the selected sections.

    Simple heuristic:
    - Treat a line as a section heading if its text starts with any section
      name (case-insensitive, optional trailing ':' allowed).
    - For each heading, take all lines from that heading up to (but not
      including) the next heading.
    - Keep segments only for the selected section names.
    """
    if not resume_lines or not all_section_names or not selected_section_names:
        return resume_lines

    lowered_all = [s.strip().lower() for s in all_section_names if s.strip()]
    lowered_sel = {s.strip().lower() for s in selected_section_names if s.strip()}
    if not lowered_all or not lowered_sel:
        return resume_lines

    # Find heading positions
    headings: List[Dict[str, Any]] = []
    for item in resume_lines:
        text = str(item.get("line_text", "")).strip().lower()
        for name in lowered_all:
            # Accept exact start or with trailing colon
            if text.startswith(name) or text.startswith(name + ":"):
                headings.append(
                    {
                        "line_number": int(item.get("line_number", 0)),
                        "name": name,
                    }
                )
                break

    if not headings:
        # No headings detected; fall back to full resume.
        return resume_lines

    headings.sort(key=lambda h: h["line_number"])

    # Build line_number -> item map for quick lookup
    by_ln = {int(item.get("line_number", 0)): item for item in resume_lines}
    max_ln = max(by_ln) if by_ln else 0

    selected: List[Dict[str, Any]] = []
    for idx, heading in enumerate(headings):
        start_ln = heading["line_number"]
        end_ln = headings[idx + 1]["line_number"] - 1 if idx + 1 < len(headings) else max_ln
        # Always use all headings as boundaries, but only keep segments
        # whose heading name was actually selected.
        if heading["name"] not in lowered_sel:
            continue
        for ln in range(start_ln, end_ln + 1):
            item = by_ln.get(ln)
            if item is not None:
                selected.append(item)

    return selected or resume_lines


@app.post("/api/job_skills")
def job_skills(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    When the user clicks Generate:

    1) Read existing changes/changes.json (must exist from /api/upload_resume).
    2) Read the static prompt text from upload/prompt.txt (if it exists).
    3) Build a single JSON payload that contains:
       - system_prompt: text from upload/prompt.txt
       - job_description: text provided by the user
       - resume: full JSON from changes/changes.json
    4) Return this combined JSON as a pretty-printed string under `prompt`.

    No AI models are called and no files are modified.
    """
    job_description = str(payload.get("job_description", "")).strip()
    if not job_description:
        raise HTTPException(status_code=400, detail="job_description is required")

    file_name = str(payload.get("file_name", "")).strip()
    if not file_name:
        raise HTTPException(status_code=400, detail="file_name is required")

    src_path = UPLOAD_DIR / file_name
    if not src_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Upload a resume first so resume_lines are available.",
        )

    resume_result = process_resume_file(src_path)
    resume_lines: List[Dict[str, Any]] = list(resume_result.get("lines", []))

    # Optional section filtering driven by the frontend.
    sections_enabled = bool(payload.get("sections_enabled"))
    # For backwards compatibility, `sections` alone means "selected only".
    raw_all = payload.get("sections_all")
    raw_sel = payload.get("sections_selected") or payload.get("sections") or []
    if sections_enabled and isinstance(raw_sel, list):
        all_names = raw_all if isinstance(raw_all, list) else raw_sel
        all_str = [str(s) for s in all_names]
        sel_str = [str(s) for s in raw_sel]
        resume_lines = _filter_resume_by_sections(resume_lines, all_str, sel_str)

    resume_json = {
        "file_name": resume_result.get("file_name"),
        "resume_lines": resume_lines,
    }

    # Read existing prompt.txt from the prompt folder but do NOT modify it.
    prompt_path = PROMPT_DIR / "prompt.txt"
    system_prompt_text = ""
    if prompt_path.exists():
        system_prompt_text = prompt_path.read_text(encoding="utf-8")

    combined_payload = {
        "system_prompt": system_prompt_text,
        "job_description": job_description,
        "resume": resume_json,
    }

    prompt_text = json.dumps(combined_payload, ensure_ascii=False, indent=2)

    # We intentionally do not touch changes.json or prompt.txt here.
    return {"prompt": prompt_text}


class ChangesUpdateBody(BaseModel):  # type: ignore[name-defined]
    changes: Dict[str, Any]


@app.get("/api/changes")
def get_changes() -> Dict[str, Any]:
    """
    Return the current contents of changes/changes.json as JSON.
    """
    changes_path = CHANGES_DIR / "changes.json"
    if not changes_path.exists():
        raise HTTPException(status_code=404, detail="changes.json not found")
    data = json.loads(changes_path.read_text(encoding="utf-8"))
    return data


@app.post("/api/changes")
def update_changes(body: ChangesUpdateBody) -> Dict[str, Any]:
    """
    Overwrite changes/changes.json with the edited JSON from the frontend
    and immediately apply it to the DOCX via apply_changes_from_json.
    """
    data = body.changes
    if "file_name" not in data or "changes" not in data:
        raise HTTPException(
            status_code=400,
            detail="changes JSON must include 'file_name' and 'changes' keys",
        )

    CHANGES_DIR.mkdir(parents=True, exist_ok=True)
    changes_path = CHANGES_DIR / "changes.json"
    changes_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Apply the changes immediately to produce <file_name>_changed.docx
    out_path = apply_changes_from_json(changes_path)

    return {
        "ok": True,
        "changed_file_name": out_path.name,
    }


class ApplyAIChangesBody(BaseModel):  # type: ignore[name-defined]
    file_name: str
    changes_json: Dict[str, Any]


class LineEditItem(BaseModel):  # type: ignore[name-defined]
    line_number: int
    text: str


class ApplyLineEditsBody(BaseModel):  # type: ignore[name-defined]
    base_file_name: str
    updated_json_file_name: str | None = None
    edits: List[LineEditItem]


@app.post("/api/apply_ai_changes")
def apply_ai_changes(body: ApplyAIChangesBody) -> Dict[str, Any]:
    """
    Apply AI-generated changes to the uploaded resume:

    - `changes_json` should follow the format described in upload/prompt.txt,
      i.e. contain a top-level "changes" list.
    - We merge these changes into the latest resume JSON from changes/changes.json
      and save as <resume_stem>_updated.json under backend/changes.
    - Then we call apply_changes_from_json to generate <resume_stem>_changed.docx
      in backend/upload.

    Returns the updated DOCX file name so the frontend can preview it.
    """
    changes_data = body.changes_json
    raw_changes = changes_data.get("changes", [])

    if not isinstance(raw_changes, list):
        raise HTTPException(
            status_code=400, detail="changes_json must contain a 'changes' list"
        )

    # Normalize actions to the format expected by apply_changes_from_json:
    # - "edit"  -> "modify"
    # - "keep"  -> dropped (no-op)
    # - "remove" and "add_new_line" are passed through
    normalized_changes: List[Dict[str, Any]] = []
    for item in raw_changes:
        if not isinstance(item, dict):
            continue
        action = str(item.get("action", "")).lower()
        if action == "keep":
            continue
        if action == "edit":
            item = dict(item)
            item["action"] = "modify"
        normalized_changes.append(item)

    file_name = body.file_name.strip()
    if not file_name:
        raise HTTPException(status_code=400, detail="file_name is required")

    src_path = UPLOAD_DIR / file_name
    if not src_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Upload a resume first so resume_lines are available.",
        )

    # Apply changes directly to the DOCX in memory
    doc_bytes = apply_changes_in_memory(src_path, normalized_changes)

    # Build the updated resume JSON (resume_lines after applying changes),
    # and persist ONLY this JSON into the result folder.
    resume_result = process_resume_file(src_path)
    base_lines = list(resume_result.get("lines", []))

    # Apply modifications to the JSON representation
    # 1) edits / modifies
    for change in normalized_changes:
        if change.get("action") != "modify":
            continue
        ln = change.get("line_number")
        new_text = change.get("new_text", "")
        if not isinstance(ln, int):
            continue
        for item in base_lines:
            if item.get("line_number") == ln:
                item["line_text"] = new_text
                break

    # 2) removes
    remove_numbers = {
        c.get("line_number")
        for c in normalized_changes
        if c.get("action") == "remove" and isinstance(c.get("line_number"), int)
    }
    base_lines = [item for item in base_lines if item.get("line_number") not in remove_numbers]

    # 3) add_new_line
    add_changes = [
        c for c in normalized_changes if c.get("action") == "add_new_line"
    ]
    for change in sorted(
        add_changes,
        key=lambda c: c.get(
            "after_line_number",
            c.get("after_line", c.get("line_number", 0)),
        ),
        reverse=True,
    ):
        after_ln = change.get(
            "after_line_number",
            change.get("after_line", change.get("line_number")),
        )
        new_text = change.get("new_text", "")
        if not isinstance(after_ln, int):
            continue
        # Find index with matching line_number
        idx = next(
            (i for i, item in enumerate(base_lines) if item.get("line_number") == after_ln),
            None,
        )
        new_entry = {
            "line_number": after_ln + 0.5,  # temporary, will be renumbered
            "line_text": new_text,
        }
        if idx is not None:
            base_lines.insert(idx + 1, new_entry)
        else:
            base_lines.append(new_entry)

    # Renumber line_number sequentially
    base_lines.sort(key=lambda item: item.get("line_number", 0))
    for i, item in enumerate(base_lines, start=1):
        item["line_number"] = i

    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    resume_stem = Path(file_name).stem
    updated_json_path = RESULT_DIR / f"{resume_stem}_updated.json"
    updated_json = {
        "file_name": file_name,
        "resume_lines": base_lines,
    }
    updated_json_path.write_text(
        json.dumps(updated_json, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    download_name = f"{resume_stem}_changed{Path(file_name).suffix}"

    # Persist the updated DOCX into the result folder so it can be previewed.
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    changed_path = RESULT_DIR / download_name
    with changed_path.open("wb") as f:
        f.write(doc_bytes)

    # Frontend will toggle preview between original and this updated file.
    return {
        "ok": True,
        "changed_file_name": download_name,
        "updated_json_file_name": updated_json_path.name,
        "changed_lines": [
            {
                "line_number": int(c.get("line_number")),
                "text": str(c.get("new_text", "")),
            }
            for c in normalized_changes
            if c.get("action") == "modify" and isinstance(c.get("line_number"), int)
        ],
    }


@app.post("/api/apply_line_edits")
def apply_line_edits(body: ApplyLineEditsBody) -> Dict[str, Any]:
    """
    Apply simple line-by-line edits (modify actions only) to an existing DOCX,
    then persist the updated DOCX (same filename) under result/ so the frontend
    preview reloads.

    This is used by the "text editor" UI after the AI change-set is applied.
    """
    base_file_name = body.base_file_name.strip()
    if not base_file_name:
        raise HTTPException(status_code=400, detail="base_file_name is required")

    base_path = RESULT_DIR / base_file_name
    if not base_path.exists():
        base_path = UPLOAD_DIR / base_file_name
        if not base_path.exists():
            raise HTTPException(status_code=404, detail="Base file not found")

    # Convert edits to the same "modify" format used elsewhere.
    normalized_changes: List[Dict[str, Any]] = [
        {"action": "modify", "line_number": e.line_number, "new_text": e.text}
        for e in body.edits
    ]

    doc_bytes = apply_changes_in_memory(base_path, normalized_changes)

    # Persist the updated DOCX into the result folder for preview/download.
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = RESULT_DIR / base_file_name
    with out_path.open("wb") as f:
        f.write(doc_bytes)

    # Best-effort update of the JSON representation if provided.
    updated_json_file_name = (body.updated_json_file_name or "").strip()
    if updated_json_file_name:
        json_path = RESULT_DIR / updated_json_file_name
        if json_path.exists():
            try:
                data = json.loads(json_path.read_text(encoding="utf-8"))
                lines = list(data.get("resume_lines", []))
                by_ln = {int(item.get("line_number")): item for item in lines if isinstance(item, dict)}
                for e in body.edits:
                    if e.line_number in by_ln:
                        by_ln[e.line_number]["line_text"] = e.text
                data["resume_lines"] = lines
                json_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
                )
            except Exception:
                # Don't block DOCX updates if JSON can't be updated.
                pass

    return {
        "ok": True,
        "changed_file_name": base_file_name,
        "updated_json_file_name": updated_json_file_name or None,
        "changed_lines": [{"line_number": e.line_number, "text": e.text} for e in body.edits],
    }


@app.get("/api/download/{filename}")
def download_changed_docx(filename: str):
    """
    Serve the updated DOCX file from the result directory (preferred) or
    fall back to the upload directory if needed.
    """
    path = RESULT_DIR / filename
    if not path.exists():
        path = UPLOAD_DIR / filename
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=path.name,
    )


@app.get("/api/upload/{filename}")
def get_uploaded_file(filename: str):
    """
    Serve files for preview:
    - First look in the result directory (for changed DOCX outputs)
    - Then fall back to the upload directory (original uploads).
    """
    path = RESULT_DIR / filename
    if not path.exists():
        path = UPLOAD_DIR / filename
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        media_type = "application/pdf"
    elif suffix == ".docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        media_type = "application/octet-stream"

    return FileResponse(path, media_type=media_type, filename=path.name)


@app.get("/api/prompt")
def get_prompt() -> Dict[str, Any]:
    """
    Return the contents of prompt/prompt.txt as plain text.
    """
    prompt_path = PROMPT_DIR / "prompt.txt"
    if not prompt_path.exists():
        raise HTTPException(status_code=404, detail="prompt.txt not found")

    text = prompt_path.read_text(encoding="utf-8")
    return {"prompt": text}

