'use client';

import React, { useState } from 'react';
import ResumeUpload from '../components/ResumeUpload';
import JobInput from '../components/JobInput';
import Results from '../components/Results';

const HomePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>('ollama');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [updatedResumePreview, setUpdatedResumePreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [processedResponse, setProcessedResponse] = useState<string>('');
  const [showChangedResume, setShowChangedResume] = useState<boolean>(false);

  // This is the reusable AI prompt that the user can copy and paste
  const defaultPrompt =
    'You are an expert resume writer. Given the job description and my current resume, ' +
    'analyze the alignment and suggest specific, high‑impact edits to my experience, achievements, and skills. ' +
    'Return the response in clearly separated bullet points for Experience, Skills, and Summary.';

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile || !jobDescription.trim()) {
      // For now, just block generation if we are missing input.
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Wire this up to the real backend once it's available.
      // For now, just stub some example preview content.
      setUpdatedResumePreview(
        'This is a preview of your updated resume content.\n\n' +
          'Changes that should be adjusted based on the job description can be highlighted in yellow ' +
          '(for example, when you implement real DOCX generation and diffing on the backend).'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    // TODO: Implement real DOCX download using the backend.
    // Keeping this as a placeholder so the UI is wired up.
    alert('DOCX download will be implemented once the backend is ready.');
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(defaultPrompt);
    } catch {
      // Swallow clipboard errors; in a real app we might show a toast.
    }
  };

  const handleProcessResponse = () => {
    // Placeholder processing: for now, just copy the AI response.
    // Later this can be replaced with real structured processing.
    setProcessedResponse(aiResponse);
  };

  return (
    <main
      style={{
        display: 'flex',
        height: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        gap: '16px',
        backgroundColor: '#f3f4f6',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Left section: 20% - upload + model selection */}
      <section
        style={{
          flexBasis: '20%',
          maxWidth: '20%',
          minWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <ResumeUpload
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          model={model}
          onModelChange={setModel}
        />
      </section>

      {/* Middle section: 3 horizontal areas (20/40/40) */}
      <section
        style={{
          flexBasis: '40%',
          maxWidth: '40%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Top 20%: AI Prompt + Job Description editor */}
        <div
          style={{
            flexBasis: '20%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  marginBottom: '4px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                AI Prompt
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                Use this prompt with your AI model. You can adjust it as needed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyPrompt}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#111827',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>

          <textarea
            value={defaultPrompt}
            readOnly
            style={{
              width: '100%',
              minHeight: '70px',
              resize: 'vertical',
              padding: '8px 10px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              outline: 'none',
              lineHeight: 1.4,
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              marginBottom: '12px',
            }}
          />

          {/* Job description editor is placed below the prompt */}
          <JobInput
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onGenerateClick={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Middle 40%: text editor to paste the AI response */}
        <div
          style={{
            flexBasis: '40%',
            minHeight: 0,
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            overflow: 'auto',
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: '8px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            AI Response
          </h2>
          <textarea
            value={aiResponse}
            onChange={(event) => setAiResponse(event.target.value)}
            placeholder="Paste the AI response here..."
            style={{
              width: '100%',
              height: '100%',
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
        </div>

        {/* Bottom 40%: processed AI response / suggested changes */}
        <div
          style={{
            flexBasis: '40%',
            minHeight: 0,
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            overflow: 'auto',
          }}
        >
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
              Suggested Changes (Processed)
            </h2>
            <button
              type="button"
              onClick={handleProcessResponse}
              disabled={!aiResponse.trim()}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                backgroundColor: aiResponse.trim() ? '#16a34a' : '#9ca3af',
                color: '#ffffff',
                cursor: aiResponse.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Process
            </button>
          </div>
          <textarea
            value={processedResponse}
            onChange={(event) => setProcessedResponse(event.target.value)}
            placeholder="This editor will show the suggested changes text based on the AI response."
            style={{
              width: '100%',
              height: '100%',
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
        </div>
      </section>

      {/* Right section: 40% - updated DOCX preview + download + changed resume toggle */}
      <section
        style={{
          flexBasis: '40%',
          maxWidth: '40%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
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
            onClick={() => setShowChangedResume(true)}
            disabled={!updatedResumePreview}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '999px',
              border: '1px solid #e5e7eb',
              backgroundColor: updatedResumePreview ? '#4b5563' : '#9ca3af',
              color: '#ffffff',
              cursor: updatedResumePreview ? 'pointer' : 'not-allowed',
              marginRight: '8px',
            }}
          >
            Changed Resume
          </button>
          <button
            type="button"
            onClick={handleDownload}
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
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {showChangedResume && updatedResumePreview ? (
            <span>{updatedResumePreview}</span>
          ) : (
            <p style={{ margin: 0, color: '#6b7280' }}>
              Once you generate suggestions and click <strong>Changed Resume</strong>, this area will
              show a text preview of your updated resume. When you implement DOCX generation on the
              backend, you can mark changed parts in yellow and wire the download button to the
              generated file.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomePage;

