# Dataset Plan

The current MVP does not need any dataset to run.

Current phase:

- OpenCV Base Pipeline.
- No model training.
- No deep learning recognizer.
- Deterministic mock recognizer only.
- No dataset downloaded.

Future datasets:

- SynthText: future character-level bounding-box pretraining.
- VinText: future Vietnamese scene text fine-tuning.
- Chars74K: future Latin digit/letter classifier baseline.
- TextOCR: future real-world scene text robustness.
- NOD: future noisy OCR robustness.

Suggested local folder layout:

```text
datasets/
  synthtext/
  vintext/
  chars74k/
  textocr/
  nod_subset/
  synthetic_vietnamese/
```

Do not commit datasets or trained model artifacts to git. Keep large archives and model files local or in external storage.

Useful check command:

```powershell
python backend/scripts/check_datasets.py
```
