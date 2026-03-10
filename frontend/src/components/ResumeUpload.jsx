function ResumeUpload({ selectedFile, onFileChange, darkMode, onToggleTheme, onUploadClick }) {
  const handleInputChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
  };

  return (
    <div className="d-flex flex-column gap-3 h-100">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 mb-1">Resume Builder</h1>
          <p className="mb-0 small text-muted">
            Upload your resume, paste the job description, and let the model propose tailored
            changes.
          </p>
        </div>
      </div>

      <div className="form-check form-switch d-flex align-items-center justify-content-between">
        <label className="form-check-label small me-2" htmlFor="theme-switch">
          {darkMode ? 'Dark mode' : 'Light mode'}
        </label>
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="theme-switch"
          checked={darkMode}
          onChange={onToggleTheme}
        />
      </div>

      <div className="border border-dashed rounded p-3 bg-light-subtle">
        <label className="form-label small mb-2" htmlFor="resume-upload-input">
          Upload Resume
        </label>
        <input
          id="resume-upload-input"
          type="file"
          accept=".pdf,.doc,.docx"
          className="form-control form-control-sm"
          onChange={handleInputChange}
        />

        <div className="mt-2 small text-muted">
          {selectedFile ? (
            <>
              Selected file: <span className="fw-semibold text-body">{selectedFile.name}</span>
            </>
          ) : (
            'No resume selected yet.'
          )}
        </div>
        <div className="d-flex justify-content-end mt-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onUploadClick}
            disabled={!selectedFile}
          >
            Upload & Preview
          </button>
        </div>
      </div>

    </div>
  );
}

export default ResumeUpload;

