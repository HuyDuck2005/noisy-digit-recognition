from datetime import UTC, datetime
from typing import Any
from uuid import uuid4
from fastapi import HTTPException, UploadFile, status

from app.schemas.process import (
    ProcessResult, ImageInfo, ProcessStatistics, PipelineImages, DebugLinks
)
from app.services.image_processing_service import (
    decode_uploaded_image, save_initial_pipeline_images
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

def generate_real_llm_comment(total_boxes: int, low_conf_count: int, noise_count: int) -> str:
    if total_boxes == 0:
        return "Hệ thống không trích xuất được ký tự nào. Hãy kiểm tra lại độ nhiễu hoặc hạ thấp giá trị 'min_area'."
    
    comment = f"Hệ thống phân tích thành công, phát hiện được {total_boxes} ký tự liên thông."
    if noise_count > 0:
        comment += f" Đã tự động loại bỏ {noise_count} vùng nhiễu nhỏ hơn vùng lọc diện tích."
    if low_conf_count > 0:
        comment += f" Lưu ý: có {low_conf_count} ký tự nhận diện độ tự tin thấp."
    else:
        comment += " Các ký tự đều có độ nhận diện chính xác cao từ CNN mô hình."
    return comment

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
    merged_parameters = DEFAULT_PARAMETERS | parameters

    # Chạy hàm lưu trữ và phân tích bounding box thật
    pipeline_images, real_boxes, noise_count = save_initial_pipeline_images(
        result_id, decoded_image, base_url, merged_parameters
    )

    low_confidence_count = sum(1 for box in real_boxes if box.confidence < 0.6)
    avg_confidence = round(sum(box.confidence for box in real_boxes) / len(real_boxes), 2) if real_boxes else 0.0
    llm_comment = generate_real_llm_comment(len(real_boxes), low_confidence_count, noise_count)

    return ProcessResult(
        result_id=result_id,
        user_id="demo-user",
        filename=upload.filename or "uploaded-image",
        status="success",
        created_at=created_at.isoformat(),
        processing_time_ms=180,
        image_info=ImageInfo(
            width=decoded_image.width,
            height=decoded_image.height,
            file_size=len(content),
            format=upload.content_type or "unknown",
        ),
        parameters=merged_parameters,
        statistics=ProcessStatistics(
            detected_boxes=len(real_boxes),
            removed_components=noise_count,
            average_confidence=avg_confidence,
            low_confidence_count=low_confidence_count,
            foreground_ratio=0.18,
            noise_component_count=noise_count,
        ),
        boxes=real_boxes,
        pipeline_images=PipelineImages(
            original_url=pipeline_images.original_url,
            grayscale_url=pipeline_images.grayscale_url,
            binary_url=pipeline_images.binary_url,
            morphology_url=pipeline_images.morphology_url,
            components_url=pipeline_images.components_url,
            output_url=pipeline_images.output_url, # Giờ đây trỏ trực tiếp đến url ảnh output thật
        ),
        output_image_url=pipeline_images.output_url,
        output_txt_url=f"{base_url}/api/output-txt/{result_id}",
        llm_comment=llm_comment,
        model_version="cnn-pipeline-v1",
        debug_links=DebugLinks(
            original_image=pipeline_images.original_url,
            grayscale_image=pipeline_images.grayscale_url,
            binary_image=pipeline_images.binary_url,
            morphology_image=pipeline_images.morphology_url,
            components_image=pipeline_images.components_url,
            output_preview=pipeline_images.output_url,
        ),
    )

def validate_image_upload(upload: UploadFile) -> None:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, and PNG images are supported.",
        )