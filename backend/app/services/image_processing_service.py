from dataclasses import dataclass

import cv2
import numpy as np
from fastapi import HTTPException, status


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
