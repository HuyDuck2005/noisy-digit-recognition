from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ImageInfo(BaseModel):
    width: int | None = None
    height: int | None = None
    file_size: int
    format: str


class ProcessStatistics(BaseModel):
    detected_boxes: int
    removed_components: int
    average_confidence: float
    low_confidence_count: int
    foreground_ratio: float
    noise_component_count: int


class BoundingBoxResult(BaseModel):
    index: int
    x: int
    y: int
    width: int
    height: int
    area: int
    aspect_ratio: float
    label: str
    confidence: float
    status: str
    crop_url: str | None = None


class PipelineImages(BaseModel):
    original_url: str | None = None
    grayscale_url: str | None = None
    denoised_url: str | None = None
    binary_url: str | None = None
    opening_url: str | None = None
    morphology_url: str | None = None
    components_url: str | None = None
    filtered_boxes_url: str | None = None
    output_url: str | None = None


class DebugLinks(BaseModel):
    original_image: str
    grayscale_image: str
    binary_image: str
    morphology_image: str
    components_image: str
    output_preview: str


class ProcessResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    result_id: str
    user_id: str | None = None
    filename: str
    status: str
    created_at: str
    processing_time_ms: int
    image_info: ImageInfo
    parameters: dict[str, Any] = Field(default_factory=dict)
    statistics: ProcessStatistics
    boxes: list[BoundingBoxResult]
    pipeline_images: PipelineImages | None = None
    output_image_url: str
    output_txt_url: str
    llm_comment: str | None = None
    model_version: str | None = None
    debug_links: DebugLinks | None = None
