from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.services.advanced_image_processing_service import get_crop_image_path, get_pipeline_image_path


router = APIRouter()


@router.get("/images/{stage}/{result_id}")
def get_pipeline_image(stage: str, result_id: str) -> FileResponse:
    image_path = get_pipeline_image_path(result_id=result_id, stage=stage)
    return FileResponse(image_path, media_type="image/png")


@router.get("/crops/{result_id}/{index}.png")
def get_crop_image_png(result_id: str, index: int) -> FileResponse:
    image_path = get_crop_image_path(result_id=result_id, index=index)
    return FileResponse(image_path, media_type="image/png")


@router.get("/crops/{result_id}/{index}")
def get_crop_image(result_id: str, index: int) -> FileResponse:
    image_path = get_crop_image_path(result_id=result_id, index=index)
    return FileResponse(image_path, media_type="image/png")
