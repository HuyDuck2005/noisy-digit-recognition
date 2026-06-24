from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple
import cv2
import numpy as np
from fastapi import HTTPException, status
from app.schemas.process import BoundingBoxResult

BACKEND_ROOT = Path(__file__).resolve().parents[2]
RESULTS_ROOT = BACKEND_ROOT / "storage" / "results"

PIPELINE_IMAGE_FILENAMES = {
    "original": "original.png",
    "grayscale": "grayscale.png",
    "binary": "binary.png",
    "morphology": "morphology.png",
    "components": "components.png",
    "output": "output.png",  # Thêm ảnh output thật
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

    return DecodedImage(image=image, width=width, height=height, channels=channels)

def predict_character_cnn(crop_img: np.ndarray) -> Tuple[str, float]:
    """
    Khung sườn tích hợp model CNN của bạn.
    Hiện tại trả về nhãn ngẫu nhiên để test toàn bộ luồng pipeline thật.
    """
    mock_labels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    chosen_label = str(np.random.choice(mock_labels))
    confidence = float(np.random.uniform(0.70, 0.99))
    return chosen_label, confidence

def extract_real_bounding_boxes(
    morphology_image: np.ndarray, 
    result_id: str, 
    min_area: int = 50
) -> Tuple[List[BoundingBoxResult], int]:
    """
    Trích xuất các vùng liên thông thật bằng Connected Components With Stats của OpenCV
    """
    foreground = cv2.bitwise_not(morphology_image)
    component_count, labels, stats, _ = cv2.connectedComponentsWithStats(
        foreground, connectivity=8
    )

    boxes = []
    index = 1
    noise_component_count = 0

    for i in range(1, component_count):
        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        w = int(stats[i, cv2.CC_STAT_WIDTH])
        h = int(stats[i, cv2.CC_STAT_HEIGHT])
        area = int(stats[i, cv2.CC_STAT_AREA])

        if area < min_area:
            noise_component_count += 1
            continue

        # Cắt ký tự đơn lẻ
        crop_img = foreground[y:y+h, x:x+w]
        label, confidence = predict_character_cnn(crop_img)
        box_status = "normal" if confidence >= 0.6 else "low_confidence"

        boxes.append(
            BoundingBoxResult(
                index=index,
                x=x,
                y=y,
                width=w,
                height=h,
                area=area,
                aspect_ratio=round(w / h, 2),
                label=label,
                confidence=round(confidence, 2),
                status=box_status,
                crop_url=f"/api/crops/{result_id}/{index}.png",
            )
        )
        index += 1

    return boxes, noise_component_count

def generate_output_artifacts(
    result_id: str, 
    original_image: np.ndarray, 
    boxes: List[BoundingBoxResult]
) -> None:
    """
    Vẽ bounding box lên ảnh gốc và TẠO FILE output.txt THẬT
    """
    result_dir = RESULTS_ROOT / result_id
    output_image = original_image.copy()
    txt_lines = []

    for box in boxes:
        # 1. Vẽ box & text lên ảnh
        color = (0, 255, 0) if box.status == "normal" else (0, 165, 255)
        cv2.rectangle(output_image, (box.x, box.y), (box.x + box.width, box.y + box.height), color, 2)
        cv2.putText(output_image, f"{box.label}", (box.x, max(box.y - 5, 10)), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # 2. Thu thập data đưa vào file .txt
        txt_lines.append(f"{box.index}\t{box.x}\t{box.y}\t{box.width}\t{box.height}\t{box.label}\t{box.confidence}")

    # Ghi ảnh kết quả cuối cùng
    output_path = result_dir / PIPELINE_IMAGE_FILENAMES["output"]
    cv2.imwrite(str(output_path), output_image)

    # TẠO VÀ GHI FILE output.txt XUỐNG Ổ ĐĨA
    txt_path = result_dir / "output.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("index\tx\ty\twidth\theight\tlabel\tconfidence\n")
        f.write("\n".join(txt_lines))

@dataclass(frozen=True)
class InitialPipelineImages:
    original_url: str
    grayscale_url: str
    binary_url: str
    morphology_url: str
    components_url: str
    output_url: str

def save_initial_pipeline_images(
    result_id: str,
    decoded_image: DecodedImage,
    base_url: str,
    parameters: dict,
) -> Tuple[InitialPipelineImages, List[BoundingBoxResult], int]:
    result_dir = RESULTS_ROOT / result_id
    result_dir.mkdir(parents=True, exist_ok=True)

    grayscale_image = cv2.cvtColor(decoded_image.image, cv2.COLOR_BGR2GRAY)
    _, binary_image = cv2.threshold(
        grayscale_image, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU
    )
    morphology_image = apply_default_morphology(binary_image)
    components_image = build_connected_components_image(morphology_image)

    # Tính toán bounding boxes thật & Tạo file kết quả văn bản + Vẽ ảnh
    min_area = parameters.get("min_area", 50)
    boxes, noise_count = extract_real_bounding_boxes(morphology_image, result_id, min_area)
    generate_output_artifacts(result_id, decoded_image.image, boxes)

    # Ghi lưu các file ảnh trung gian
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["original"], decoded_image.image, "original")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["grayscale"], grayscale_image, "grayscale")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["binary"], binary_image, "binary")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["morphology"], morphology_image, "morphology")
    write_png_image(result_dir / PIPELINE_IMAGE_FILENAMES["components"], components_image, "components")

    return InitialPipelineImages(
        original_url=f"{base_url}/api/images/original/{result_id}",
        grayscale_url=f"{base_url}/api/images/grayscale/{result_id}",
        binary_url=f"{base_url}/api/images/binary/{result_id}",
        morphology_url=f"{base_url}/api/images/morphology/{result_id}",
        components_url=f"{base_url}/api/images/components/{result_id}",
        output_url=f"{base_url}/api/images/output/{result_id}",
    ), boxes, noise_count

def get_pipeline_image_path(result_id: str, stage: str) -> Path:
    filename = PIPELINE_IMAGE_FILENAMES.get(stage)
    if filename is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline image stage not found.")

    image_path = (RESULTS_ROOT / result_id / filename).resolve()
    if RESULTS_ROOT.resolve() not in image_path.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid result image path.")

    if not image_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline image not found.")

    return image_path

def write_png_image(path: Path, image: np.ndarray, stage: str) -> None:
    success, encoded_image = cv2.imencode(".png", image)
    if not success:
        raise HTTPException(status_code=500, detail=f"Could not save {stage} pipeline image.")
    try:
        path.write_bytes(encoded_image.tobytes())
    except OSError:
        raise HTTPException(status_code=500, detail=f"Could not save {stage} pipeline image.")

def apply_default_morphology(binary_image: np.ndarray) -> np.ndarray:
    foreground = cv2.bitwise_not(binary_image)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned_foreground = cv2.morphologyEx(foreground, cv2.MORPH_OPEN, kernel)
    return cv2.bitwise_not(cleaned_foreground)

def build_connected_components_image(morphology_image: np.ndarray) -> np.ndarray:
    foreground = cv2.bitwise_not(morphology_image)
    component_count, labels = cv2.connectedComponents(foreground, connectivity=8)

    visualization = np.full((*labels.shape, 3), 255, dtype=np.uint8)
    for label in range(1, component_count):
        color = np.array([(37 * label) % 255, (97 * label) % 255, (173 * label) % 255], dtype=np.uint8)
        visualization[labels == label] = color

    return visualization