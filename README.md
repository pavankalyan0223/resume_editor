## Resume Builder – Skill Match Assistant

This project parses a resume and a job description, extracts technical skills, converts them to embeddings, and compares them to show which JD skills are already covered and which are missing. A React frontend lets you upload a resume, paste a JD, and see the comparison.

### Project structure

- **backend/** – Python API and processing pipeline  
  - `upload/` – uploaded resumes (`.pdf`, `.docx`, `.doc`, `.txt`)  
  - `Job_des/` – uploaded job descriptions (`.pdf`, `.docx`, `.doc`, `.txt`)  
  - `result/` – JSON output for resumes, JDs, and comparisons  
  - `api.py` – FastAPI app (`/api/generate`, `/api/health`)  
  - `main.py` – CLI entrypoint to batch-process files (optional)  
  - `extractors.py` – file-type-specific text extraction (PDF, DOCX, TXT)  
  - `sections.py` – heading-based splitter into `skills`, `experience`, `projects`, `other`  
  - `nlp_utils.py` – spaCy + KeyBERT initialization and multi-gram keyword extraction  
  - `processor.py` – runs section-based keyword extraction and returns `extracted_skills` + `sections`  
  - `matcher.py` – uses SentenceTransformers (`all-MiniLM-L6-v2`) to compare JD vs resume skills and compute `missing_skills`  
- **frontend/** – React UI (Vite) that talks to the FastAPI backend

### Backend: architecture

1. **Keyword Extraction (KeyBERT + spaCy)**  
   - For each resume or JD:  
     - Extract text from the file.  
     - Split into sections (`skills`, `experience`, `projects`, `other`).  
     - Run `extract_keywords_multi` over each section and merge/dedupe into `extracted_skills`.

2. **Embedding Conversion (SentenceTransformers)**  
   - Encode `extracted_skills` for resume and JD using `all-MiniLM-L6-v2`.  
   - Compute cosine similarity between each JD skill and all resume skills.

3. **Comparison JSON**  
   - Any JD skill whose best similarity to the resume skill set is below a threshold (default `0.65`) is treated as **missing**.  
   - A comparison JSON is written with:
     - `experience_section`: non-empty lines from the resume’s EXPERIENCE section  
     - `skills_from_resume`: all extracted skills from the resume  
     - `missing_skills`: JD skills with no sufficiently similar resume match  

### Backend setup

1. **Prerequisites**
   - Python 3.10+ installed and on PATH

2. **Create and activate virtualenv**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # PowerShell / CMD on Windows
   .venv\Scripts\python.exe -m pip install --upgrade pip
   ```

3. **Install backend dependencies**
   ```bash
   .venv\Scripts\python.exe -m pip install pymupdf python-docx spacy keybert sentence-transformers fastapi "uvicorn[standard]" python-multipart
   .venv\Scripts\python.exe -m spacy download en_core_web_sm
   ```

### Running the backend API

From the `backend` folder:

```bash
.venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000
```

API contracts:

- `POST /api/generate`
  - Form-data:
    - `file`: resume file (`.pdf`, `.doc`, `.docx`, `.txt`)
    - `job_description`: JD text
  - Response JSON:
    - `experience_section`: `string[]`
    - `skills_from_resume`: `string[]`
    - `missing_skills`: `string[]`
- `GET /api/health` → `{ "status": "ok" }`

### Optional: batch CLI run

If you want to process all files from disk instead of via the API:

```bash
.venv\Scripts\python.exe main.py
```

This will:

- Process resumes in `upload/` → `<resume_stem>.json` in `result/`  
- Process JDs in `Job_des/` → `<jd_stem>_jd.json` in `result/`  
- For each resume–JD pair, write `<resume_stem>__vs__<jd_stem>_comparison.json` with the three lists above.

### Frontend (high level)

- Vite/React app under `frontend/`.  
- On **Generate**, it:
  - Uploads the selected resume + JD text to `POST /api/generate`.  
  - Renders:
    - Experience section lines
    - Skills extracted from the resume
    - Missing JD skills to focus on.

