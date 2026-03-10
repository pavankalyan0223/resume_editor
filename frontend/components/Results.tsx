import React from 'react';

type ResultsProps = {
  updatedResumePreview: string;
  onDownloadClick: () => void;
};

const Results: React.FC<ResultsProps> = ({ updatedResumePreview, onDownloadClick }) => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Updated Resume (Preview)
        </h2>
        <button
          type="button"
          onClick={onDownloadClick}
          disabled={!updatedResumePreview}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '999px',
            border: '1px solid #e5e7eb',
            backgroundColor: updatedResumePreview ? '#2563eb' : '#9ca3af',
            color: '#ffffff',
            cursor: updatedResumePreview ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s ease',
          }}
        >
          Download DOCX
        </button>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: '4px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          overflow: 'auto',
          fontSize: '13px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {updatedResumePreview ? (
          <span>{updatedResumePreview}</span>
        ) : (
          <p style={{ margin: 0, color: '#6b7280' }}>
            Once you generate suggestions, this area will show a text preview of your updated
            resume. When you implement DOCX generation on the backend, you can mark changed parts
            in yellow and wire the download button to the generated file.
          </p>
        )}
      </div>
    </>
  );
};

export default Results;

