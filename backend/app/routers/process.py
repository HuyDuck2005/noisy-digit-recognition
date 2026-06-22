import json
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from app.schemas.process import ProcessResult
from app.services.mock_process_service import (
    MAX_UPLOAD_SIZE_BYTES,
    create_mock_process_result,
)


router = APIRouter()


@router.post("/process", response_model=ProcessResult)
async def process_image(
    request: Request,
    image: UploadFile | None = File(default=None),
    file: UploadFile | None = File(default=None),
    parameters: str | None = Form(default=None),
) -> ProcessResult:
    upload = image or file
    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required. Use form field 'image' or 'file'.",
        )

    parsed_parameters = parse_parameters(parameters)
    content = await upload.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty.",
        )

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded image exceeds the 10MB limit.",
        )

    base_url = str(request.base_url).rstrip("/")
    return create_mock_process_result(upload, content, parsed_parameters, base_url)


def parse_parameters(parameters: str | None) -> dict[str, Any]:
    if not parameters:
        return {}

    try:
        parsed = json.loads(parameters)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parameters must be valid JSON.",
        ) from exc

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parameters must be a JSON object.",
        )

    return parsed
