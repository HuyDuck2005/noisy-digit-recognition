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

Optional local environment file:

```powershell
Copy-Item .env.example .env
```

Keep `.env` local only. Commit `.env.example` as the shared template.

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

## Mock Image Processing

The first backend demo endpoint accepts an uploaded image and returns a mock
`ProcessResult` shaped for the frontend/spec.

```text
POST http://127.0.0.1:8000/api/process
```

Form fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `image` | File | Yes | JPG, JPEG, or PNG. `file` is also accepted as an alias. |
| `parameters` | Text | No | JSON object with pipeline parameters. |

You can test it from FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

Or with PowerShell:

```powershell
$params = '{"threshold_mode":"otsu","min_area":50}'
curl.exe -X POST "http://127.0.0.1:8000/api/process" `
  -F "image=@C:\path\to\sample.png" `
  -F "parameters=$params"
```
