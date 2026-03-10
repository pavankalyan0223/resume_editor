import { useState } from 'react';
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
  const [darkMode, setDarkMode] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [isApplyingAiChanges, setIsApplyingAiChanges] = useState(false);

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
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to upload and process resume. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:8000/api/job_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          file_name: uploadedFileName,
        }),
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

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
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
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to apply AI changes. Please check the JSON format and try again.');
    } finally {
      setIsApplyingAiChanges(false);
    }
  };

  return (
    <div
      className={`vh-100 w-100 d-flex p-3 ${
        darkMode ? 'app-root-dark text-light' : 'app-root-light text-dark'
      }`}
    >
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
                    darkMode={darkMode}
                    onToggleTheme={handleToggleTheme}
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
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={!aiResponse.trim() || isApplyingAiChanges}
                      onClick={handleApplyAiChanges}
                    >
                      {isApplyingAiChanges ? 'Applying…' : 'Apply AI Changes'}
                    </button>
                  </div>
                  <textarea
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                    placeholder="Paste the AI response here..."
                    className="form-control form-control-sm flex-grow-1"
                    style={{ resize: 'none' }}
                  />
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
