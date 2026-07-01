# UI Spec - Advanced Classical CV BBox Pipeline

This file supersedes the early product sketch. Current implementation scope is intentionally narrow:

- Advanced Classical CV.
- OpenCV BBox Pipeline.
- Candidate bounding boxes.
- No trained model.
- Recognition disabled.
- Dataset not required for this phase.

## Pages

- Login/Register: mock local auth only.
- Dashboard: backend status, current mode, local run count, recent local history.
- ImageProcess: upload image, choose preset, tune parameters, run backend pipeline, inspect artifacts.
- History: localStorage run summaries only.
- AdminLog: static system status for the current bbox phase.
- ModelManager: future training notes, disabled train action.

## ImageProcess Screen

Required first-screen signals:

- `OpenCV Advanced BBox Pipeline`
- `Advanced Classical CV`
- `Recognition: Disabled`
- `Model: Not trained`
- `Dataset: Not required`
- `Output: Candidate boxes only`

Main controls:

- Upload JPG/PNG, max 10MB.
- Presets: Clean Document, Light Noise, Heavy Noise, Very Heavy Noise, Table Lines, Thin Text, Bold/Sticky Text, Edge/Gabor Experimental, Multi-Branch Max Recall.
- Parameter panel sections: size/contrast, illumination, denoising, sharpen/edge, Gabor, threshold, morphology, line removal, bbox extraction, merge/split/fusion.
- Primary action: `Run Advanced BBox Pipeline`.

Result areas:

- Statistics cards.
- Output image with candidate boxes.
- Pipeline image tabs.
- Candidate bbox table.
- Crop preview modal.
- CSV export.
- Deterministic system feedback.
- Links for `output.png` and `output.txt`.

## Backend Response Used By UI

```json
{
  "mode": "opencv_advanced_bbox",
  "model_trained": false,
  "recognition_enabled": false,
  "statistics": {
    "candidate_boxes": 0,
    "removed_noise_components": 0,
    "possible_connected_characters": 0,
    "branch_count": 1
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
      "height": 24,
      "area": 210,
      "aspect_ratio": 0.75,
      "fill_ratio": 0.48,
      "status": "candidate",
      "source_branch": "adaptive",
      "crop_url": "/api/crops/RUN-ID/1.png",
      "label": "?"
    }
  ],
  "pipeline_images": {
    "original_url": "/api/images/original/RUN-ID",
    "binary_url": "/api/images/binary/RUN-ID",
    "output_url": "/api/images/output/RUN-ID"
  },
  "output_image_url": "/api/images/output/RUN-ID",
  "output_txt_url": "/api/output-txt/RUN-ID",
  "system_comment": "Advanced Classical CV pipeline completed."
}
```

## Visual Rules

- Keep wording honest: candidate boxes only.
- Never imply character identity.
- Show missing pipeline stages as disabled or not generated.
- Keep local history clearly labeled as browser-local storage.
- Keep future training controls disabled until a later phase.
