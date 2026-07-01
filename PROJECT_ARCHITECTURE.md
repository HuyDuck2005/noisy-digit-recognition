# Advanced Classical CV BBox Pipeline Architecture

Current phase: Advanced Classical Image Processing Pipeline for Character/Digit Bounding Box Detection.

This repository does not train a model, download datasets, call a text-recognition engine, call external reasoning services, or identify characters in this phase. The output is candidate bounding boxes, crops, debug stage images, and a TSV/JSON result contract. Labels are always `"?"` because recognition is disabled.

## Repository Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- routers/
|   |   |   |-- health.py
|   |   |   |-- process.py
|   |   |   |-- images.py
|   |   |   `-- datasets.py
|   |   |-- schemas/
|   |   |   `-- process.py
|   |   `-- services/
|   |       |-- advanced_image_processing_service.py
|   |       |-- image_processing_service.py
|   |       `-- mock_process_service.py
|   |-- scripts/
|   |   `-- check_datasets.py
|   |-- requirements.txt
|   `-- README_BACKEND.md
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- services/
|   |   `-- api.js
|   |-- context/
|   |   `-- AuthContext.jsx
|   |-- layouts/
|   |-- pages/
|   |   |-- Auth/Login.jsx
|   |   |-- Register.jsx
|   |   |-- Dashboard.jsx
|   |   |-- ImageProcess.jsx
|   |   |-- History.jsx
|   |   |-- AdminLog.jsx
|   |   `-- ModelManager.jsx
|   `-- components/
|       |-- Upload/DragDropZone.jsx
|       |-- Process/ParameterPanel.jsx
|       |-- Result/ImageTabs.jsx
|       |-- Result/BoundingBoxTable.jsx
|       `-- Result/PipelineFeedback.jsx
|-- docs/
|   `-- DATASETS.md
|-- package.json
|-- vite.config.js
`-- tailwind.config.js
```

## Backend Files

- `backend/app/main.py`: creates the FastAPI app, enables CORS for Vite at `localhost:5173` and `127.0.0.1:5173`, and includes health, image, process, and dataset routers.
- `backend/app/routers/health.py`: exposes `GET /api/health` for backend availability checks.
- `backend/app/routers/process.py`: handles `POST /api/process` multipart uploads and `GET /api/output-txt/{result_id}`. It validates image type, image size, JSON parameters, and path traversal for generated TSV files.
- `backend/app/routers/images.py`: serves generated stage images through `GET /api/images/{stage}/{result_id}` and crop images through `GET /api/crops/{result_id}/{index}.png`.
- `backend/app/routers/datasets.py`: reports that the current phase is bbox-only and that datasets are not required.
- `backend/app/schemas/process.py`: defines the bbox-only response contract: `ImageInfo`, `ProcessStatistics`, `BoundingBoxResult`, `PipelineImages`, and `ProcessResult`.
- `backend/app/services/advanced_image_processing_service.py`: core OpenCV pipeline. It decodes input, runs preprocessing branches, extracts candidate boxes, saves crops, writes output images/text, and builds the API response.
- `backend/app/services/image_processing_service.py`: compatibility wrapper that routes old imports to the advanced service.
- `backend/app/services/mock_process_service.py`: compatibility wrapper that routes old imports to the advanced service. It does not create character IDs.
- `backend/scripts/check_datasets.py`: checks whether future dataset folders exist. It never downloads data.
- `backend/requirements.txt`: FastAPI, Uvicorn, python-multipart, OpenCV, NumPy, Pydantic, and scikit-image.

## Frontend Files

- `src/main.jsx`: React entry point.
- `src/App.jsx`: route tree, private routes, public routes, and Administrator-only route guard.
- `src/context/AuthContext.jsx`: mock local auth with localStorage persistence. Admin role is selected by email containing `admin`.
- `src/services/api.js`: central API client with `healthCheck`, `getDatasetStatus`, and `uploadAndProcessImage`. Uploads are sent to the real backend; there is no mock fallback.
- `src/pages/ImageProcess.jsx`: main workspace. It owns upload state, presets, current parameters, loading state, backend result state, output rendering, and local history writes.
- `src/components/Upload/DragDropZone.jsx`: image file selection and drag/drop UI.
- `src/components/Process/ParameterPanel.jsx`: controlled advanced parameter editor for size, contrast, illumination, denoising, edge/Gabor, thresholding, morphology, line removal, bbox extraction, merge/split, and fusion.
- `src/components/Result/ImageTabs.jsx`: visualizes generated pipeline stages. Missing stages are shown as not generated for the current parameter set.
- `src/components/Result/BoundingBoxTable.jsx`: bbox table with crop previews, sorting, status filtering, and CSV export.
- `src/components/Result/PipelineFeedback.jsx`: renders deterministic system feedback from image statistics and parameter settings.
- `src/pages/Dashboard.jsx`: backend status, current phase badges, local run count, and recent run summary.
- `src/pages/History.jsx`: browser-local run history only. No database exists yet.
- `src/pages/ModelManager.jsx`: future training page. Training is disabled in the current phase.
- `src/pages/AdminLog.jsx`: admin-only status view for the bbox phase.

## Backend Request Flow

```text
browser
  -> POST /api/process multipart/form-data
  -> process.py validates file type, size, and parameters JSON
  -> create_process_result()
  -> validate_image_upload()
  -> validate_parameters()
  -> decode_uploaded_image()
  -> run_advanced_pipeline()
  -> save artifacts under backend/storage/results/{result_id}/
  -> return ProcessResult JSON
```

## Image Processing Pipeline

```text
Input image
  -> decode BGR with OpenCV
  -> optional resize or upscale
  -> grayscale
  -> contrast enhancement
  -> illumination correction
  -> denoising
  -> sharpening
  -> edge maps and stroke branches
  -> threshold branches
  -> morphology
  -> horizontal/vertical line removal
  -> connected components, contours, and optional MSER
  -> geometry and fill-ratio filtering
  -> close-box merge
  -> optional multi-branch fusion
  -> non-maximum suppression
  -> possible connected-character marking
  -> optional wide-box split heuristic
  -> reading-order sort
  -> crop saving
  -> output image with boxes
  -> output.txt TSV
  -> ProcessResult JSON
```

## Image Processing Techniques

- Resize and upscale: `resize_scale` can enlarge blurry small text. `max_width` limits memory and compute cost for very large images.
- Grayscale: converts BGR to a single luminance channel for thresholding and morphology.
- Contrast enhancement: `hist_equalization` and `clahe` help low-contrast strokes stand out against uneven backgrounds.
- Illumination correction: background division and background subtraction estimate slow-changing background intensity, useful for shadows, dirty paper, and non-uniform lighting.
- Denoising: median helps salt-and-pepper specks, Gaussian smooths soft noise, bilateral preserves edges better, NLM is slower but useful for heavy noise.
- Sharpening: unsharp masking and Laplacian boost can recover weak strokes, but can also amplify specks.
- Edge maps: Sobel, Scharr, Laplacian, LoG, DoG, and Canny create alternative stroke/edge evidence for difficult images.
- Gabor bank: multiple angles and frequencies highlight line-like strokes across orientations.
- Thresholding: Otsu, manual, adaptive, Sauvola, and Niblack convert grayscale or branch responses into foreground masks.
- Morphology: opening removes tiny noise, closing reconnects broken strokes, dilation thickens strokes, erosion separates sticky strokes.
- Line removal: morphological horizontal and vertical kernels isolate table/grid lines, then subtract them from the foreground mask.
- Region proposals: connected components are the default, contours can recover boundary-based candidates, and MSER can find stable text-like regions on complex backgrounds.
- Filtering: area, width, height, aspect ratio, relative image size, and fill ratio remove obvious noise while keeping uncertain candidate boxes.
- Merge and fusion: close-box merge reconnects fragmented characters; multi-branch fusion combines boxes from threshold, edge, Gabor, contour, and MSER branches.
- NMS: removes duplicate overlapping boxes after fusion.
- Reading order: boxes are grouped into lines by vertical center and sorted left-to-right inside each line.

## Output Contract

`POST /api/process` returns:

```json
{
  "result_id": "RUN-...",
  "status": "success",
  "mode": "opencv_advanced_bbox",
  "model_trained": false,
  "recognition_enabled": false,
  "filename": "sample.png",
  "processing_time_ms": 120,
  "statistics": {
    "candidate_boxes": 12,
    "removed_noise_components": 34,
    "possible_connected_characters": 2,
    "merged_boxes": 1,
    "foreground_ratio": 0.08,
    "branch_count": 4
  },
  "boxes": [
    {
      "index": 1,
      "global_order": 1,
      "line_index": 1,
      "order_in_line": 1,
      "x": 10,
      "y": 20,
      "width": 18,
      "height": 26,
      "area": 240,
      "aspect_ratio": 0.69,
      "fill_ratio": 0.51,
      "status": "candidate",
      "source_branch": "adaptive",
      "crop_url": "/api/crops/RUN-.../1.png",
      "label": "?"
    }
  ],
  "pipeline_images": {
    "original_url": "...",
    "grayscale_url": "...",
    "binary_url": "...",
    "output_url": "..."
  },
  "output_image_url": "...",
  "output_txt_url": "...",
  "system_comment": "Advanced Classical CV pipeline completed..."
}
```

## Generated Artifacts

Files are stored under:

```text
backend/storage/results/{result_id}/
|-- original.png
|-- grayscale.png
|-- contrast.png
|-- illumination.png
|-- denoised.png
|-- sharpened.png
|-- edge_map.png
|-- dog.png
|-- log.png
|-- gabor_response.png
|-- gabor_binary.png
|-- binary.png
|-- binary_otsu.png
|-- binary_adaptive.png
|-- binary_sauvola.png
|-- binary_niblack.png
|-- morphology.png
|-- line_mask.png
|-- no_lines.png
|-- components.png
|-- mser_regions.png
|-- fused_boxes.png
|-- output.png
|-- output.txt
`-- crops/
    |-- 1.png
    `-- ...
```

## Presets

- Clean Document: low-noise document, Otsu threshold, light morphology.
- Light Noise: adaptive threshold, median denoising, opening.
- Heavy Noise: NLM denoising, adaptive threshold, open/close morphology.
- Very Heavy Noise: upscale, CLAHE, NLM, Sauvola, multi-branch.
- Table Lines: adaptive threshold with line removal enabled.
- Thin Text: bilateral denoising, closing, dilation.
- Bold/Sticky Text: opening, erosion, optional wide-box split.
- Edge/Gabor Experimental: DoG edge branch, Gabor branch, components and contours.
- Multi-Branch Max Recall: upscale, NLM, Gabor, contours, MSER, fusion.

## Run

Backend:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```

## No Recognition in This Phase

The current phase is preprocessing plus candidate bounding box extraction only. It is intentionally model-free: no training, no dataset download, no deep learning, no text-recognition engine, and no external reasoning service. Future work can add a trainable detection or recognition module behind the same API after the bbox baseline is stable.
