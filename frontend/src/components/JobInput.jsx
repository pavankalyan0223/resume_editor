function JobInput({
  jobDescription,
  onJobDescriptionChange,
  onGenerateClick,
  isGenerating,
  requiredSkills,
}) {
  const handleChange = (event) => {
    onJobDescriptionChange(event.target.value);
  };

  const handleGenerate = () => {
    onGenerateClick();
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-2">
        <h2 className="h6 mb-1">Job Description</h2>
        <p className="mb-0 small text-muted">
          Paste the full job description. The model will align your resume experience and skills to
          this role.
        </p>
      </div>

      {requiredSkills && requiredSkills.length > 0 && (
        <div className="mb-2">
          <div className="small mb-1 fw-semibold">Job Required Skills</div>
          <div className="d-flex flex-wrap gap-1">
            {requiredSkills.map((skill) => (
              <span key={skill} className="badge text-bg-light border">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="d-flex flex-column flex-grow-1">
        <textarea
          value={jobDescription}
          onChange={handleChange}
          placeholder="Paste the job description here..."
          className="form-control form-control-sm flex-grow-1 mb-2"
          style={{ resize: 'none' }}
        />

        <div className="d-flex justify-content-between align-items-center">
          <div className="small text-muted">
            {requiredSkills && requiredSkills.length > 0
              ? `${requiredSkills.length} skills extracted from this job description.`
              : null}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription.trim()}
            className="btn btn-success btn-sm"
          >
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobInput;

