from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ImageInfo(BaseModel):
    width: int | None = None
    height: int | None = None
    file_size: int
    format: str
    channels: int | None = None


class ProcessStatistics(BaseModel):
    candidate_boxes: int = 0
    removed_noise_components: int = 0
    possible_connected_characters: int = 0
    merged_boxes: int = 0
    average_box_area: float = 0.0
    median_box_area: float = 0.0
    foreground_ratio: float = 0.0
    noise_component_count: int = 0
    blur_score_laplacian_var: float = 0.0
    contrast_score_std: float = 0.0
    branch_count: int = 1
    processing_time_ms: int = 0


class BoundingBoxResult(BaseModel):
    index: int
    global_order: int
    line_index: int
    order_in_line: int
    x: int
    y: int
    width: int
    height: int
    area: int
    aspect_ratio: float
    fill_ratio: float
    status: str
    source_branch: str | None = None
    crop_url: str | None = None
    label: str = "?"
    removal_reason: str | None = None


class PipelineImages(BaseModel):
    original_url: str | None = None
    grayscale_url: str | None = None
    contrast_url: str | None = None
    illumination_url: str | None = None
    denoised_url: str | None = None
    sharpened_url: str | None = None
    edge_map_url: str | None = None
    dog_url: str | None = None
    log_url: str | None = None
    gabor_response_url: str | None = None
    gabor_binary_url: str | None = None
    binary_url: str | None = None
    binary_otsu_url: str | None = None
    binary_adaptive_url: str | None = None
    binary_sauvola_url: str | None = None
    binary_niblack_url: str | None = None
    morphology_url: str | None = None
    line_mask_url: str | None = None
    no_lines_url: str | None = None
    components_url: str | None = None
    mser_regions_url: str | None = None
    fused_boxes_url: str | None = None
    output_url: str | None = None


class ProcessResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    result_id: str
    status: str = "success"
    mode: str = "opencv_advanced_bbox"
    model_trained: bool = False
    recognition_enabled: bool = False
    user_id: str | None = None
    filename: str
    created_at: str
    processing_time_ms: int
    image_info: ImageInfo
    parameters: dict[str, Any] = Field(default_factory=dict)
    statistics: ProcessStatistics
    boxes: list[BoundingBoxResult]
    pipeline_images: PipelineImages
    output_image_url: str
    output_txt_url: str
    system_comment: str
