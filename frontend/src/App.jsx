import { useEffect, useState } from 'react';
import './App.css';
import ResumeUpload from './components/ResumeUpload.jsx';
import JobInput from './components/JobInput.jsx';
import Results from './components/Results.jsx';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumePreview, setResumePreview] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [updatedFileName, setUpdatedFileName] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [isApplyingAiChanges, setIsApplyingAiChanges] = useState(false);
  const [changedLines, setChangedLines] = useState([]);
  const [updatedJsonFileName, setUpdatedJsonFileName] = useState(null);
  const [isSavingLineEdits, setIsSavingLineEdits] = useState(false);
  const [resumeCacheKey, setResumeCacheKey] = useState(0);
  const [activePreview, setActivePreview] = useState('original'); // 'original' | 'updated'
  const [aiViewMode, setAiViewMode] = useState('review'); // 'review' | 'paste'

  const handleFileChange = (file) => {
    setSelectedFile(file);
  };

  const handleUploadResume = async () => {
    if (!selectedFile) return;
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('http://localhost:8000/api/upload_resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      const data = await response.json();
      setResumePreview(data.resume_preview || '');
      const fileNameFromBackend = data.file_name || selectedFile?.name || null;
      setUploadedFileName(fileNameFromBackend);
      setOriginalFileName(fileNameFromBackend);
      setUpdatedFileName(null);
      setChangedLines([]);
      setUpdatedJsonFileName(null);
      setResumeCacheKey((k) => k + 1);
      setActivePreview('original');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to upload and process resume. Please try again.');
    }
  };

  const handleGenerate = async (options) => {
    if (!jobDescription.trim() || !uploadedFileName) {
      if (!uploadedFileName) {
        // eslint-disable-next-line no-alert
        alert('Please upload a resume first.');
      }
      return;
    }

    setIsGenerating(true);

    try {
      const body = {
        job_description: jobDescription,
        file_name: uploadedFileName,
      };

      if (options?.sections_enabled) {
        body.sections_enabled = true;
        if (Array.isArray(options.sections_all)) {
          body.sections_all = options.sections_all;
        }
        if (Array.isArray(options.sections_selected)) {
          body.sections_selected = options.sections_selected;
        } else if (Array.isArray(options.sections)) {
          // backward compatibility with older shape
          body.sections_selected = options.sections;
        }
      }

      const response = await fetch('http://localhost:8000/api/job_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      setPromptText(data.prompt || '');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAiChanges = async () => {
    if (!aiResponse.trim() || !uploadedFileName) return;

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      // eslint-disable-next-line no-alert
      alert('AI response must be valid JSON matching the expected format.');
      return;
    }

    setIsApplyingAiChanges(true);

    try {
      const response = await fetch('http://localhost:8000/api/apply_ai_changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: uploadedFileName, changes_json: parsed }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      const data = await response.json();
      if (data.changed_file_name) {
        setUpdatedFileName(data.changed_file_name);
      }
      if (Array.isArray(data.changed_lines)) {
        setChangedLines(
          data.changed_lines
            .filter((l) => l && Number.isInteger(l.line_number))
            .map((l) => ({ line_number: l.line_number, text: String(l.text ?? '') }))
        );
      } else {
        setChangedLines([]);
      }
      setUpdatedJsonFileName(data.updated_json_file_name || null);
      setResumeCacheKey((k) => k + 1);
      setActivePreview('updated');
      setAiViewMode('review');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to apply AI changes. Please check the JSON format and try again.');
    } finally {
      setIsApplyingAiChanges(false);
    }
  };

  const updateChangedLine = (index, value) => {
    setChangedLines((prev) => {
      const next = [...prev];
      const row = next[index];
      next[index] = { ...row, text: value };
      return next;
    });
  };

  const handleSaveLineEdits = async () => {
    if (!updatedFileName || changedLines.length === 0) return;

    setIsSavingLineEdits(true);
    try {
      const response = await fetch('http://localhost:8000/api/apply_line_edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_file_name: updatedFileName,
          updated_json_file_name: updatedJsonFileName,
          edits: changedLines.map((l) => ({ line_number: l.line_number, text: l.text })),
        }),
      });
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      const data = await response.json();
      if (data.changed_file_name) {
        setUpdatedFileName(data.changed_file_name);
      }
      if (Array.isArray(data.changed_lines)) {
        setChangedLines(
          data.changed_lines
            .filter((l) => l && Number.isInteger(l.line_number))
            .map((l) => ({ line_number: l.line_number, text: String(l.text ?? '') }))
        );
      }
      setResumeCacheKey((k) => k + 1);
      setActivePreview('updated');
    } catch {
      // eslint-disable-next-line no-alert
      alert('Failed to save line edits. Please try again.');
    } finally {
      setIsSavingLineEdits(false);
    }
  };

  useEffect(() => {
    const elements = document.querySelectorAll('.editor-input');
    elements.forEach((el) => {
      if (!(el instanceof HTMLTextAreaElement)) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [changedLines, aiViewMode]);

  return (
    <div className="vh-100 w-100 d-flex p-3 app-root-light text-dark">
      <div className="container-fluid h-100">
        <div className="row g-3 h-100">
          {/* Left section: 20% - upload + theme switch + job description below upload */}
          <div className="col-12 col-md-2 d-flex h-100">
            <div className="card shadow-sm w-100 h-100 resume-card">
              <div className="card-body d-flex flex-column h-100">
                <div className="mb-3">
                  <ResumeUpload
                    selectedFile={selectedFile}
                    onFileChange={handleFileChange}
                    onUploadClick={handleUploadResume}
                  />
                </div>

                {/* Job description editor placed directly below resume upload */}
                <div className="flex-grow-1 d-flex flex-column">
                  <JobInput
                    jobDescription={jobDescription}
                    onJobDescriptionChange={setJobDescription}
                    onGenerateClick={handleGenerate}
                    isGenerating={isGenerating}
                    requiredSkills={[]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Middle section: 2 horizontal sections (20% / 80%) without job description */}
          <div className="col-12 col-md-5 d-flex flex-column h-100">
            <div className="d-flex flex-column gap-2 h-100">
              {/* Top 20%: AI Prompt only */}
              <div
                className="card shadow-sm resume-card"
                style={{ flexBasis: '20%', minHeight: 0, flexGrow: 1 }}
              >
                <div className="card-body d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h2 className="h6 mb-1">AI Prompt</h2>
                      <p className="mb-0 small text-muted">
                        Use this prompt with your AI model. You can adjust it as needed.
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {promptCopied && (
                        <span className="small text-success">Copied</span>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={!promptText}
                        onClick={() => {
                          if (!promptText || !navigator.clipboard?.writeText) return;
                          navigator.clipboard
                            .writeText(promptText)
                            .then(() => {
                              setPromptCopied(true);
                              setTimeout(() => setPromptCopied(false), 2000);
                            })
                            .catch(() => {});
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="mb-2 flex-shrink-0">
                    <pre
                      className="mb-0 border rounded p-2 bg-body-tertiary small"
                      style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}
                    >
                      {promptText || 'Prompt will appear here once loaded from the backend.'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Middle 80%: text editor to paste the AI response + Apply AI Changes */}
              <div
                className="card shadow-sm resume-card"
                style={{ flexBasis: '80%', minHeight: 0, flexGrow: 1 }}
              >
                <div className="card-body d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h2 className="h6 mb-0">AI Response</h2>
                    <div className="d-flex align-items-center gap-2">
                      {changedLines.length > 0 && (
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto' }}
                          value={aiViewMode}
                          onChange={(e) => setAiViewMode(e.target.value)}
                        >
                          <option value="review">Review response</option>
                          <option value="paste">Paste response</option>
                        </select>
                      )}
                      {changedLines.length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={!updatedFileName || isSavingLineEdits}
                          onClick={handleSaveLineEdits}
                        >
                          {isSavingLineEdits ? 'Saving…' : 'Save edits'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={!aiResponse.trim() || isApplyingAiChanges}
                          onClick={handleApplyAiChanges}
                        >
                          {isApplyingAiChanges ? 'Applying…' : 'Apply AI Changes'}
                        </button>
                      )}
                    </div>
                  </div>

                  {changedLines.length > 0 && aiViewMode === 'review' ? (
                    <div className="editor flex-grow-1">
                      {changedLines.map((line, index) => (
                        <div key={`${line.line_number}-${index}`} className="editor-line">
                          <span className="line-number">{line.line_number}</span>
                          <textarea
                            className="editor-input"
                            rows={1}
                            value={line.text}
                            onInput={(e) => {
                              const el = e.target;
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                              updateChangedLine(index, e.target.value);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={aiResponse}
                      onChange={(e) => setAiResponse(e.target.value)}
                      placeholder="Paste the AI response here..."
                      className="form-control form-control-sm flex-grow-1"
                      style={{ resize: 'none' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right section: 40% - resume preview + changed resume button */}
          <div className="col-12 col-md-5 d-flex h-100">
            <div className="card shadow-sm w-100 h-100 resume-card">
              <div className="card-body d-flex flex-column h-100 resume-scroll">
                <Results
                  resumePreview={resumePreview}
                  originalFileName={originalFileName}
                  updatedFileName={updatedFileName}
                  cacheKey={resumeCacheKey}
                  activeView={activePreview}
                  onActiveViewChange={setActivePreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
