from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from fastapi import HTTPException, status


BACKEND_ROOT = Path(__file__).resolve().parents[2]
RESULTS_ROOT = BACKEND_ROOT / "storage" / "results"

PIPELINE_IMAGE_FILENAMES = {
    "original": "original.png",
    "grayscale": "grayscale.png",
    "binary": "binary.png",
    "morphology": "morphology.png",
}


@dataclass(frozen=True)
class DecodedImage:
    image: np.ndarray
    width: int
    height: int
    channels: int


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

    return DecodedImage(
        image=image,
        width=width,
        height=height,
        channels=channels,
    )


@dataclass(frozen=True)
class InitialPipelineImages:
    original_url: str
    grayscale_url: str
    binary_url: str
    morphology_url: str


def save_initial_pipeline_images(
    result_id: str,
    decoded_image: DecodedImage,
    base_url: str,
) -> InitialPipelineImages:
    result_dir = RESULTS_ROOT / result_id
    result_dir.mkdir(parents=True, exist_ok=True)

    original_path = result_dir / PIPELINE_IMAGE_FILENAMES["original"]
    grayscale_path = result_dir / PIPELINE_IMAGE_FILENAMES["grayscale"]
    binary_path = result_dir / PIPELINE_IMAGE_FILENAMES["binary"]
    morphology_path = result_dir / PIPELINE_IMAGE_FILENAMES["morphology"]

    grayscale_image = cv2.cvtColor(decoded_image.image, cv2.COLOR_BGR2GRAY)
    _, binary_image = cv2.threshold(
        grayscale_image,
        0,
        255,
        cv2.THRESH_BINARY | cv2.THRESH_OTSU,
    )
    morphology_image = apply_default_morphology(binary_image)

    write_png_image(original_path, decoded_image.image, "original")
    write_png_image(grayscale_path, grayscale_image, "grayscale")
    write_png_image(binary_path, binary_image, "binary")
    write_png_image(morphology_path, morphology_image, "morphology")

    return InitialPipelineImages(
        original_url=f"{base_url}/api/images/original/{result_id}",
        grayscale_url=f"{base_url}/api/images/grayscale/{result_id}",
        binary_url=f"{base_url}/api/images/binary/{result_id}",
        morphology_url=f"{base_url}/api/images/morphology/{result_id}",
    )


def get_pipeline_image_path(result_id: str, stage: str) -> Path:
    filename = PIPELINE_IMAGE_FILENAMES.get(stage)
    if filename is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline image stage not found.",
        )

    image_path = (RESULTS_ROOT / result_id / filename).resolve()
    results_root = RESULTS_ROOT.resolve()

    if results_root not in image_path.parents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result image path.",
        )

    if not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline image not found.",
        )

    return image_path


def raise_save_error(stage: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Could not save {stage} pipeline image.",
    )


def write_png_image(path: Path, image: np.ndarray, stage: str) -> None:
    success, encoded_image = cv2.imencode(".png", image)
    if not success:
        raise_save_error(stage)

    try:
        path.write_bytes(encoded_image.tobytes())
    except OSError:
        raise_save_error(stage)


def apply_default_morphology(binary_image: np.ndarray) -> np.ndarray:
    foreground = cv2.bitwise_not(binary_image)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned_foreground = cv2.morphologyEx(foreground, cv2.MORPH_OPEN, kernel)
    return cv2.bitwise_not(cleaned_foreground)
