"""
Deprecated module.

The project no longer performs any model-based processing of job
descriptions. All AI/ML model usage has been removed from the backend.

If you need to process job descriptions, do it externally with your own
model and call this API only for file handling and JSON assembly.
"""

raise RuntimeError(
    "jd_processor.py is deprecated. The backend no longer runs AI models."
)