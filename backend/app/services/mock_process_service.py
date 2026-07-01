from __future__ import annotations

from datetime import UTC, datetime
from time import perf_counter
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.schemas.process import (
    DebugLinks,
    ImageInfo,
    PipelineImages,
    ProcessResult,
    ProcessStatistics,
)
from app.services.image_processing_service import decode_uploaded_image, save_pipeline_images


MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg"}

# This service runs real OpenCV preprocessing and connected components;
# the recognizer is still a deterministic mock placeholder.
DEFAULT_PARAMETERS: dict[str, Any] = {
    "threshold_mode": "otsu",
    "manual_threshold": 128,
    "adaptive_block_size": 31,
    "adaptive_c": 11,
    "blur_type": "median",
    "blur_kernel": 3,
    "kernel_size": [2, 2],
    "morphology_mode": "open_close",
    "dilation_iterations": 0,
    "erosion_iterations": 0,
    "min_area": 50,
    "max_area": None,
    "min_width": 2,
    "min_height": 5,
    "padding": 2,
    "connectivity": 8,
    "invert": True,
}


def create_process_result(
    upload: UploadFile,
    content: bytes,
    parameters: dict[str, Any],
    base_url: str,
) -> ProcessResult:
    started_at = perf_counter()
    validate_image_upload(upload)
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded image exceeds 10MB limit.",
        )

    merged_parameters = validate_parameters(DEFAULT_PARAMETERS | (parameters or {}))
    decoded_image = decode_uploaded_image(content)

    created_at = datetime.now(UTC)
    result_id = f"RUN-{created_at:%Y%m%d}-{uuid4().hex[:8].upper()}"
    pipeline_output = save_pipeline_images(
        result_id=result_id,
        decoded_image=decoded_image,
        base_url=base_url,
        parameters=merged_parameters,
    )

    boxes = pipeline_output.boxes
    low_confidence_count = sum(1 for box in boxes if box.status == "low_confidence")
    average_confidence = round(
        sum(box.confidence for box in boxes) / len(boxes),
        3,
    ) if boxes else 0.0
    elapsed_ms = max(int((perf_counter() - started_at) * 1000), 1)
    clean_base_url = base_url.rstrip("/")

    return ProcessResult(
        result_id=result_id,
        user_id="demo-user",
        filename=upload.filename or "uploaded-image",
        status="success",
        created_at=created_at.isoformat(),
        processing_time_ms=elapsed_ms,
        image_info=ImageInfo(
            width=decoded_image.width,
            height=decoded_image.height,
            file_size=len(content),
            format=upload.content_type or "unknown",
        ),
        parameters=merged_parameters,
        statistics=ProcessStatistics(
            detected_boxes=len(boxes),
            removed_components=pipeline_output.noise_component_count,
            average_confidence=average_confidence,
            low_confidence_count=low_confidence_count,
            foreground_ratio=pipeline_output.foreground_ratio,
            noise_component_count=pipeline_output.noise_component_count,
        ),
        boxes=boxes,
        pipeline_images=PipelineImages(
            original_url=pipeline_output.images.original_url,
            grayscale_url=pipeline_output.images.grayscale_url,
            denoised_url=pipeline_output.images.denoised_url,
            binary_url=pipeline_output.images.binary_url,
            morphology_url=pipeline_output.images.morphology_url,
            components_url=pipeline_output.images.components_url,
            output_url=pipeline_output.images.output_url,
        ),
        output_image_url=pipeline_output.images.output_url,
        output_txt_url=f"{clean_base_url}/api/output-txt/{result_id}",
        llm_comment=build_system_comment(
            total_boxes=len(boxes),
            low_confidence_count=low_confidence_count,
            noise_count=pipeline_output.noise_component_count,
        ),
        model_version="opencv-cc-mock-recognizer-v1",
        debug_links=DebugLinks(
            original_image=pipeline_output.images.original_url,
            grayscale_image=pipeline_output.images.grayscale_url,
            denoised_image=pipeline_output.images.denoised_url,
            binary_image=pipeline_output.images.binary_url,
            morphology_image=pipeline_output.images.morphology_url,
            components_image=pipeline_output.images.components_url,
            output_preview=pipeline_output.images.output_url,
        ),
    )


def create_mock_process_result(
    upload: UploadFile,
    content: bytes,
    parameters: dict[str, Any],
    base_url: str,
) -> ProcessResult:
    return create_process_result(upload, content, parameters, base_url)


def validate_image_upload(upload: UploadFile) -> None:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are supported.",
        )


def validate_parameters(parameters: dict[str, Any]) -> dict[str, Any]:
    validated = dict(parameters)

    validated["threshold_mode"] = _choice(
        "threshold_mode",
        validated.get("threshold_mode"),
        {"otsu", "manual", "adaptive"},
    )
    validated["blur_type"] = _choice(
        "blur_type",
        validated.get("blur_type"),
        {"none", "median", "gaussian", "bilateral"},
    )
    validated["morphology_mode"] = _choice(
        "morphology_mode",
        validated.get("morphology_mode"),
        {"none", "opening", "closing", "open_close", "close_open"},
    )
    validated["manual_threshold"] = _bounded_int("manual_threshold", validated.get("manual_threshold"), 0, 255)
    validated["blur_kernel"] = _allowed_int("blur_kernel", validated.get("blur_kernel"), {1, 3, 5, 7})
    validated["adaptive_block_size"] = _odd_min_int(
        "adaptive_block_size",
        validated.get("adaptive_block_size"),
        3,
    )
    validated["adaptive_c"] = _parse_int("adaptive_c", validated.get("adaptive_c", 11))
    validated["kernel_size"] = _kernel_size(validated.get("kernel_size"))
    validated["dilation_iterations"] = _min_int(
        "dilation_iterations",
        validated.get("dilation_iterations"),
        0,
    )
    validated["erosion_iterations"] = _min_int(
        "erosion_iterations",
        validated.get("erosion_iterations"),
        0,
    )
    validated["min_area"] = _min_int("min_area", validated.get("min_area"), 0)
    validated["max_area"] = _optional_min_int("max_area", validated.get("max_area"), 0)
    validated["min_width"] = _min_int("min_width", validated.get("min_width"), 0)
    validated["min_height"] = _min_int("min_height", validated.get("min_height"), 0)
    validated["padding"] = _min_int("padding", validated.get("padding"), 0)
    validated["connectivity"] = _allowed_int("connectivity", validated.get("connectivity"), {4, 8})
    validated["invert"] = bool(validated.get("invert", True))

    return validated


def build_system_comment(total_boxes: int, low_confidence_count: int, noise_count: int) -> str:
    if total_boxes == 0:
        return (
            "Pipeline currently uses OpenCV connected components and a deterministic mock recognizer; "
            "no deep learning model has been trained yet. No candidate character boxes were detected. "
            "Try lowering min_area, changing threshold mode, or enabling invert for dark text on light background."
        )

    comment = (
        "Pipeline currently uses OpenCV connected components and a deterministic mock recognizer; "
        "no deep learning model has been trained yet. "
        f"Detected {total_boxes} candidate character boxes."
    )
    if noise_count:
        comment += f" Filtered {noise_count} small or invalid components as noise."
    if low_confidence_count:
        comment += f" {low_confidence_count} boxes are marked low_confidence by the mock recognizer."
    else:
        comment += " All boxes are currently above the low-confidence threshold."
    return comment


def _choice(name: str, value: Any, allowed: set[str]) -> str:
    parsed = str(value).lower()
    if parsed not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be one of: {', '.join(sorted(allowed))}.",
        )
    return parsed


def _allowed_int(name: str, value: Any, allowed: set[int]) -> int:
    parsed = _parse_int(name, value)
    if parsed not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be one of: {', '.join(str(v) for v in sorted(allowed))}.",
        )
    return parsed


def _bounded_int(name: str, value: Any, minimum: int, maximum: int) -> int:
    parsed = _parse_int(name, value)
    if parsed < minimum or parsed > maximum:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be between {minimum} and {maximum}.",
        )
    return parsed


def _min_int(name: str, value: Any, minimum: int) -> int:
    parsed = _parse_int(name, value)
    if parsed < minimum:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be >= {minimum}.",
        )
    return parsed


def _optional_min_int(name: str, value: Any, minimum: int) -> int | None:
    if value is None or value == "":
        return None
    return _min_int(name, value, minimum)


def _odd_min_int(name: str, value: Any, minimum: int) -> int:
    parsed = _min_int(name, value, minimum)
    if parsed % 2 == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be an odd integer >= {minimum}.",
        )
    return parsed


def _kernel_size(value: Any) -> list[int]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="kernel_size must be a two-item array: [width, height].",
        )
    width = _min_int("kernel_size[0]", value[0], 1)
    height = _min_int("kernel_size[1]", value[1], 1)
    return [width, height]


def _parse_int(name: str, value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be an integer.",
        ) from exc
