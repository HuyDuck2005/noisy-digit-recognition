import json

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.schemas.process import ProcessResult
from app.services.image_processing_service import RESULTS_ROOT
from app.services.mock_process_service import (
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    create_process_result,
)


router = APIRouter()


@router.post("/process", response_model=ProcessResult)
async def process_image(
    request: Request,
    image: UploadFile = File(...),
    parameters: str | None = Form(None),
) -> ProcessResult:
    parsed_parameters = _parse_parameters(parameters)

    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are supported.",
        )

    content = await image.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded image exceeds 10MB limit.",
        )

    base_url = str(request.base_url).rstrip("/")
    return create_process_result(
        upload=image,
        content=content,
        parameters=parsed_parameters,
        base_url=base_url,
    )


@router.get("/output-txt/{result_id}")
async def get_output_text_file(result_id: str) -> FileResponse:
    txt_path = (RESULTS_ROOT / result_id / "output.txt").resolve()
    results_root = RESULTS_ROOT.resolve()

    if results_root not in txt_path.parents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result path.",
        )

    if not txt_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output text file not found for this execution.",
        )

    return FileResponse(
        path=txt_path,
        media_type="text/plain",
        filename=f"{result_id}_output.txt",
    )


def _parse_parameters(parameters: str | None) -> dict:
    if parameters is None or not parameters.strip():
        return {}

    try:
        parsed = json.loads(parameters)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="parameters must be a valid JSON object.",
        ) from exc

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="parameters must be a JSON object.",
        )

    return parsed
