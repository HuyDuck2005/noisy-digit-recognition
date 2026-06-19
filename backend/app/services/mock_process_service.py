from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.schemas.process import (
    BoundingBoxResult,
    DebugLinks,
    ImageInfo,
    PipelineImages,
    ProcessResult,
    ProcessStatistics,
)
from app.services.image_processing_service import (
    decode_uploaded_image,
    save_initial_pipeline_images,
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
    base_url: str,
) -> ProcessResult:
    validate_image_upload(upload)
    decoded_image = decode_uploaded_image(content)

    created_at = datetime.now(UTC)
    result_id = f"RUN-{created_at:%Y%m%d}-{uuid4().hex[:8].upper()}"
    pipeline_images = save_initial_pipeline_images(result_id, decoded_image, base_url)
    boxes = build_mock_boxes(result_id)
    low_confidence_count = sum(1 for box in boxes if box.confidence < 0.6)

    merged_parameters = DEFAULT_PARAMETERS | parameters
    output_image_url = pipeline_images.original_url

    return ProcessResult(
        result_id=result_id,
        user_id="demo-user",
        filename=upload.filename or "uploaded-image",
        status="success",
        created_at=created_at.isoformat(),
        processing_time_ms=320,
        image_info=ImageInfo(
            width=decoded_image.width,
            height=decoded_image.height,
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
            original_url=pipeline_images.original_url,
            grayscale_url=pipeline_images.grayscale_url,
            output_url=output_image_url,
        ),
        output_image_url=output_image_url,
        output_txt_url=f"{base_url}/api/output-txt/{result_id}",
        llm_comment=(
            "Backend received and decoded the uploaded image with OpenCV. "
            "The original and grayscale pipeline images were saved for review. "
            "Bounding boxes and predictions are still mock data and will be "
            "replaced by the image-processing pipeline in the next step."
        ),
        model_version="mock-cnn-v0",
        debug_links=DebugLinks(
            original_image=pipeline_images.original_url,
            grayscale_image=pipeline_images.grayscale_url,
            output_preview=output_image_url,
        ),
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
