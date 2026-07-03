# Dataset Notes

The current phase does not require a dataset.

Active phase:

- Advanced Classical CV.
- OpenCV BBox Pipeline.
- Candidate bounding boxes only.
- No trained model.
- Recognition disabled.
- Dataset not required for this phase.

Future datasets can be added after the bbox baseline is stable:

- SynthText: future synthetic text detection data.
- VinText: future Vietnamese scene text data.
- Chars74K: future character and digit samples.
- TextOCR: future real-world text-image data.
- NOD: future noisy document or noisy text robustness data.

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

Do not commit datasets or model artifacts to git. Keep large archives and runtime artifacts local or in external storage.

Useful check command:

```powershell
python backend/scripts/check_datasets.py
```
