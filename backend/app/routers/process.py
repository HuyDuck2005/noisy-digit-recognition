# Thêm vào cuối file backend/app/routers/process.py

from fastapi.responses import FileResponse
from app.services.image_processing_service import RESULTS_ROOT

@router.get("/output-txt/{result_id}")
async def get_output_text_file(result_id: str) -> FileResponse:
    txt_path = (RESULTS_ROOT / result_id / "output.txt").resolve()
    results_root = RESULTS_ROOT.resolve()

    if results_root not in txt_path.parents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result path.",
        )

    if not txt_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output text file not found for this execution.",
        )

    return FileResponse(
        path=txt_path, 
        media_type="text/plain", 
        filename=f"{result_id}_output.txt"
    )