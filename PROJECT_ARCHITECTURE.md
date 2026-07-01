# Noisy Digit Recognition - Current MVP Architecture

Current phase: OpenCV Base Pipeline + Full-stack Integration.

No model has been trained. No dataset is required or downloaded. Recognition labels and confidence values come from a deterministic mock recognizer, not from a trained recognizer.

## Stack

- Frontend: React 18, Vite, React Router, Tailwind/custom CSS.
- Backend: FastAPI, Pydantic, OpenCV, NumPy.
- Storage: generated artifacts under `backend/storage/results/{result_id}/`.

## Backend

Main files:

- `backend/app/main.py`: FastAPI app, CORS for Vite, includes health/images/process/datasets routers.
- `backend/app/routers/health.py`: `GET /api/health`.
- `backend/app/routers/process.py`: `POST /api/process`, `GET /api/output-txt/{result_id}`.
- `backend/app/routers/images.py`: serves pipeline images and crop images.
- `backend/app/routers/datasets.py`: reports dataset/model phase status only.
- `backend/app/schemas/process.py`: response models for image info, stats, boxes, pipeline images, debug links, and process result.
- `backend/app/services/image_processing_service.py`: real OpenCV pipeline.
- `backend/app/services/mock_process_service.py`: orchestration, parameter validation, timing, deterministic mock recognizer status wording.
- `backend/scripts/check_datasets.py`: checks whether local dataset folders exist; never downloads data.

Backend pipeline:

```text
uploaded image
  -> decode with OpenCV
  -> original.png
  -> grayscale.png
  -> denoised.png
  -> binary.png
  -> morphology.png
  -> components.png
  -> connected-component boxes
  -> crops/{index}.png
  -> output.png
  -> output.txt
  -> ProcessResult JSON
```

Supported processing controls:

- Threshold: `otsu`, `manual`, `adaptive`.
- Blur: `none`, `median`, `gaussian`, `bilateral`.
- Morphology: `none`, `opening`, `closing`, `open_close`, `close_open`.
- Connectivity: `4` or `8`.
- Filtering: min/max area, min width, min height.
- Crop padding.
- Invert threshold for dark text on light background.

Recognizer:

- Deterministic mock only.
- Uses crop hash and simple image features.
- Returns `label`, `confidence`, `top_k`, `status`.
- `status = low_confidence` when confidence is below `0.60`.
- Designed so a future ONNX/model recognizer can replace only the recognition step.

Important endpoints:

```text
GET  /api/health
GET  /api/datasets/status
POST /api/process
GET  /api/images/{stage}/{result_id}
GET  /api/crops/{result_id}/{index}.png
GET  /api/output-txt/{result_id}
```

## Frontend

Main files:

- `src/services/api.js`: central API base URL, health check, dataset status, upload/process request.
- `src/context/AuthContext.jsx`: mock auth with localStorage persistence.
- `src/App.jsx`: route guards, including admin guard.
- `src/pages/Dashboard.jsx`: backend status, dataset status, local history count, no fake model metrics.
- `src/pages/ImageProcess.jsx`: real backend upload/process flow.
- `src/pages/History.jsx`: localStorage run history only.
- `src/pages/ModelManager.jsx`: dataset/model phase status, training disabled.
- `src/pages/AdminLog.jsx`: honest admin/system status.
- `src/components/Process/ParameterPanel.jsx`: controlled OpenCV parameters.
- `src/components/Upload/DragDropZone.jsx`: image validation and selection.
- `src/components/Result/ImageTabs.jsx`: real backend pipeline images.
- `src/components/Result/BoundingBoxTable.jsx`: backend boxes, crops, top-k, CSV export.
- `src/components/Result/LLMFeedback.jsx`: system feedback card, despite legacy file name.

Frontend flow:

```text
login with mock auth
  -> /process
  -> select JPG/PNG
  -> tune OpenCV parameters
  -> POST /api/process
  -> render output image, pipeline tabs, boxes, crops, stats, feedback
  -> save summary to localStorage history
```

## Dataset State

No dataset is needed now. Future dataset notes live in `docs/DATASETS.md`.

Dataset artifacts and model files are ignored by git:

- `datasets/`
- archive formats
- `.h5`, `.mat`, `.pt`, `.pth`, `.onnx`

## Run

Backend:

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
npm run dev
```

Build check:

```powershell
npm run build
```
