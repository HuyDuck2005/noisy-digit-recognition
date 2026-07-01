from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import HTTPException, status

from app.schemas.process import BoundingBoxResult, RecognitionCandidate


BACKEND_ROOT = Path(__file__).resolve().parents[2]
RESULTS_ROOT = BACKEND_ROOT / "storage" / "results"

PIPELINE_IMAGE_FILENAMES = {
    "original": "original.png",
    "grayscale": "grayscale.png",
    "denoised": "denoised.png",
    "binary": "binary.png",
    "morphology": "morphology.png",
    "components": "components.png",
    "output": "output.png",
}

MOCK_LABELS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


@dataclass(frozen=True)
class DecodedImage:
    image: np.ndarray
    width: int
    height: int
    channels: int


@dataclass(frozen=True)
class PipelineImages:
    original_url: str
    grayscale_url: str
    denoised_url: str
    binary_url: str
    morphology_url: str
    components_url: str
    output_url: str


@dataclass(frozen=True)
class PipelineOutput:
    images: PipelineImages
    boxes: list[BoundingBoxResult]
    noise_component_count: int
    foreground_ratio: float


@dataclass
class _Component:
    x: int
    y: int
    width: int
    height: int
    area: int
    label_id: int
    merged: bool = False

    @property
    def x2(self) -> int:
        return self.x + self.width

    @property
    def y2(self) -> int:
        return self.y + self.height

    @property
    def cx(self) -> float:
        return self.x + self.width / 2

    @property
    def cy(self) -> float:
        return self.y + self.height / 2

    def union(self, other: "_Component") -> None:
        x1 = min(self.x, other.x)
        y1 = min(self.y, other.y)
        x2 = max(self.x2, other.x2)
        y2 = max(self.y2, other.y2)
        self.x = x1
        self.y = y1
        self.width = x2 - x1
        self.height = y2 - y1
        self.area += other.area
        other.merged = True


def decode_uploaded_image(content: bytes) -> DecodedImage:
    image_buffer = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file could not be decoded as an image.",
        )

    height, width = image.shape[:2]
    channels = image.shape[2] if image.ndim == 3 else 1
    return DecodedImage(image=image, width=width, height=height, channels=channels)


def apply_blur(gray: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    blur_type = str(parameters.get("blur_type", "median")).lower()
    kernel = _odd_int(parameters.get("blur_kernel", 3), default=3)

    if blur_type == "none" or kernel <= 1:
        return gray.copy()
    if blur_type == "median":
        return cv2.medianBlur(gray, kernel)
    if blur_type == "gaussian":
        return cv2.GaussianBlur(gray, (kernel, kernel), 0)
    if blur_type == "bilateral":
        return cv2.bilateralFilter(gray, kernel, 75, 75)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported blur_type: {blur_type}",
    )


def apply_threshold(gray_or_denoised: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    mode = str(parameters.get("threshold_mode", "otsu")).lower()
    invert = bool(parameters.get("invert", True))
    threshold_type = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY

    if mode == "otsu":
        _, binary = cv2.threshold(
            gray_or_denoised,
            0,
            255,
            threshold_type | cv2.THRESH_OTSU,
        )
        return binary

    if mode == "manual":
        threshold = int(parameters.get("manual_threshold", 128))
        _, binary = cv2.threshold(gray_or_denoised, threshold, 255, threshold_type)
        return binary

    if mode == "adaptive":
        block_size = _odd_int(parameters.get("adaptive_block_size", 31), default=31)
        adaptive_c = int(parameters.get("adaptive_c", 11))
        return cv2.adaptiveThreshold(
            gray_or_denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            threshold_type,
            block_size,
            adaptive_c,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported threshold_mode: {mode}",
    )


def apply_morphology(binary: np.ndarray, parameters: dict[str, Any]) -> np.ndarray:
    mode = str(parameters.get("morphology_mode", "open_close")).lower()
    kernel_width, kernel_height = _kernel_size(parameters.get("kernel_size", [2, 2]))
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_width, kernel_height))
    result = binary.copy()

    if mode == "none":
        pass
    elif mode == "opening":
        result = cv2.morphologyEx(result, cv2.MORPH_OPEN, kernel)
    elif mode == "closing":
        result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel)
    elif mode == "open_close":
        result = cv2.morphologyEx(result, cv2.MORPH_OPEN, kernel)
        result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel)
    elif mode == "close_open":
        result = cv2.morphologyEx(result, cv2.MORPH_CLOSE, kernel)
        result = cv2.morphologyEx(result, cv2.MORPH_OPEN, kernel)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported morphology_mode: {mode}",
        )

    dilation_iterations = int(parameters.get("dilation_iterations", 0))
    erosion_iterations = int(parameters.get("erosion_iterations", 0))
    if dilation_iterations > 0:
        result = cv2.dilate(result, kernel, iterations=dilation_iterations)
    if erosion_iterations > 0:
        result = cv2.erode(result, kernel, iterations=erosion_iterations)

    return result


def extract_connected_component_boxes(
    morphology_image: np.ndarray,
    original_image: np.ndarray,
    result_id: str,
    parameters: dict[str, Any],
) -> tuple[list[BoundingBoxResult], int]:
    connectivity = int(parameters.get("connectivity", 8))
    component_count, labels, stats, _ = cv2.connectedComponentsWithStats(
        morphology_image,
        connectivity=connectivity,
    )

    raw_components = [
        _Component(
            x=int(stats[i, cv2.CC_STAT_LEFT]),
            y=int(stats[i, cv2.CC_STAT_TOP]),
            width=int(stats[i, cv2.CC_STAT_WIDTH]),
            height=int(stats[i, cv2.CC_STAT_HEIGHT]),
            area=int(stats[i, cv2.CC_STAT_AREA]),
            label_id=i,
        )
        for i in range(1, component_count)
    ]

    min_area = int(parameters.get("min_area", 50))
    max_area = parameters.get("max_area")
    min_width = int(parameters.get("min_width", 2))
    min_height = int(parameters.get("min_height", 5))
    padding = int(parameters.get("padding", 2))

    base_components = [
        c
        for c in raw_components
        if c.area >= min_area and c.width >= min_width and c.height >= min_height
    ]
    small_components = [c for c in raw_components if c not in base_components]

    for small in small_components:
        target = _nearest_grapheme_base(small, base_components)
        if target is not None:
            target.union(small)

    boxes: list[BoundingBoxResult] = []
    noise_component_count = 0
    output_index = 1
    image_height, image_width = morphology_image.shape[:2]

    for component in sorted(base_components, key=lambda c: (c.y // 16, c.x)):
        if component.merged:
            continue
        if max_area is not None and component.area > int(max_area):
            noise_component_count += 1
            continue

        x1 = max(component.x - padding, 0)
        y1 = max(component.y - padding, 0)
        x2 = min(component.x2 + padding, image_width)
        y2 = min(component.y2 + padding, image_height)
        width = x2 - x1
        height = y2 - y1
        if width <= 0 or height <= 0:
            noise_component_count += 1
            continue

        crop_mask = morphology_image[y1:y2, x1:x2]
        crop_original = original_image[y1:y2, x1:x2]
        crop_url = save_crop(result_id, output_index, crop_original)
        foreground_ratio = round(_foreground_ratio(crop_mask), 4)
        label, confidence, top_k = _predict_mock_deterministic(
            crop_mask,
            component.area,
            width / max(height, 1),
            foreground_ratio,
        )
        status_value = "low_confidence" if confidence < 0.60 else "normal"

        boxes.append(
            BoundingBoxResult(
                index=output_index,
                x=x1,
                y=y1,
                width=width,
                height=height,
                area=component.area,
                aspect_ratio=round(width / max(height, 1), 3),
                label=label,
                confidence=confidence,
                status=status_value,
                crop_url=crop_url,
                top_k=top_k,
                foreground_ratio=foreground_ratio,
            )
        )
        output_index += 1

    noise_component_count += sum(1 for component in small_components if not component.merged)
    return boxes, noise_component_count


def generate_components_visualization(
    morphology_image: np.ndarray,
    connectivity: int = 8,
) -> np.ndarray:
    component_count, labels = cv2.connectedComponents(morphology_image, connectivity=connectivity)
    visualization = np.full((*labels.shape, 3), 255, dtype=np.uint8)

    for label in range(1, component_count):
        color = np.array(
            [(37 * label) % 255, (97 * label) % 255, (173 * label) % 255],
            dtype=np.uint8,
        )
        visualization[labels == label] = color

    return visualization


def save_crop(result_id: str, index: int, crop: np.ndarray) -> str:
    crop_dir = RESULTS_ROOT / result_id / "crops"
    crop_dir.mkdir(parents=True, exist_ok=True)
    crop_path = crop_dir / f"{index}.png"
    write_png_image(crop_path, crop, "crop")
    return f"/api/crops/{result_id}/{index}.png"


def generate_output_artifacts(
    result_id: str,
    original_image: np.ndarray,
    boxes: list[BoundingBoxResult],
) -> None:
    result_dir = RESULTS_ROOT / result_id
    result_dir.mkdir(parents=True, exist_ok=True)
    output_image = original_image.copy()

    txt_lines = ["index\tx\ty\twidth\theight\tarea\taspect_ratio\tlabel\tconfidence\tstatus"]
    for box in boxes:
        color = (0, 255, 0) if box.status == "normal" else (0, 165, 255)
        cv2.rectangle(
            output_image,
            (box.x, box.y),
            (box.x + box.width, box.y + box.height),
            color,
            2,
        )
        cv2.putText(
            output_image,
            f"{box.label} {box.confidence:.2f}",
            (box.x, max(box.y - 6, 12)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA,
        )
        txt_lines.append(
            "\t".join(
                [
                    str(box.index),
                    str(box.x),
                    str(box.y),
                    str(box.width),
                    str(box.height),
                    str(box.area),
                    f"{box.aspect_ratio:.3f}",
                    box.label,
                    f"{box.confidence:.3f}",
                    box.status,
                ]
            )
        )

    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["output"], output_image, "output")
    (result_dir / "output.txt").write_text("\n".join(txt_lines), encoding="utf-8")


def save_pipeline_images(
    result_id: str,
    decoded_image: DecodedImage,
    base_url: str,
    parameters: dict[str, Any],
) -> PipelineOutput:
    result_dir = RESULTS_ROOT / result_id
    result_dir.mkdir(parents=True, exist_ok=True)

    original = decoded_image.image
    grayscale = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
    denoised = apply_blur(grayscale, parameters)
    binary = apply_threshold(denoised, parameters)
    morphology = apply_morphology(binary, parameters)
    components = generate_components_visualization(
        morphology,
        connectivity=int(parameters.get("connectivity", 8)),
    )
    boxes, noise_count = extract_connected_component_boxes(
        morphology,
        original,
        result_id,
        parameters,
    )
    generate_output_artifacts(result_id, original, boxes)

    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["original"], original, "original")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["grayscale"], grayscale, "grayscale")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["denoised"], denoised, "denoised")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["binary"], binary, "binary")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["morphology"], morphology, "morphology")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["components"], components, "components")

    clean_base_url = base_url.rstrip("/")
    images = PipelineImages(
        original_url=f"{clean_base_url}/api/images/original/{result_id}",
        grayscale_url=f"{clean_base_url}/api/images/grayscale/{result_id}",
        denoised_url=f"{clean_base_url}/api/images/denoised/{result_id}",
        binary_url=f"{clean_base_url}/api/images/binary/{result_id}",
        morphology_url=f"{clean_base_url}/api/images/morphology/{result_id}",
        components_url=f"{clean_base_url}/api/images/components/{result_id}",
        output_url=f"{clean_base_url}/api/images/output/{result_id}",
    )

    return PipelineOutput(
        images=images,
        boxes=boxes,
        noise_component_count=noise_count,
        foreground_ratio=round(_foreground_ratio(morphology), 4),
    )


def get_pipeline_image_path(result_id: str, stage: str) -> Path:
    filename = PIPELINE_IMAGE_FILENAMES.get(stage)
    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline image stage not found.",
        )

    image_path = (RESULTS_ROOT / result_id / filename).resolve()
    _assert_inside_results(image_path)

    if not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline image not found.",
        )

    return image_path


def get_crop_image_path(result_id: str, index: int) -> Path:
    crop_path = (RESULTS_ROOT / result_id / "crops" / f"{index}.png").resolve()
    _assert_inside_results(crop_path)

    if not crop_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop image not found.",
        )

    return crop_path


def write_png_image(path: Path, image: np.ndarray, stage: str) -> None:
    success, encoded_image = cv2.imencode(".png", image)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not encode {stage} pipeline image.",
        )

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(encoded_image.tobytes())
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save {stage} pipeline image.",
        ) from exc


def save_initial_pipeline_images(
    result_id: str,
    decoded_image: DecodedImage,
    base_url: str,
    parameters: dict[str, Any],
) -> tuple[PipelineImages, list[BoundingBoxResult], int]:
    output = save_pipeline_images(result_id, decoded_image, base_url, parameters)
    return output.images, output.boxes, output.noise_component_count


def _predict_mock_deterministic(
    crop_mask: np.ndarray,
    area: int,
    aspect_ratio: float,
    foreground_ratio: float,
) -> tuple[str, float, list[RecognitionCandidate]]:
    digest = sha256(
        crop_mask.tobytes()
        + str(crop_mask.shape).encode("ascii")
        + str(area).encode("ascii")
    ).digest()
    start = digest[0] % len(MOCK_LABELS)
    ratio_score = max(0.0, 1.0 - min(abs(aspect_ratio - 0.7), 1.0))
    area_score = min(area / 1200.0, 1.0)
    density_score = min(foreground_ratio * 2.5, 1.0)
    hash_score = digest[1] / 255.0
    confidence = 0.40 + 0.22 * area_score + 0.14 * ratio_score + 0.14 * density_score + 0.05 * hash_score
    confidence = round(min(max(confidence, 0.40), 0.95), 3)

    candidates: list[RecognitionCandidate] = []
    for offset, delta in enumerate((0.0, 0.11, 0.22)):
        label = MOCK_LABELS[(start + offset * 7) % len(MOCK_LABELS)]
        candidates.append(
            RecognitionCandidate(
                label=label,
                confidence=round(max(confidence - delta, 0.01), 3),
            )
        )

    return candidates[0].label, candidates[0].confidence, candidates


def _nearest_grapheme_base(
    small: _Component,
    base_components: list[_Component],
) -> _Component | None:
    best: _Component | None = None
    best_score = float("inf")

    for base in base_components:
        expanded_x1 = base.x - max(4, int(base.width * 0.45))
        expanded_x2 = base.x2 + max(4, int(base.width * 0.45))
        above_or_inside = small.y2 >= base.y - max(8, int(base.height * 0.75)) and small.y <= base.y2
        horizontal_match = expanded_x1 <= small.cx <= expanded_x2
        if not above_or_inside or not horizontal_match:
            continue

        score = abs(small.cx - base.cx) + max(0, base.y - small.y2)
        if score < best_score:
            best_score = score
            best = base

    return best


def _foreground_ratio(mask: np.ndarray) -> float:
    if mask.size == 0:
        return 0.0
    return float(np.count_nonzero(mask)) / float(mask.size)


def _odd_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if parsed % 2 == 0:
        parsed += 1
    return max(parsed, 1)


def _kernel_size(value: Any) -> tuple[int, int]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return (2, 2)
    width = max(int(value[0]), 1)
    height = max(int(value[1]), 1)
    return width, height


def _assert_inside_results(path: Path) -> None:
    results_root = RESULTS_ROOT.resolve()
    if path != results_root and results_root not in path.parents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result path.",
        )
