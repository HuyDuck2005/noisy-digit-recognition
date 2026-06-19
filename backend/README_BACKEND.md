# Noisy Digit Recognition Backend

Backend scaffold built with FastAPI.

## Requirements

- Python 3.10+

## Setup

From the repository root:

```powershell
cd backend
$env:PYTHONUTF8 = "1"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Run

From the `backend/` folder:

```powershell
uvicorn app.main:app --reload --port 8000
```

If Windows reports a launcher error because the project path contains accented
characters, run uvicorn through Python instead:

```powershell
$env:PYTHONUTF8 = "1"
python -m uvicorn app.main:app --reload --port 8000
```

Health check:

```text
GET http://127.0.0.1:8000/api/health
```

Expected response:

```json
{"status":"ok"}
```
