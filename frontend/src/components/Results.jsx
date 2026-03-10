import { useEffect, useMemo, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

function Results({ resumePreview, originalFileName, updatedFileName }) {
  const containerRef = useRef(null);
  const [activeView, setActiveView] = useState('original'); // 'original' | 'updated'

  const activeFileName =
    activeView === 'updated' && updatedFileName ? updatedFileName : originalFileName;

  const fileUrl = useMemo(() => {
    if (!activeFileName) return null;
    return `http://localhost:8000/api/upload/${encodeURIComponent(activeFileName)}`;
  }, [activeFileName]);

  const isPdf = activeFileName?.toLowerCase().endsWith('.pdf');
  const isDocx = activeFileName?.toLowerCase().endsWith('.docx');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isDocx || !fileUrl || !containerRef.current) return;

      containerRef.current.innerHTML = '';

      const resp = await fetch(fileUrl);
      const buf = await resp.arrayBuffer();
      if (cancelled) return;

      await renderAsync(buf, containerRef.current, null, {
        className: 'docx-preview',
        inWrapper: true,
        // Let the preview auto-fit the container width so content
        // is not cut off on the left/right.
        ignoreWidth: true,
        ignoreHeight: true,
      });
    }

    run().catch(() => {
      // If rendering fails, we fall back to text preview below.
    });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, isDocx]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="h6 mb-0">Resume Preview</h2>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!originalFileName}
            onClick={() => setActiveView('original')}
          >
            Your Resume
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!updatedFileName}
            onClick={() => setActiveView('updated')}
          >
            Updated Resume
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={!updatedFileName}
            onClick={() => {
              if (!updatedFileName) return;
              const url = `http://localhost:8000/api/download/${encodeURIComponent(
                updatedFileName,
              )}`;
              window.open(url, '_blank');
            }}
          >
            Download
          </button>
        </div>
      </div>

      <div className="border rounded p-2 bg-body-tertiary flex-grow-1 overflow-auto">
        <div className="resume-preview-page">
          <div className="resume-preview-page-inner">
            <>
              {fileUrl && isPdf && (
                <iframe
                  title="Resume PDF Preview"
                  src={fileUrl}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              )}

              {fileUrl && isDocx && <div ref={containerRef} />}

              {(!fileUrl || (!isPdf && !isDocx)) && (
                <div className="small p-3">
                  {resumePreview ? (
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {resumePreview}
                    </pre>
                  ) : (
                    <p className="mb-0 text-muted">
                      Upload a PDF or DOCX to preview it here.
                    </p>
                  )}
                </div>
              )}
            </>
          </div>
        </div>
      </div>
    </>
  );
}

export default Results;
