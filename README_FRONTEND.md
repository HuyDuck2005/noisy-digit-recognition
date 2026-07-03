# Frontend - Advanced Classical CV BBox Lab

Current phase: OpenCV BBox Pipeline. The frontend uploads images to the FastAPI backend, shows preprocessing stages, and renders candidate bounding boxes only. No trained model is used, recognition is disabled, and datasets are not required for this phase.

## Structure

```text
src/
|-- main.jsx
|-- App.jsx
|-- index.css
|-- services/
|   `-- api.js
|-- context/
|   `-- AuthContext.jsx
|-- layouts/
|   |-- AuthLayout.jsx
|   |-- MainLayout.jsx
|   `-- Sidebar.jsx
|-- pages/
|   |-- Auth/Login.jsx
|   |-- Register.jsx
|   |-- Dashboard.jsx
|   |-- ImageProcess.jsx
|   |-- History.jsx
|   |-- AdminLog.jsx
|   `-- ModelManager.jsx
`-- components/
    |-- Common/
    |-- Layout/
    |-- Upload/DragDropZone.jsx
    |-- Process/ParameterPanel.jsx
    `-- Result/
        |-- ImageTabs.jsx
        |-- BoundingBoxTable.jsx
        `-- PipelineFeedback.jsx
```

## Main Flow

```text
mock login
  -> ImageProcess workspace
  -> select JPG/PNG
  -> choose preset or tune parameters
  -> POST /api/process
  -> show output.png, stage tabs, stats, bbox table, crop previews
  -> save summary to localStorage history
```

## Important Files

- `src/services/api.js`: fetch wrapper, backend health check, dataset status, and real upload/process call.
- `src/pages/ImageProcess.jsx`: main workspace with presets, upload state, run state, statistics, output links, and history persistence.
- `src/components/Process/ParameterPanel.jsx`: controlled form for OpenCV and bbox parameters.
- `src/components/Result/ImageTabs.jsx`: renders generated pipeline stage images.
- `src/components/Result/BoundingBoxTable.jsx`: table for candidate boxes, crop previews, sorting, status filtering, and CSV export.
- `src/components/Result/PipelineFeedback.jsx`: renders deterministic system feedback only.
- `src/pages/Dashboard.jsx`: backend online/offline, current phase, dataset status, and recent local runs.
- `src/pages/History.jsx`: local browser history only. No database yet.
- `src/pages/ModelManager.jsx`: future training page. Training button is disabled.

## Run

```powershell
npm install
npm run dev
```

Backend default:

```text
http://127.0.0.1:8000
```

Override with:

```powershell
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
```

Build:

```powershell
npm run build
```
