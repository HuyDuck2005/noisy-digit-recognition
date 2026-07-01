# Backend - Noisy Digit Recognition

Current phase: OpenCV Base Pipeline. No dataset is downloaded. No deep learning model has been trained. Labels and confidence values are produced by a deterministic mock recognizer.

## Setup

Run from the repository root:

```powershell
cd backend
$env:PYTHONUTF8 = "1"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Run

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

## Health

```text
GET http://127.0.0.1:8000/api/health
```

Expected:

```json
{"status":"ok"}
```

## Process Image

```text
POST http://127.0.0.1:8000/api/process
```

Request type: `multipart/form-data`

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `image` | File | Yes | JPG, JPEG, or PNG, max 10MB |
| `parameters` | Text | No | JSON object |

Example parameters:

```json
{
  "threshold_mode": "otsu",
  "blur_type": "median",
  "blur_kernel": 3,
  "morphology_mode": "open_close",
  "min_area": 50,
  "padding": 2,
  "connectivity": 8,
  "invert": true
}
```

Returned response includes:

- `result_id`
- `status`
- `image_info`
- `parameters`
- `statistics`
- `boxes`
- `pipeline_images`
- `output_image_url`
- `output_txt_url`
- `model_version`
- `llm_comment`

`llm_comment` is kept for frontend compatibility, but it is system feedback. No LLM API is called.

## Generated Artifacts

Files are stored under:

```text
backend/storage/results/{result_id}/
```

Pipeline files:

```text
original.png
grayscale.png
denoised.png
binary.png
morphology.png
components.png
output.png
output.txt
crops/{index}.png
```

Image URLs:

```text
GET /api/images/original/{result_id}
GET /api/images/grayscale/{result_id}
GET /api/images/denoised/{result_id}
GET /api/images/binary/{result_id}
GET /api/images/morphology/{result_id}
GET /api/images/components/{result_id}
GET /api/images/output/{result_id}
GET /api/crops/{result_id}/{index}.png
GET /api/output-txt/{result_id}
```

## Dataset Status

```text
GET /api/datasets/status
```

This only reports status. It never downloads datasets.

## Dataset Folder Check

```powershell
python backend/scripts/check_datasets.py
```

This only checks local folders. It never downloads data.
