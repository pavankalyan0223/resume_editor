import { useState } from 'react';

function JobInput({
  jobDescription,
  onJobDescriptionChange,
  onGenerateClick,
  isGenerating,
  requiredSkills,
}) {
  const [sections, setSections] = useState(
    [
      
      'Work Experience',
      'Technologies',
      'Projects',
      'Education',
    ].map((label, idx) => ({ id: idx + 1, label, checked: true }))
  );
  const [showSections, setShowSections] = useState(false);

  const handleChange = (event) => {
    onJobDescriptionChange(event.target.value);
  };

  const handleGenerate = () => {
    const selected = sections.filter((s) => s.checked).map((s) => s.label);
    const allLabels = sections.map((s) => s.label);
    onGenerateClick({
      sections_enabled: showSections && selected.length > 0,
      sections_all: allLabels,
      sections_selected: selected,
    });
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-2 d-flex justify-content-between align-items-center gap-2">
        <div>
          <h2 className="h6 mb-1">Select sections</h2>
          <p className="mb-0 small text-muted">
            Choose which sections you want to focus your changes on. Include all sections and check the ones you want.
          </p>
        </div>
        <div className="form-check form-switch d-flex align-items-center gap-1">
          <input
            className="form-check-input"
            type="checkbox"
            id="sections-toggle"
            checked={showSections}
            onChange={() => setShowSections((prev) => !prev)}
          />
          <label className="form-check-label small" htmlFor="sections-toggle">
            {showSections ? 'Yes' : 'No'}
          </label>
        </div>
      </div>

      {showSections && (
        <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="d-flex align-items-center gap-1"
            >
              <input
                type="checkbox"
                className="form-check-input me-1"
                checked={section.checked}
                onChange={() =>
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === section.id ? { ...s, checked: !s.checked } : s
                    )
                  )
                }
              />
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: 'auto', minWidth: 140, maxWidth: 220 }}
                value={section.label}
                onChange={(event) => {
                  const value = event.target.value;
                  setSections((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], label: value };
                    return next;
                  });
                }}
              />
              <button
                type="button"
                className="btn btn-link btn-sm text-danger p-0"
                onClick={() =>
                  setSections((prev) => prev.filter((s) => s.id !== section.id))
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() =>
              setSections((prev) => [
                ...prev,
                { id: Date.now(), label: '' },
              ])
            }
          >
            + Add
          </button>
        </div>
      )}

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
          style={{ resize: 'vertical', overflowY: 'auto', minHeight: 80 }}
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

