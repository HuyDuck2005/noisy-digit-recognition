# Backend - Advanced Classical CV BBox Pipeline

Current phase: OpenCV BBox Pipeline. No trained model, no dataset download, no text-recognition engine call, no external reasoning service call. Recognition is disabled and every box label is `"?"`.

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

| Field | Type | Required | Notes |
|---|---|---:|---|
| `image` | File | Yes | JPG, JPEG, or PNG, max 10MB |
| `parameters` | Text | No | JSON object |

Example parameters:

```json
{
  "resize_scale": 2.0,
  "contrast_method": "clahe",
  "denoise_method": "nlm",
  "threshold_method": "sauvola",
  "morphology_mode": "open_close",
  "gabor_enabled": true,
  "contours_enabled": true,
  "mser_enabled": true,
  "multi_branch_enabled": true,
  "min_area": 15
}
```

Returned response includes:

- `result_id`
- `mode = "opencv_advanced_bbox"`
- `model_trained = false`
- `recognition_enabled = false`
- `image_info`
- `parameters`
- `statistics`
- `boxes`
- `pipeline_images`
- `output_image_url`
- `output_txt_url`
- `system_comment`

## Pipeline

```text
upload
  -> validate image type and size
  -> decode BGR
  -> resize/upscale
  -> grayscale
  -> contrast enhancement
  -> illumination correction
  -> denoising
  -> sharpening
  -> edge and Gabor branches
  -> Otsu/adaptive/Sauvola/Niblack threshold masks
  -> morphology
  -> line removal
  -> connected components, contours, MSER
  -> filter/merge/fuse/NMS
  -> mark possible connected characters
  -> optional wide-box split
  -> reading-order sort
  -> crops, output.png, output.txt
```

## Generated Artifacts

Files are stored under:

```text
backend/storage/results/{result_id}/
```

Important files:

```text
original.png
grayscale.png
contrast.png
illumination.png
denoised.png
sharpened.png
edge_map.png
dog.png
log.png
gabor_response.png
gabor_binary.png
binary.png
binary_otsu.png
binary_adaptive.png
binary_sauvola.png
binary_niblack.png
morphology.png
line_mask.png
no_lines.png
components.png
mser_regions.png
fused_boxes.png
output.png
output.txt
crops/{index}.png
```

Image URLs:

```text
GET /api/images/{stage}/{result_id}
GET /api/crops/{result_id}/{index}.png
GET /api/output-txt/{result_id}
```

All artifact routes validate `result_id` and resolve paths inside `backend/storage/results`.

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
