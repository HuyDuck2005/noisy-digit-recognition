from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter
from typing import Any
from uuid import uuid4

import cv2
import numpy as np
from fastapi import HTTPException, UploadFile, status

from app.schemas.process import (
    BoundingBoxResult,
    ImageInfo,
    PipelineImages,
    ProcessResult,
    ProcessStatistics,
)

try:
    from skimage.filters import threshold_niblack, threshold_sauvola
except Exception:  # pragma: no cover - optional runtime fallback
    threshold_niblack = None
    threshold_sauvola = None


BACKEND_ROOT = Path(__file__).resolve().parents[2]
RESULTS_ROOT = BACKEND_ROOT / "storage" / "results"
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg"}
MODE = "opencv_advanced_bbox"

PIPELINE_IMAGE_FILENAMES = {
    "original": "original.png",
    "grayscale": "grayscale.png",
    "contrast": "contrast.png",
    "illumination": "illumination.png",
    "denoised": "denoised.png",
    "sharpened": "sharpened.png",
    "edge_map": "edge_map.png",
    "dog": "dog.png",
    "log": "log.png",
    "gabor_response": "gabor_response.png",
    "gabor_binary": "gabor_binary.png",
    "binary": "binary.png",
    "binary_otsu": "binary_otsu.png",
    "binary_adaptive": "binary_adaptive.png",
    "binary_sauvola": "binary_sauvola.png",
    "binary_niblack": "binary_niblack.png",
    "morphology": "morphology.png",
    "line_mask": "line_mask.png",
    "no_lines": "no_lines.png",
    "components": "components.png",
    "mser_regions": "mser_regions.png",
    "fused_boxes": "fused_boxes.png",
    "output": "output.png",
}

DEFAULT_PARAMETERS: dict[str, Any] = {
    "resize_scale": 1.0,
    "max_width": 1600,
    "grayscale_mode": "standard",
    "contrast_method": "clahe",
    "clahe_clip_limit": 2.0,
    "clahe_tile_grid_size": [8, 8],
    "illumination_correction": "none",
    "illumination_kernel_size": 31,
    "denoise_method": "median",
    "median_kernel": 3,
    "gaussian_kernel": 3,
    "gaussian_sigma": 0,
    "bilateral_d": 7,
    "bilateral_sigma_color": 50,
    "bilateral_sigma_space": 50,
    "nlm_h": 10,
    "nlm_template_window_size": 7,
    "nlm_search_window_size": 21,
    "sharpen_method": "none",
    "unsharp_amount": 1.0,
    "unsharp_sigma": 1.0,
    "convolution_branch_enabled": True,
    "edge_method": "none",
    "sobel_ksize": 3,
    "laplacian_ksize": 3,
    "log_sigma": 1.0,
    "dog_sigma_small": 1.0,
    "dog_sigma_large": 2.0,
    "gabor_enabled": False,
    "gabor_frequencies": [0.1, 0.2],
    "gabor_angles": [0, 30, 60, 90, 120, 150],
    "threshold_method": "adaptive",
    "manual_threshold": 128,
    "adaptive_method": "gaussian",
    "adaptive_block_size": 31,
    "adaptive_c": 11,
    "sauvola_window_size": 25,
    "sauvola_k": 0.2,
    "niblack_window_size": 25,
    "niblack_k": -0.2,
    "invert": True,
    "morphology_mode": "open_close",
    "kernel_shape": "rect",
    "kernel_size": [2, 2],
    "opening_iterations": 1,
    "closing_iterations": 1,
    "dilation_iterations": 0,
    "erosion_iterations": 0,
    "remove_lines": False,
    "line_removal_method": "morphology",
    "horizontal_line_kernel": 30,
    "vertical_line_kernel": 30,
    "hough_threshold": 80,
    "hough_min_line_length": 30,
    "hough_max_line_gap": 5,
    "bbox_methods": ["connected_components"],
    "connectivity": 8,
    "mser_enabled": False,
    "contours_enabled": False,
    "min_area": 20,
    "max_area": None,
    "min_width": 2,
    "min_height": 5,
    "max_width_ratio": 0.5,
    "max_height_ratio": 0.5,
    "min_aspect_ratio": 0.05,
    "max_aspect_ratio": 5.0,
    "min_fill_ratio": 0.02,
    "padding": 2,
    "merge_close_boxes": True,
    "merge_x_gap": 2,
    "merge_y_overlap_ratio": 0.5,
    "split_wide_boxes": False,
    "wide_box_aspect_threshold": 1.8,
    "multi_branch_enabled": False,
    "box_fusion_iou_threshold": 0.3,
    "nms_iou_threshold": 0.4,
    "sort_reading_order": True,
}


@dataclass(frozen=True)
class DecodedImage:
    image: np.ndarray
    width: int
    height: int
    channels: int


@dataclass(frozen=True)
class ResizeResult:
    image: np.ndarray
    scale_factor: float


@dataclass
class CandidateBox:
    x: int
    y: int
    width: int
    height: int
    area: int
    fill_ratio: float
    source_branch: str
    status: str = "candidate"
    removal_reason: str | None = None
    line_index: int = 0
    order_in_line: int = 0
    global_order: int = 0

    @property
    def x2(self) -> int:
        return self.x + self.width

    @property
    def y2(self) -> int:
        return self.y + self.height

    @property
    def aspect_ratio(self) -> float:
        return self.width / max(self.height, 1)

    @property
    def center_y(self) -> float:
        return self.y + self.height / 2


@dataclass(frozen=True)
class AdvancedPipelineOutput:
    boxes: list[BoundingBoxResult]
    pipeline_images: PipelineImages
    output_image_url: str
    output_txt_url: str
    statistics: ProcessStatistics
    system_comment: str
    processing_time_ms: int
    image_info: ImageInfo


def create_process_result(
    upload: UploadFile,
    content: bytes,
    parameters: dict[str, Any],
    base_url: str,
) -> ProcessResult:
    started_at = perf_counter()
    validate_image_upload(upload, content)
    merged_parameters = validate_parameters(DEFAULT_PARAMETERS | (parameters or {}))
    decoded = decode_uploaded_image(content)
    created_at = datetime.now(UTC)
    result_id = f"RUN-{created_at:%Y%m%d}-{uuid4().hex[:8].upper()}"

    output = run_advanced_pipeline(
        result_id=result_id,
        decoded_image=decoded,
        filename=upload.filename or "uploaded-image",
        file_size=len(content),
        content_type=upload.content_type or "unknown",
        parameters=merged_parameters,
        base_url=base_url,
        started_at=started_at,
    )

    return ProcessResult(
        result_id=result_id,
        status="success",
        mode=MODE,
        model_trained=False,
        recognition_enabled=False,
        user_id="demo-user",
        filename=upload.filename or "uploaded-image",
        created_at=created_at.isoformat(),
        processing_time_ms=output.processing_time_ms,
        image_info=output.image_info,
        parameters=merged_parameters,
        statistics=output.statistics,
        boxes=output.boxes,
        pipeline_images=output.pipeline_images,
        output_image_url=output.output_image_url,
        output_txt_url=output.output_txt_url,
        system_comment=output.system_comment,
    )


def run_advanced_pipeline(
    result_id: str,
    decoded_image: DecodedImage,
    filename: str,
    file_size: int,
    content_type: str,
    parameters: dict[str, Any],
    base_url: str,
    started_at: float,
) -> AdvancedPipelineOutput:
    result_dir = RESULTS_ROOT / result_id
    result_dir.mkdir(parents=True, exist_ok=True)

    resize_result = resize_image_if_needed(decoded_image.image, parameters)
    original = resize_result.image
    grayscale = to_grayscale(original)
    contrast = apply_contrast(grayscale, parameters)
    illumination = correct_illumination(contrast, parameters)
    denoised = apply_denoise(illumination, parameters)
    sharpened = apply_sharpen(denoised, parameters)
    edge_maps = build_edge_maps(sharpened, parameters)
    gabor_maps = apply_gabor_bank(sharpened, parameters)

    stages: dict[str, np.ndarray | None] = {
        "original": original,
        "grayscale": grayscale,
        "contrast": contrast,
        "illumination": illumination if parameters["illumination_correction"] != "none" else None,
        "denoised": denoised,
        "sharpened": sharpened if parameters["sharpen_method"] != "none" else None,
        "edge_map": edge_maps.get("edge_map"),
        "dog": edge_maps.get("dog"),
        "log": edge_maps.get("log"),
        "gabor_response": gabor_maps.get("gabor_response"),
        "gabor_binary": gabor_maps.get("gabor_binary"),
    }

    branch_masks = build_branch_masks(sharpened, edge_maps, gabor_maps, parameters)
    main_binary = branch_masks["main"] if "main" in branch_masks else next(iter(branch_masks.values()))
    stages.update(
        {
            "binary": main_binary,
            "binary_otsu": branch_masks.get("otsu"),
            "binary_adaptive": branch_masks.get("adaptive"),
            "binary_sauvola": branch_masks.get("sauvola"),
            "binary_niblack": branch_masks.get("niblack"),
        }
    )

    morphology = apply_morphology(main_binary, parameters)
    no_lines, line_mask = remove_lines(morphology, parameters)
    final_main_mask = no_lines if no_lines is not None else morphology
    stages["morphology"] = morphology
    stages["line_mask"] = line_mask
    stages["no_lines"] = no_lines
    stages["components"] = generate_components_visualization(final_main_mask, parameters["connectivity"])

    branch_boxes: list[CandidateBox] = []
    removed_noise_components = 0
    active_branch_count = 0

    for branch_name, mask in branch_masks.items():
        morphed = apply_morphology(mask, parameters)
        cleaned, _ = remove_lines(morphed, parameters)
        branch_mask = cleaned if cleaned is not None else morphed
        active_branch_count += 1
        boxes, removed = extract_boxes_from_mask(branch_mask, branch_name, parameters)
        branch_boxes.extend(boxes)
        removed_noise_components += removed

        if parameters["contours_enabled"] or "contours" in parameters["bbox_methods"]:
            contour_boxes, contour_removed = extract_boxes_contours(branch_mask, f"{branch_name}_contours", parameters)
            branch_boxes.extend(contour_boxes)
            removed_noise_components += contour_removed

    if parameters["mser_enabled"] or "mser" in parameters["bbox_methods"]:
        mser_boxes = extract_boxes_mser(sharpened, parameters)
        branch_boxes.extend(mser_boxes)
        stages["mser_regions"] = draw_boxes(original, mser_boxes, show_label=False)

    filtered_boxes, filtered_removed = filter_boxes(branch_boxes, final_main_mask.shape, parameters)
    removed_noise_components += filtered_removed
    merged_count = 0
    if parameters["merge_close_boxes"]:
        filtered_boxes, merged_count = merge_close_boxes(filtered_boxes, parameters)

    if parameters["multi_branch_enabled"]:
        filtered_boxes, fusion_count = fuse_overlapping_boxes(
            filtered_boxes,
            parameters["box_fusion_iou_threshold"],
        )
        merged_count += fusion_count

    filtered_boxes = nms_boxes(filtered_boxes, parameters["nms_iou_threshold"])
    mark_possible_connected_characters(filtered_boxes, parameters)
    if parameters["split_wide_boxes"]:
        filtered_boxes = split_wide_boxes(filtered_boxes, final_main_mask, parameters)

    sorted_boxes = sort_boxes_reading_order(filtered_boxes) if parameters["sort_reading_order"] else filtered_boxes
    output_boxes = save_crops_and_build_results(sorted_boxes, original, result_id, parameters)
    stages["fused_boxes"] = draw_boxes(original, sorted_boxes, show_label=False)
    stages["output"] = generate_output_image(original, output_boxes)

    write_pipeline_images(result_dir, stages)
    write_output_txt(result_dir, output_boxes)

    clean_base_url = base_url.rstrip("/")
    pipeline_images = build_pipeline_urls(clean_base_url, result_id, stages)
    output_image_url = pipeline_images.output_url or f"{clean_base_url}/api/images/output/{result_id}"
    output_txt_url = f"{clean_base_url}/api/output-txt/{result_id}"

    processing_time_ms = max(int((perf_counter() - started_at) * 1000), 1)
    stats = build_statistics(
        boxes=output_boxes,
        removed_noise_components=removed_noise_components,
        merged_count=merged_count,
        foreground_mask=final_main_mask,
        grayscale=grayscale,
        branch_count=active_branch_count,
        processing_time_ms=processing_time_ms,
    )
    comment = generate_system_comment(stats, parameters)

    return AdvancedPipelineOutput(
        boxes=output_boxes,
        pipeline_images=pipeline_images,
        output_image_url=output_image_url,
        output_txt_url=output_txt_url,
        statistics=stats,
        system_comment=comment,
        processing_time_ms=processing_time_ms,
        image_info=ImageInfo(
            width=original.shape[1],
            height=original.shape[0],
            channels=decoded_image.channels,
            file_size=file_size,
            format=content_type,
        ),
    )


def validate_image_upload(upload: UploadFile, content: bytes) -> None:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG images are supported.")
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Uploaded image exceeds 10MB limit.")


def validate_parameters(parameters: dict[str, Any]) -> dict[str, Any]:
    p = dict(parameters)
    p["resize_scale"] = _min_float("resize_scale", p["resize_scale"], 0.01)
    p["max_width"] = _min_int("max_width", p["max_width"], 1)
    p["contrast_method"] = _choice("contrast_method", p["contrast_method"], {"none", "hist_equalization", "clahe"})
    p["clahe_clip_limit"] = _min_float("clahe_clip_limit", p["clahe_clip_limit"], 0.1)
    p["clahe_tile_grid_size"] = _size_pair("clahe_tile_grid_size", p["clahe_tile_grid_size"])
    p["illumination_correction"] = _choice("illumination_correction", p["illumination_correction"], {"none", "background_division", "background_subtraction"})
    p["illumination_kernel_size"] = _odd_min_int("illumination_kernel_size", p["illumination_kernel_size"], 3)
    p["denoise_method"] = _choice("denoise_method", p["denoise_method"], {"none", "median", "gaussian", "bilateral", "nlm"})
    p["median_kernel"] = _allowed_int("median_kernel", p["median_kernel"], {1, 3, 5, 7, 9})
    p["gaussian_kernel"] = _allowed_int("gaussian_kernel", p["gaussian_kernel"], {1, 3, 5, 7, 9})
    p["gaussian_sigma"] = _min_float("gaussian_sigma", p["gaussian_sigma"], 0.0)
    p["bilateral_d"] = _allowed_int("bilateral_d", p["bilateral_d"], {1, 3, 5, 7, 9})
    p["bilateral_sigma_color"] = _min_float("bilateral_sigma_color", p["bilateral_sigma_color"], 1.0)
    p["bilateral_sigma_space"] = _min_float("bilateral_sigma_space", p["bilateral_sigma_space"], 1.0)
    p["nlm_h"] = _min_float("nlm_h", p["nlm_h"], 0.0)
    p["nlm_template_window_size"] = _odd_min_int("nlm_template_window_size", p["nlm_template_window_size"], 3)
    p["nlm_search_window_size"] = _odd_min_int("nlm_search_window_size", p["nlm_search_window_size"], 3)
    p["sharpen_method"] = _choice("sharpen_method", p["sharpen_method"], {"none", "unsharp", "laplacian_boost"})
    p["edge_method"] = _choice("edge_method", p["edge_method"], {"none", "sobel", "scharr", "laplacian", "log", "dog", "canny"})
    p["sobel_ksize"] = _allowed_int("sobel_ksize", p["sobel_ksize"], {1, 3, 5, 7})
    p["laplacian_ksize"] = _allowed_int("laplacian_ksize", p["laplacian_ksize"], {1, 3, 5, 7})
    p["threshold_method"] = _choice("threshold_method", p["threshold_method"], {"otsu", "manual", "adaptive", "sauvola", "niblack"})
    p["adaptive_method"] = _choice("adaptive_method", p["adaptive_method"], {"mean", "gaussian"})
    p["adaptive_block_size"] = _odd_min_int("adaptive_block_size", p["adaptive_block_size"], 3)
    p["sauvola_window_size"] = _odd_min_int("sauvola_window_size", p["sauvola_window_size"], 3)
    p["niblack_window_size"] = _odd_min_int("niblack_window_size", p["niblack_window_size"], 3)
    p["morphology_mode"] = _choice("morphology_mode", p["morphology_mode"], {"none", "opening", "closing", "open_close", "close_open", "dilation", "erosion"})
    p["kernel_shape"] = _choice("kernel_shape", p["kernel_shape"], {"rect", "ellipse", "cross"})
    p["kernel_size"] = _size_pair("kernel_size", p["kernel_size"])
    p["connectivity"] = _allowed_int("connectivity", p["connectivity"], {4, 8})
    p["min_area"] = _min_int("min_area", p["min_area"], 0)
    p["max_area"] = None if p.get("max_area") in (None, "") else _min_int("max_area", p["max_area"], 0)
    p["min_width"] = _min_int("min_width", p["min_width"], 0)
    p["min_height"] = _min_int("min_height", p["min_height"], 0)
    p["padding"] = _min_int("padding", p["padding"], 0)
    p["min_aspect_ratio"] = _min_float("min_aspect_ratio", p["min_aspect_ratio"], 0.0001)
    p["max_aspect_ratio"] = _min_float("max_aspect_ratio", p["max_aspect_ratio"], p["min_aspect_ratio"])
    if p["max_aspect_ratio"] <= p["min_aspect_ratio"]:
        raise HTTPException(status_code=400, detail="max_aspect_ratio must be greater than min_aspect_ratio.")
    p["bbox_methods"] = _string_list("bbox_methods", p["bbox_methods"])
    for key in (
        "opening_iterations",
        "closing_iterations",
        "dilation_iterations",
        "erosion_iterations",
        "horizontal_line_kernel",
        "vertical_line_kernel",
        "hough_threshold",
        "hough_min_line_length",
        "hough_max_line_gap",
        "merge_x_gap",
    ):
        p[key] = _min_int(key, p[key], 0)
    p["merge_y_overlap_ratio"] = _min_float("merge_y_overlap_ratio", p["merge_y_overlap_ratio"], 0.0)
    p["nms_iou_threshold"] = _min_float("nms_iou_threshold", p["nms_iou_threshold"], 0.0)
    p["box_fusion_iou_threshold"] = _min_float("box_fusion_iou_threshold", p["box_fusion_iou_threshold"], 0.0)
    p["gabor_frequencies"] = [float(v) for v in p.get("gabor_frequencies", [0.1])]
    p["gabor_angles"] = [float(v) for v in p.get("gabor_angles", [0])]
    return p


def decode_uploaded_image(content: bytes) -> DecodedImage:
    image_buffer = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Uploaded file could not be decoded as an image.")
    height, width = image.shape[:2]
    channels = image.shape[2] if image.ndim == 3 else 1
    return DecodedImage(image=image, width=width, height=height, channels=channels)


def resize_image_if_needed(image: np.ndarray, parameters: dict[str, Any]) -> ResizeResult:
    scale = float(parameters["resize_scale"])
    max_width = int(parameters["max_width"])
    if image.shape[1] > max_width:
        scale *= max_width / image.shape[1]
    if abs(scale - 1.0) < 1e-6:
        return ResizeResult(image=image.copy(), scale_factor=1.0)
    interpolation = cv2.INTER_CUBIC if scale > 1 else cv2.INTER_AREA
    resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=interpolation)
    return ResizeResult(image=resized, scale_factor=scale)


def to_grayscale(image: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def apply_contrast(gray: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    method = parameters["contrast_method"]
    if method == "none":
        return gray.copy()
    if method == "hist_equalization":
        return cv2.equalizeHist(gray)
    clahe = cv2.createCLAHE(
        clipLimit=float(parameters["clahe_clip_limit"]),
        tileGridSize=tuple(parameters["clahe_tile_grid_size"]),
    )
    return clahe.apply(gray)


def correct_illumination(gray: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    method = parameters["illumination_correction"]
    if method == "none":
        return gray.copy()
    kernel = parameters["illumination_kernel_size"]
    background = cv2.medianBlur(gray, kernel)
    background = np.maximum(background, 1)
    if method == "background_division":
        corrected = gray.astype(np.float32) / background.astype(np.float32)
    else:
        corrected = gray.astype(np.float32) - background.astype(np.float32)
    return cv2.normalize(corrected, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def apply_denoise(gray: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    method = parameters["denoise_method"]
    if method == "none":
        return gray.copy()
    if method == "median":
        return cv2.medianBlur(gray, parameters["median_kernel"])
    if method == "gaussian":
        k = parameters["gaussian_kernel"]
        return cv2.GaussianBlur(gray, (k, k), parameters["gaussian_sigma"])
    if method == "bilateral":
        return cv2.bilateralFilter(
            gray,
            parameters["bilateral_d"],
            parameters["bilateral_sigma_color"],
            parameters["bilateral_sigma_space"],
        )
    return cv2.fastNlMeansDenoising(
        gray,
        None,
        h=float(parameters["nlm_h"]),
        templateWindowSize=parameters["nlm_template_window_size"],
        searchWindowSize=parameters["nlm_search_window_size"],
    )


def apply_sharpen(gray: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    method = parameters["sharpen_method"]
    if method == "none":
        return gray.copy()
    if method == "unsharp":
        sigma = max(float(parameters["unsharp_sigma"]), 0.1)
        amount = float(parameters["unsharp_amount"])
        blurred = cv2.GaussianBlur(gray, (0, 0), sigma)
        return cv2.addWeighted(gray, 1 + amount, blurred, -amount, 0)
    lap = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
    boosted = gray.astype(np.float32) - float(parameters["unsharp_amount"]) * lap
    return np.clip(boosted, 0, 255).astype(np.uint8)


def build_edge_maps(gray: np.ndarray, parameters: dict[str, Any]) -> dict[str, np.ndarray]:
    method = parameters["edge_method"]
    maps: dict[str, np.ndarray] = {}
    if method == "none" and not parameters["multi_branch_enabled"]:
        return maps

    sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=parameters["sobel_ksize"])
    sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=parameters["sobel_ksize"])
    sobel = _normalize_u8(cv2.magnitude(sobel_x, sobel_y))
    maps["edge_map"] = sobel

    if method in {"scharr"}:
        sx = cv2.Scharr(gray, cv2.CV_32F, 1, 0)
        sy = cv2.Scharr(gray, cv2.CV_32F, 0, 1)
        maps["edge_map"] = _normalize_u8(cv2.magnitude(sx, sy))
    if method in {"laplacian", "log"}:
        source = cv2.GaussianBlur(gray, (0, 0), parameters["log_sigma"]) if method == "log" else gray
        maps["log" if method == "log" else "edge_map"] = _normalize_u8(np.abs(cv2.Laplacian(source, cv2.CV_32F, ksize=parameters["laplacian_ksize"])))
        maps["edge_map"] = maps.get("log", maps["edge_map"])
    if method in {"dog"} or parameters["multi_branch_enabled"]:
        small = cv2.GaussianBlur(gray, (0, 0), parameters["dog_sigma_small"])
        large = cv2.GaussianBlur(gray, (0, 0), parameters["dog_sigma_large"])
        maps["dog"] = _normalize_u8(small.astype(np.float32) - large.astype(np.float32))
        if method == "dog":
            maps["edge_map"] = maps["dog"]
    if method == "canny":
        maps["edge_map"] = cv2.Canny(gray, 80, 160)
    return maps


def apply_gabor_bank(gray: np.ndarray, parameters: dict[str, Any]) -> dict[str, np.ndarray]:
    if not parameters["gabor_enabled"]:
        return {}
    response = np.zeros_like(gray, dtype=np.float32)
    for frequency in parameters["gabor_frequencies"]:
        wavelength = max(1.0 / max(float(frequency), 0.001), 2.0)
        for angle in parameters["gabor_angles"]:
            kernel = cv2.getGaborKernel((15, 15), 4.0, np.deg2rad(angle), wavelength, 0.5, 0, ktype=cv2.CV_32F)
            filtered = cv2.filter2D(gray, cv2.CV_32F, kernel)
            response = np.maximum(response, np.abs(filtered))
    response_u8 = _normalize_u8(response)
    _, binary = cv2.threshold(response_u8, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    return {"gabor_response": response_u8, "gabor_binary": binary}


def build_branch_masks(
    gray: np.ndarray,
    edge_maps: dict[str, np.ndarray],
    gabor_maps: dict[str, np.ndarray],
    parameters: dict[str, Any],
) -> dict[str, np.ndarray]:
    masks = {"main": apply_threshold(gray, parameters)}
    if parameters["multi_branch_enabled"]:
        for method in ("otsu", "adaptive", "sauvola"):
            branch_params = dict(parameters)
            branch_params["threshold_method"] = method
            masks[method] = apply_threshold(gray, branch_params)
        if edge_maps.get("edge_map") is not None:
            _, masks["edge"] = cv2.threshold(edge_maps["edge_map"], 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        if gabor_maps.get("gabor_binary") is not None:
            masks["gabor"] = gabor_maps["gabor_binary"]
    return masks


def apply_threshold(gray: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    method = parameters["threshold_method"]
    invert = bool(parameters["invert"])
    cv_type = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY
    if method == "otsu":
        _, binary = cv2.threshold(gray, 0, 255, cv_type | cv2.THRESH_OTSU)
        return binary
    if method == "manual":
        _, binary = cv2.threshold(gray, parameters["manual_threshold"], 255, cv_type)
        return binary
    if method == "adaptive":
        adaptive = cv2.ADAPTIVE_THRESH_GAUSSIAN_C if parameters["adaptive_method"] == "gaussian" else cv2.ADAPTIVE_THRESH_MEAN_C
        return cv2.adaptiveThreshold(gray, 255, adaptive, cv_type, parameters["adaptive_block_size"], parameters["adaptive_c"])
    if method == "sauvola" and threshold_sauvola is not None:
        thresh = threshold_sauvola(gray, window_size=parameters["sauvola_window_size"], k=parameters["sauvola_k"])
        mask = gray < thresh if invert else gray > thresh
        return (mask.astype(np.uint8) * 255)
    if method == "niblack" and threshold_niblack is not None:
        thresh = threshold_niblack(gray, window_size=parameters["niblack_window_size"], k=parameters["niblack_k"])
        mask = gray < thresh if invert else gray > thresh
        return (mask.astype(np.uint8) * 255)
    branch_params = dict(parameters)
    branch_params["threshold_method"] = "adaptive"
    return apply_threshold(gray, branch_params)


def apply_morphology(binary: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    mode = parameters["morphology_mode"]
    kernel = _kernel(parameters)
    result = binary.copy()
    if mode == "none":
        pass
    elif mode == "opening":
        result = cv2.morphologyEx(result, cv2.MORPH_OPEN, kernel, iterations=parameters["opening_iterations"])
    elif mode == "closing":
        result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel, iterations=parameters["closing_iterations"])
    elif mode == "open_close":
        result = cv2.morphologyEx(result, cv2.MORPH_OPEN, kernel, iterations=parameters["opening_iterations"])
        result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel, iterations=parameters["closing_iterations"])
    elif mode == "close_open":
        result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel, iterations=parameters["closing_iterations"])
        result = cv2.morphologyEx(result, cv2.MORPH_OPEN, kernel, iterations=parameters["opening_iterations"])
    elif mode == "dilation":
        result = cv2.dilate(result, kernel, iterations=max(parameters["dilation_iterations"], 1))
    elif mode == "erosion":
        result = cv2.erode(result, kernel, iterations=max(parameters["erosion_iterations"], 1))
    if parameters["dilation_iterations"] > 0 and mode != "dilation":
        result = cv2.dilate(result, kernel, iterations=parameters["dilation_iterations"])
    if parameters["erosion_iterations"] > 0 and mode != "erosion":
        result = cv2.erode(result, kernel, iterations=parameters["erosion_iterations"])
    return result


def remove_lines(binary: np.ndarray, parameters: dict[str, Any]) -> tuple[np.ndarray | None, np.ndarray | None]:
    if not parameters["remove_lines"]:
        return None, None
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (parameters["horizontal_line_kernel"], 1))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, parameters["vertical_line_kernel"]))
    horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel)
    vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel)
    line_mask = cv2.bitwise_or(horizontal, vertical)
    cleaned = cv2.subtract(binary, line_mask)
    return cleaned, line_mask


def extract_boxes_from_mask(mask: np.ndarray, source_branch: str, parameters: dict[str, Any]) -> tuple[list[CandidateBox], int]:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=parameters["connectivity"])
    boxes: list[CandidateBox] = []
    removed = 0
    for label_id in range(1, count):
        x = int(stats[label_id, cv2.CC_STAT_LEFT])
        y = int(stats[label_id, cv2.CC_STAT_TOP])
        w = int(stats[label_id, cv2.CC_STAT_WIDTH])
        h = int(stats[label_id, cv2.CC_STAT_HEIGHT])
        area = int(stats[label_id, cv2.CC_STAT_AREA])
        fill = area / max(w * h, 1)
        box = CandidateBox(x, y, w, h, area, round(fill, 4), source_branch)
        keep, _ = box_passes_basic_filter(box, mask.shape, parameters)
        if keep:
            boxes.append(box)
        else:
            removed += 1
    return boxes, removed


def extract_boxes_contours(mask: np.ndarray, source_branch: str, parameters: dict[str, Any]) -> tuple[list[CandidateBox], int]:
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes: list[CandidateBox] = []
    removed = 0
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = int(cv2.contourArea(contour))
        if area <= 0:
            area = int(np.count_nonzero(mask[y : y + h, x : x + w]))
        fill = area / max(w * h, 1)
        box = CandidateBox(x, y, w, h, area, round(fill, 4), source_branch)
        keep, _ = box_passes_basic_filter(box, mask.shape, parameters)
        if keep:
            boxes.append(box)
        else:
            removed += 1
    return boxes, removed


def extract_boxes_mser(gray: np.ndarray, parameters: dict[str, Any]) -> list[CandidateBox]:
    mser = cv2.MSER_create()
    regions, _ = mser.detectRegions(gray)
    boxes: list[CandidateBox] = []
    for region in regions:
        x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
        area = int(w * h)
        fill = len(region) / max(area, 1)
        box = CandidateBox(x, y, w, h, area, round(fill, 4), "mser")
        keep, _ = box_passes_basic_filter(box, gray.shape, parameters)
        if keep:
            boxes.append(box)
    return boxes


def filter_boxes(
    boxes: list[CandidateBox],
    image_shape: tuple[int, int],
    parameters: dict[str, Any],
) -> tuple[list[CandidateBox], int]:
    kept: list[CandidateBox] = []
    removed = 0
    for box in boxes:
        keep, reason = box_passes_basic_filter(box, image_shape, parameters)
        if keep:
            kept.append(box)
        else:
            box.removal_reason = reason
            removed += 1
    return kept, removed


def box_passes_basic_filter(
    box: CandidateBox,
    image_shape: tuple[int, int],
    parameters: dict[str, Any],
) -> tuple[bool, str | None]:
    image_height, image_width = image_shape[:2]
    max_area = parameters.get("max_area")
    if box.area < parameters["min_area"]:
        return False, "too_small"
    if max_area is not None and box.area > max_area:
        return False, "too_large"
    if box.width < parameters["min_width"] or box.height < parameters["min_height"]:
        return False, "too_small"
    if box.aspect_ratio < parameters["min_aspect_ratio"] or box.aspect_ratio > parameters["max_aspect_ratio"]:
        return False, "bad_aspect_ratio"
    if box.width > image_width * parameters["max_width_ratio"] or box.height > image_height * parameters["max_height_ratio"]:
        return False, "too_large"
    if box.fill_ratio < parameters["min_fill_ratio"]:
        return False, "possible_noise"
    return True, None


def merge_close_boxes(boxes: list[CandidateBox], parameters: dict[str, Any]) -> tuple[list[CandidateBox], int]:
    boxes = sorted(boxes, key=lambda b: (b.y, b.x))
    merged: list[CandidateBox] = []
    merge_count = 0
    used = [False] * len(boxes)
    for i, box in enumerate(boxes):
        if used[i]:
            continue
        current = replace(box)
        for j in range(i + 1, len(boxes)):
            other = boxes[j]
            if used[j]:
                continue
            gap = other.x - current.x2
            if 0 <= gap <= parameters["merge_x_gap"] and _y_overlap_ratio(current, other) >= parameters["merge_y_overlap_ratio"]:
                current = _union_boxes(current, other, source="merged")
                used[j] = True
                merge_count += 1
        merged.append(current)
    return merged, merge_count


def fuse_overlapping_boxes(boxes: list[CandidateBox], threshold: float) -> tuple[list[CandidateBox], int]:
    fused: list[CandidateBox] = []
    used = [False] * len(boxes)
    fusion_count = 0
    for i, box in enumerate(boxes):
        if used[i]:
            continue
        current = replace(box)
        for j in range(i + 1, len(boxes)):
            if used[j]:
                continue
            if _iou(current, boxes[j]) >= threshold:
                current = _union_boxes(current, boxes[j], source=f"{current.source_branch}+{boxes[j].source_branch}")
                used[j] = True
                fusion_count += 1
        fused.append(current)
    return fused, fusion_count


def nms_boxes(boxes: list[CandidateBox], threshold: float) -> list[CandidateBox]:
    result: list[CandidateBox] = []
    for box in sorted(boxes, key=lambda b: b.area, reverse=True):
        if all(_iou(box, kept) < threshold for kept in result):
            result.append(box)
    return result


def mark_possible_connected_characters(boxes: list[CandidateBox], parameters: dict[str, Any]) -> None:
    for box in boxes:
        if box.aspect_ratio > parameters["wide_box_aspect_threshold"]:
            box.status = "possible_connected_characters"


def split_wide_boxes(
    boxes: list[CandidateBox],
    mask: np.ndarray,
    parameters: dict[str, Any],
) -> list[CandidateBox]:
    output: list[CandidateBox] = []
    for box in boxes:
        if box.status != "possible_connected_characters":
            output.append(box)
            continue
        roi = mask[box.y : box.y2, box.x : box.x2]
        projection = np.count_nonzero(roi, axis=0)
        if projection.size < 6:
            output.append(box)
            continue
        valley = int(np.argmin(projection[2:-2])) + 2
        if projection[valley] > max(np.max(projection) * 0.15, 1):
            output.append(box)
            continue
        left_w = valley
        right_w = box.width - valley
        if left_w < parameters["min_width"] or right_w < parameters["min_width"]:
            output.append(box)
            continue
        output.append(CandidateBox(box.x, box.y, left_w, box.height, max(box.area // 2, 1), box.fill_ratio, f"{box.source_branch}_split"))
        output.append(CandidateBox(box.x + valley, box.y, right_w, box.height, max(box.area // 2, 1), box.fill_ratio, f"{box.source_branch}_split"))
    return output


def sort_boxes_reading_order(boxes: list[CandidateBox]) -> list[CandidateBox]:
    sorted_boxes = sorted(boxes, key=lambda b: (b.center_y, b.x))
    lines: list[list[CandidateBox]] = []
    for box in sorted_boxes:
        placed = False
        for line in lines:
            avg_y = sum(b.center_y for b in line) / len(line)
            avg_h = sum(b.height for b in line) / len(line)
            if abs(box.center_y - avg_y) <= max(avg_h * 0.55, 6):
                line.append(box)
                placed = True
                break
        if not placed:
            lines.append([box])
    output: list[CandidateBox] = []
    global_order = 1
    for line_index, line in enumerate(sorted(lines, key=lambda line: min(b.y for b in line)), start=1):
        for order_in_line, box in enumerate(sorted(line, key=lambda b: b.x), start=1):
            box.line_index = line_index
            box.order_in_line = order_in_line
            box.global_order = global_order
            output.append(box)
            global_order += 1
    return output


def save_crops_and_build_results(
    boxes: list[CandidateBox],
    original: np.ndarray,
    result_id: str,
    parameters: dict[str, Any],
) -> list[BoundingBoxResult]:
    results: list[BoundingBoxResult] = []
    height, width = original.shape[:2]
    padding = parameters["padding"]
    for index, box in enumerate(boxes, start=1):
        x1 = max(box.x - padding, 0)
        y1 = max(box.y - padding, 0)
        x2 = min(box.x2 + padding, width)
        y2 = min(box.y2 + padding, height)
        crop = original[y1:y2, x1:x2]
        crop_url = save_crop(result_id, index, crop)
        results.append(
            BoundingBoxResult(
                index=index,
                global_order=box.global_order or index,
                line_index=box.line_index or 1,
                order_in_line=box.order_in_line or index,
                x=x1,
                y=y1,
                width=max(x2 - x1, 1),
                height=max(y2 - y1, 1),
                area=box.area,
                aspect_ratio=round((x2 - x1) / max(y2 - y1, 1), 4),
                fill_ratio=round(box.fill_ratio, 4),
                status=box.status,
                source_branch=box.source_branch,
                crop_url=crop_url,
                label="?",
            )
        )
    return results


def save_crop(result_id: str, index: int, crop: np.ndarray) -> str:
    crop_dir = RESULTS_ROOT / result_id / "crops"
    crop_dir.mkdir(parents=True, exist_ok=True)
    write_png_image(crop_dir / f"{index}.png", crop, "crop")
    return f"/api/crops/{result_id}/{index}.png"


def generate_output_image(original: np.ndarray, boxes: list[BoundingBoxResult]) -> np.ndarray:
    output = original.copy()
    for box in boxes:
        color = (0, 255, 0)
        if box.status == "possible_connected_characters":
            color = (0, 165, 255)
        elif box.status not in {"candidate"}:
            color = (0, 0, 255)
        cv2.rectangle(output, (box.x, box.y), (box.x + box.width, box.y + box.height), color, 2)
        cv2.putText(output, str(box.index), (box.x, max(box.y - 5, 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)
    return output


def write_output_txt(result_dir: Path, boxes: list[BoundingBoxResult]) -> None:
    header = "index\tglobal_order\tline_index\torder_in_line\tx\ty\twidth\theight\tarea\taspect_ratio\tfill_ratio\tstatus\tsource_branch\tcrop_url"
    rows = [header]
    for box in boxes:
        rows.append(
            "\t".join(
                [
                    str(box.index),
                    str(box.global_order),
                    str(box.line_index),
                    str(box.order_in_line),
                    str(box.x),
                    str(box.y),
                    str(box.width),
                    str(box.height),
                    str(box.area),
                    f"{box.aspect_ratio:.4f}",
                    f"{box.fill_ratio:.4f}",
                    box.status,
                    box.source_branch or "",
                    box.crop_url or "",
                ]
            )
        )
    (result_dir / "output.txt").write_text("\n".join(rows), encoding="utf-8")


def generate_components_visualization(mask: np.ndarray, connectivity: int) -> np.ndarray:
    count, labels = cv2.connectedComponents(mask, connectivity=connectivity)
    visualization = np.full((*labels.shape, 3), 255, dtype=np.uint8)
    for label in range(1, count):
        color = np.array([(37 * label) % 255, (97 * label) % 255, (173 * label) % 255], dtype=np.uint8)
        visualization[labels == label] = color
    return visualization


def draw_boxes(image: np.ndarray, boxes: list[CandidateBox], show_label: bool = True) -> np.ndarray:
    output = image.copy()
    for index, box in enumerate(boxes, start=1):
        color = (0, 165, 255) if box.status == "possible_connected_characters" else (0, 255, 0)
        cv2.rectangle(output, (box.x, box.y), (box.x2, box.y2), color, 1)
        if show_label:
            cv2.putText(output, str(index), (box.x, max(box.y - 4, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
    return output


def write_pipeline_images(result_dir: Path, stages: dict[str, np.ndarray | None]) -> None:
    for stage, image in stages.items():
        if image is None:
            continue
        filename = PIPELINE_IMAGE_FILENAMES.get(stage)
        if filename:
            write_png_image(result_dir / filename, image, stage)


def build_pipeline_urls(base_url: str, result_id: str, stages: dict[str, np.ndarray | None]) -> PipelineImages:
    values = {}
    for stage in PIPELINE_IMAGE_FILENAMES:
        key = f"{stage}_url"
        values[key] = f"{base_url}/api/images/{stage}/{result_id}" if stages.get(stage) is not None else None
    return PipelineImages(**values)


def get_pipeline_image_path(result_id: str, stage: str) -> Path:
    _validate_result_id(result_id)
    filename = PIPELINE_IMAGE_FILENAMES.get(stage)
    if filename is None:
        raise HTTPException(status_code=404, detail="Pipeline image stage not found.")
    image_path = (RESULTS_ROOT / result_id / filename).resolve()
    _assert_inside_results(image_path)
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Pipeline image not found.")
    return image_path


def get_crop_image_path(result_id: str, index: int) -> Path:
    _validate_result_id(result_id)
    crop_path = (RESULTS_ROOT / result_id / "crops" / f"{index}.png").resolve()
    _assert_inside_results(crop_path)
    if not crop_path.is_file():
        raise HTTPException(status_code=404, detail="Crop image not found.")
    return crop_path


def write_png_image(path: Path, image: np.ndarray, stage: str) -> None:
    success, encoded = cv2.imencode(".png", image)
    if not success:
        raise HTTPException(status_code=500, detail=f"Could not encode {stage} image.")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encoded.tobytes())


def build_statistics(
    boxes: list[BoundingBoxResult],
    removed_noise_components: int,
    merged_count: int,
    foreground_mask: np.ndarray,
    grayscale: np.ndarray,
    branch_count: int,
    processing_time_ms: int,
) -> ProcessStatistics:
    areas = np.array([box.area for box in boxes], dtype=np.float32) if boxes else np.array([], dtype=np.float32)
    possible_connected = sum(1 for box in boxes if box.status == "possible_connected_characters")
    return ProcessStatistics(
        candidate_boxes=len(boxes),
        removed_noise_components=removed_noise_components,
        possible_connected_characters=possible_connected,
        merged_boxes=merged_count,
        average_box_area=round(float(np.mean(areas)), 3) if areas.size else 0.0,
        median_box_area=round(float(np.median(areas)), 3) if areas.size else 0.0,
        foreground_ratio=round(float(np.count_nonzero(foreground_mask)) / float(foreground_mask.size), 5),
        noise_component_count=removed_noise_components,
        blur_score_laplacian_var=round(float(cv2.Laplacian(grayscale, cv2.CV_64F).var()), 3),
        contrast_score_std=round(float(np.std(grayscale)), 3),
        branch_count=branch_count,
        processing_time_ms=processing_time_ms,
    )


def generate_system_comment(statistics: ProcessStatistics, parameters: dict[str, Any]) -> str:
    comments = [
        "Advanced Classical CV pipeline completed. Output is candidate bounding boxes only; recognition is disabled and no trained model is used."
    ]
    if statistics.blur_score_laplacian_var < 80:
        comments.append("Image may be blurry. Try resize_scale=2.0, sharpen_method=unsharp, or denoise_method=nlm.")
    if statistics.noise_component_count > max(statistics.candidate_boxes * 2, 20):
        comments.append("Many small components were filtered. Try median/NLM denoising, morphology opening, or a higher min_area.")
    if statistics.foreground_ratio > 0.45:
        comments.append("Foreground is dense. Check invert, threshold_method, closing, and dilation settings.")
    if statistics.foreground_ratio < 0.01:
        comments.append("Foreground is sparse. Try adaptive/Sauvola thresholding or lower manual_threshold.")
    if statistics.possible_connected_characters:
        comments.append("Some boxes may contain connected characters. Reduce closing/dilation or enable split_wide_boxes.")
    if not parameters["remove_lines"] and statistics.candidate_boxes > 0:
        comments.append("If the image has table/grid lines, try the Table Lines preset with remove_lines enabled.")
    return " ".join(comments)


def _kernel(parameters: dict[str, Any]) -> np.ndarray:
    shape = {
        "rect": cv2.MORPH_RECT,
        "ellipse": cv2.MORPH_ELLIPSE,
        "cross": cv2.MORPH_CROSS,
    }[parameters["kernel_shape"]]
    return cv2.getStructuringElement(shape, tuple(parameters["kernel_size"]))


def _union_boxes(a: CandidateBox, b: CandidateBox, source: str) -> CandidateBox:
    x1, y1 = min(a.x, b.x), min(a.y, b.y)
    x2, y2 = max(a.x2, b.x2), max(a.y2, b.y2)
    area = a.area + b.area
    fill = area / max((x2 - x1) * (y2 - y1), 1)
    return CandidateBox(x1, y1, x2 - x1, y2 - y1, area, round(fill, 4), source, status="candidate")


def _iou(a: CandidateBox, b: CandidateBox) -> float:
    x1, y1 = max(a.x, b.x), max(a.y, b.y)
    x2, y2 = min(a.x2, b.x2), min(a.y2, b.y2)
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    union = a.width * a.height + b.width * b.height - inter
    return inter / max(union, 1)


def _y_overlap_ratio(a: CandidateBox, b: CandidateBox) -> float:
    overlap = max(0, min(a.y2, b.y2) - max(a.y, b.y))
    return overlap / max(min(a.height, b.height), 1)


def _normalize_u8(image: np.ndarray) -> np.ndarray:
    return cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def _validate_result_id(result_id: str) -> None:
    if "/" in result_id or "\\" in result_id or not result_id:
        raise HTTPException(status_code=400, detail="Invalid result_id.")


def _assert_inside_results(path: Path) -> None:
    root = RESULTS_ROOT.resolve()
    if path != root and root not in path.parents:
        raise HTTPException(status_code=400, detail="Invalid result path.")


def _choice(name: str, value: Any, allowed: set[str]) -> str:
    parsed = str(value).lower()
    if parsed not in allowed:
        raise HTTPException(status_code=400, detail=f"{name} must be one of: {', '.join(sorted(allowed))}.")
    return parsed


def _parse_int(name: str, value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"{name} must be an integer.") from exc


def _parse_float(name: str, value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"{name} must be a number.") from exc


def _min_int(name: str, value: Any, minimum: int) -> int:
    parsed = _parse_int(name, value)
    if parsed < minimum:
        raise HTTPException(status_code=400, detail=f"{name} must be >= {minimum}.")
    return parsed


def _min_float(name: str, value: Any, minimum: float) -> float:
    parsed = _parse_float(name, value)
    if parsed < minimum:
        raise HTTPException(status_code=400, detail=f"{name} must be >= {minimum}.")
    return parsed


def _allowed_int(name: str, value: Any, allowed: set[int]) -> int:
    parsed = _parse_int(name, value)
    if parsed not in allowed:
        raise HTTPException(status_code=400, detail=f"{name} must be one of: {', '.join(str(v) for v in sorted(allowed))}.")
    return parsed


def _odd_min_int(name: str, value: Any, minimum: int) -> int:
    parsed = _min_int(name, value, minimum)
    if parsed % 2 == 0:
        raise HTTPException(status_code=400, detail=f"{name} must be odd and >= {minimum}.")
    return parsed


def _size_pair(name: str, value: Any) -> list[int]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise HTTPException(status_code=400, detail=f"{name} must be [width, height].")
    return [_min_int(f"{name}[0]", value[0], 1), _min_int(f"{name}[1]", value[1], 1)]


def _string_list(name: str, value: Any) -> list[str]:
    if not isinstance(value, list):
        raise HTTPException(status_code=400, detail=f"{name} must be a list.")
    return [str(item) for item in value]
