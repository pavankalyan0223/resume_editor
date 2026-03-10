import React from 'react';

type ResumeUploadProps = {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  model: string;
  onModelChange: (model: string) => void;
};

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  selectedFile,
  onFileChange,
  model,
  onModelChange,
}) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(event.target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div>
        <h1
          style={{
            margin: 0,
            marginBottom: '4px',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Resume Builder
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
          Upload your resume, paste the job description, and let the model propose tailored changes.
        </p>
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          border: '1px dashed #d1d5db',
          backgroundColor: '#f9fafb',
        }}
      >
        <label
          htmlFor="resume-upload-input"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          Upload Resume
        </label>
        <input
          id="resume-upload-input"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          style={{ fontSize: '13px' }}
        />

        <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
          {selectedFile ? (
            <span>
              Selected file:{' '}
              <span style={{ fontWeight: 500, color: '#111827' }}>{selectedFile.name}</span>
            </span>
          ) : (
            <span>No resume selected yet.</span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="model-select"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '4px',
          }}
        >
          Model
        </label>
        <select
          id="model-select"
          value={model}
          onChange={handleModelChange}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
          }}
        >
          <option value="ollama">Ollama (default)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>
    </div>
  );
};

export default ResumeUpload;

