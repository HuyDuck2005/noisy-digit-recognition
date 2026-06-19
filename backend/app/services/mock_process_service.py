from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.schemas.process import (
    BoundingBoxResult,
    ImageInfo,
    PipelineImages,
    ProcessResult,
    ProcessStatistics,
)


MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg"}


DEFAULT_PARAMETERS: dict[str, Any] = {
    "threshold_mode": "otsu",
    "blur_type": "median",
    "blur_kernel": 3,
    "kernel_size": [2, 2],
    "dilation_iterations": 1,
    "min_area": 50,
    "connectivity": 8,
}


def create_mock_process_result(
    upload: UploadFile,
    content: bytes,
    parameters: dict[str, Any],
) -> ProcessResult:
    validate_image_upload(upload)

    created_at = datetime.now(UTC)
    result_id = f"RUN-{created_at:%Y%m%d}-{uuid4().hex[:8].upper()}"
    width, height = read_image_size(content)
    boxes = build_mock_boxes(result_id)
    low_confidence_count = sum(1 for box in boxes if box.confidence < 0.6)

    merged_parameters = DEFAULT_PARAMETERS | parameters
    output_image_url = f"/api/result-image/{result_id}"

    return ProcessResult(
        result_id=result_id,
        user_id="demo-user",
        filename=upload.filename or "uploaded-image",
        status="success",
        created_at=created_at.isoformat(),
        processing_time_ms=320,
        image_info=ImageInfo(
            width=width,
            height=height,
            file_size=len(content),
            format=upload.content_type or "unknown",
        ),
        parameters=merged_parameters,
        statistics=ProcessStatistics(
            detected_boxes=len(boxes),
            removed_components=15,
            average_confidence=round(
                sum(box.confidence for box in boxes) / len(boxes), 2
            ),
            low_confidence_count=low_confidence_count,
            foreground_ratio=0.2,
            noise_component_count=10,
        ),
        boxes=boxes,
        pipeline_images=PipelineImages(
            original_url=f"/api/images/original/{result_id}",
            output_url=output_image_url,
        ),
        output_image_url=output_image_url,
        output_txt_url=f"/api/output-txt/{result_id}",
        llm_comment=(
            "Mock backend detected 3 characters. This response is shaped like "
            "the ProcessResult contract and is ready to be replaced by the "
            "OpenCV/CNN pipeline in the next step."
        ),
        model_version="mock-cnn-v0",
    )


def validate_image_upload(upload: UploadFile) -> None:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are supported.",
        )


def build_mock_boxes(result_id: str) -> list[BoundingBoxResult]:
    raw_boxes = [
        (1, 12, 35, 24, 40, "7", 0.94, "normal"),
        (2, 80, 31, 22, 39, "A", 0.88, "normal"),
        (3, 140, 29, 25, 42, "B", 0.52, "low_confidence"),
    ]

    return [
        BoundingBoxResult(
            index=index,
            x=x,
            y=y,
            width=width,
            height=height,
            area=width * height,
            aspect_ratio=round(width / height, 2),
            label=label,
            confidence=confidence,
            status=box_status,
            crop_url=f"/api/crops/{result_id}/{index}.png",
        )
        for index, x, y, width, height, label, confidence, box_status in raw_boxes
    ]


def read_image_size(content: bytes) -> tuple[int | None, int | None]:
    if content.startswith(b"\x89PNG\r\n\x1a\n") and len(content) >= 24:
        width = int.from_bytes(content[16:20], "big")
        height = int.from_bytes(content[20:24], "big")
        return width, height

    if content.startswith(b"\xff\xd8"):
        return read_jpeg_size(content)

    return None, None


def read_jpeg_size(content: bytes) -> tuple[int | None, int | None]:
    index = 2
    while index + 9 < len(content):
        if content[index] != 0xFF:
            index += 1
            continue

        marker = content[index + 1]
        index += 2

        while marker == 0xFF and index < len(content):
            marker = content[index]
            index += 1

        if marker in {0xD8, 0xD9}:
            continue

        if index + 2 > len(content):
            break

        segment_length = int.from_bytes(content[index : index + 2], "big")
        if segment_length < 2:
            break

        if marker in {
            0xC0,
            0xC1,
            0xC2,
            0xC3,
            0xC5,
            0xC6,
            0xC7,
            0xC9,
            0xCA,
            0xCB,
            0xCD,
            0xCE,
            0xCF,
        }:
            if index + 7 <= len(content):
                height = int.from_bytes(content[index + 3 : index + 5], "big")
                width = int.from_bytes(content[index + 5 : index + 7], "big")
                return width, height
            break

        index += segment_length

    return None, None
