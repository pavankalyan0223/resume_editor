import React from 'react';

type JobInputProps = {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onGenerateClick: () => void;
  isGenerating?: boolean;
};

const JobInput: React.FC<JobInputProps> = ({
  jobDescription,
  onJobDescriptionChange,
  onGenerateClick,
  isGenerating = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onJobDescriptionChange(event.target.value);
  };

  const handleGenerate = () => {
    onGenerateClick();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '8px' }}>
        <h2
          style={{
            margin: 0,
            marginBottom: '4px',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Job Description
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
          Paste the full job description. The model will align your resume experience and skills to
          this role.
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <textarea
          value={jobDescription}
          onChange={handleChange}
          placeholder="Paste the job description here..."
          style={{
            flex: 1,
            resize: 'none',
            padding: '8px 10px',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            outline: 'none',
            lineHeight: 1.4,
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription.trim()}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '999px',
              border: 'none',
              color: '#ffffff',
              backgroundColor:
                isGenerating || !jobDescription.trim() ? '#9ca3af' : '#16a34a',
              cursor:
                isGenerating || !jobDescription.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobInput;

