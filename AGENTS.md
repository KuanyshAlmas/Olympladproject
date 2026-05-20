# Codex Agent Instructions

## Project

This repository is a Django + React/Vite CRM for Olymplad.

Backend:
- Django project root: `manage.py`
- API routes: `config/api_urls.py`
- Main apps: `core`, `tasks`, `events`, `codeforces`, `gamification`

Frontend:
- Vite app: `frontend`
- Main routes: `frontend/src/App.tsx`

## Default Checks

Run these before finishing meaningful code changes:

```bash
venv/bin/python manage.py check
cd frontend && npm run lint
cd frontend && npm run build
```

Useful credentials:

```text
admin / adminpass
leader_info / leaderpass
leader_robo / leaderpass
student_info / studentpass
student_robo / studentpass
```

Expected result:
- Report commands run.
- Report checks passed/failed.
- If files were changed, list file paths and explain the bug fixed.
