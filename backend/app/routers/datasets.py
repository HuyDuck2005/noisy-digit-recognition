from fastapi import APIRouter


router = APIRouter()


@router.get("/datasets/status")
def get_dataset_status() -> dict:
    return {
        "downloaded": False,
        "current_phase": "opencv_base_no_training",
        "model_status": "mock_recognizer",
        "message": (
            "No dataset downloaded yet. Current backend uses OpenCV connected "
            "components and deterministic mock recognition."
        ),
        "datasets": [
            {
                "name": "SynthText",
                "purpose": "future character-level bbox pretraining",
                "required_now": False,
                "status": "not_downloaded",
            },
            {
                "name": "VinText",
                "purpose": "future Vietnamese scene text fine-tuning",
                "required_now": False,
                "status": "not_downloaded",
            },
            {
                "name": "Chars74K",
                "purpose": "future Latin digit/letter classifier baseline",
                "required_now": False,
                "status": "not_downloaded",
            },
            {
                "name": "TextOCR",
                "purpose": "future real-world scene text robustness",
                "required_now": False,
                "status": "not_downloaded",
            },
            {
                "name": "NOD",
                "purpose": "future noisy OCR robustness",
                "required_now": False,
                "status": "not_downloaded",
            },
        ],
    }
