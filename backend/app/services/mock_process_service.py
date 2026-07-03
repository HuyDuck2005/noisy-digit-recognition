from app.services.advanced_image_processing_service import (
    ALLOWED_CONTENT_TYPES,
    DEFAULT_PARAMETERS,
    MAX_UPLOAD_SIZE_BYTES,
    create_process_result,
    validate_image_upload,
    validate_parameters,
)


def create_mock_process_result(*args, **kwargs):
    return create_process_result(*args, **kwargs)


__all__ = [
    "ALLOWED_CONTENT_TYPES",
    "DEFAULT_PARAMETERS",
    "MAX_UPLOAD_SIZE_BYTES",
    "create_process_result",
    "create_mock_process_result",
    "validate_image_upload",
    "validate_parameters",
]
