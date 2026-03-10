"""
Deprecated module.

The project no longer uses any embedding or ML-based models for skill
extraction. Skill extraction is now done with a simple heuristic directly
inside the /api/job_skills endpoint (see backend/api.py).

This file is intentionally left as a stub so that any stale imports fail
fast during development if they are reintroduced.
"""

raise RuntimeError(
    "skill_extractor_model.py is deprecated. "
    "Do not import or use embedding models in this project."
)

